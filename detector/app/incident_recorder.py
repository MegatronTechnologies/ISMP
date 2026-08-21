from __future__ import annotations

import tempfile
import threading
import time
from pathlib import Path
from typing import Any, Callable
from uuid import uuid4

import cv2

from .config import Settings


class IncidentVideoRecorder:
    """Records one bounded incident clip and returns it as an upload payload."""

    def __init__(
        self,
        settings: Settings,
        writer_factory: Callable[..., Any] | None = None,
        recording_id_factory: Callable[[], str] | None = None,
    ) -> None:
        self.fps = settings.incident_video_fps
        self.max_seconds = settings.incident_video_max_seconds
        self.codec = settings.incident_video_codec
        self.extension = settings.incident_video_extension
        self.content_type = "video/webm" if self.extension == "webm" else "video/mp4"
        self._writer_factory = writer_factory or cv2.VideoWriter
        self._recording_id_factory = recording_id_factory or (lambda: f"rec-{uuid4().hex}")
        self._lock = threading.RLock()
        self._writer: Any | None = None
        self._path: Path | None = None
        self._event_id: str | None = None
        self._recording_id: str | None = None
        self._started_at: str | None = None
        self._started_monotonic: float | None = None
        self._detection: dict[str, Any] | None = None
        self._frame_size: tuple[int, int] | None = None
        self._frames_written = 0
        self._last_error: str | None = None

    @property
    def active_event_id(self) -> str | None:
        with self._lock:
            return self._event_id

    def start(
        self,
        event_id: str,
        started_at: str,
        detection: dict[str, Any],
        frame: Any,
        monotonic_at: float | None = None,
    ) -> bool:
        now = time.monotonic() if monotonic_at is None else monotonic_at
        with self._lock:
            if self._event_id == event_id and self._writer is not None:
                return True
            if self._writer is not None:
                self._discard_locked()

            path: Path | None = None
            writer: Any | None = None
            try:
                height, width = frame.shape[:2]
                temporary = tempfile.NamedTemporaryFile(
                    prefix="ismp-incident-",
                    suffix=f".{self.extension}",
                    delete=False,
                )
                temporary.close()
                path = Path(temporary.name)
                writer = self._writer_factory(
                    str(path),
                    cv2.VideoWriter_fourcc(*self.codec),
                    self.fps,
                    (width, height),
                )
                if not writer.isOpened():
                    raise RuntimeError(
                        f"Unable to initialize {self.codec} video writer for .{self.extension}"
                    )
            except Exception as exc:
                if writer is not None:
                    writer.release()
                if path is not None:
                    path.unlink(missing_ok=True)
                self._last_error = f"Incident recording could not start: {exc}"
                return False

            self._writer = writer
            self._path = path
            self._event_id = event_id
            self._recording_id = self._recording_id_factory()
            self._started_at = started_at
            self._started_monotonic = now
            self._detection = {
                **detection,
                "box": list(detection.get("box") or []),
            }
            self._frame_size = (width, height)
            self._frames_written = 0
            self._last_error = None
            return True

    def write_frame(
        self,
        frame: Any,
        captured_at: str,
        monotonic_at: float | None = None,
    ) -> dict[str, Any] | None:
        now = time.monotonic() if monotonic_at is None else monotonic_at
        with self._lock:
            if self._writer is None or self._started_monotonic is None or self._frame_size is None:
                return None

            try:
                width, height = self._frame_size
                output_frame = frame
                if frame.shape[1] != width or frame.shape[0] != height:
                    output_frame = cv2.resize(frame, (width, height))

                elapsed = max(0.0, now - self._started_monotonic)
                bounded_elapsed = min(elapsed, self.max_seconds)
                target_frame_count = max(1, int(bounded_elapsed * self.fps) + 1)
                max_frame_count = max(1, int(self.max_seconds * self.fps))
                target_frame_count = min(target_frame_count, max_frame_count)

                while self._frames_written < target_frame_count:
                    self._writer.write(output_frame)
                    self._frames_written += 1

                if elapsed >= self.max_seconds:
                    return self._finish_locked(captured_at, now)
            except Exception as exc:
                self._last_error = f"Incident recording failed: {exc}"
                self._discard_locked()
            return None

    def finish(
        self,
        ended_at: str,
        monotonic_at: float | None = None,
    ) -> dict[str, Any] | None:
        now = time.monotonic() if monotonic_at is None else monotonic_at
        with self._lock:
            return self._finish_locked(ended_at, now)

    def _finish_locked(self, ended_at: str, now: float) -> dict[str, Any] | None:
        if self._writer is None or self._path is None or self._event_id is None:
            return None

        writer = self._writer
        path = self._path
        event_id = self._event_id
        recording_id = self._recording_id
        started_at = self._started_at
        started_monotonic = self._started_monotonic
        detection = self._detection
        frame_count = self._frames_written

        writer.release()
        self._writer = None

        try:
            video = path.read_bytes()
        except OSError as exc:
            self._last_error = f"Unable to read completed incident recording: {exc}"
            video = b""
        finally:
            path.unlink(missing_ok=True)

        duration = 0.0
        if started_monotonic is not None:
            duration = min(max(0.0, now - started_monotonic), self.max_seconds)

        self._reset_locked()
        if len(video) < 4 or not recording_id or not started_at or not detection:
            if not self._last_error:
                self._last_error = "Completed incident recording is empty"
            return None

        return {
            "kind": "recording",
            "eventId": event_id,
            "recordingId": recording_id,
            "startedAt": started_at,
            "endedAt": ended_at,
            "durationSeconds": round(duration, 3),
            "frameCount": frame_count,
            "contentType": self.content_type,
            "detection": detection,
            "video": video,
        }

    def discard(self) -> None:
        with self._lock:
            self._discard_locked()

    def _discard_locked(self) -> None:
        if self._writer is not None:
            self._writer.release()
        if self._path is not None:
            self._path.unlink(missing_ok=True)
        self._reset_locked()

    def _reset_locked(self) -> None:
        self._writer = None
        self._path = None
        self._event_id = None
        self._recording_id = None
        self._started_at = None
        self._started_monotonic = None
        self._detection = None
        self._frame_size = None
        self._frames_written = 0

    def status(self) -> dict[str, Any]:
        with self._lock:
            return {
                "active": self._writer is not None,
                "eventId": self._event_id,
                "framesWritten": self._frames_written,
                "fps": self.fps,
                "maxSeconds": self.max_seconds,
                "format": self.extension,
                "error": self._last_error,
            }
