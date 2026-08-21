from __future__ import annotations

import threading
import time
from collections import deque
from typing import Any, Callable
from uuid import uuid4

from .config import Settings


class IncidentTracker:
    """Turns noisy per-frame detections into one re-armable incident event."""

    def __init__(
        self,
        settings: Settings,
        event_id_factory: Callable[[], str] | None = None,
        capture_id_factory: Callable[[], str] | None = None,
    ) -> None:
        self.confirm_frames = settings.incident_confirm_frames
        self.confirm_window_seconds = settings.incident_confirm_window_seconds
        self.rearm_absence_seconds = settings.incident_rearm_absence_seconds
        self.cooldown_seconds = settings.incident_cooldown_seconds
        self.snapshot_offsets = settings.incident_snapshot_offsets_seconds
        self._event_id_factory = event_id_factory or (lambda: f"evt-{uuid4().hex}")
        self._capture_id_factory = capture_id_factory or (lambda: f"cap-{uuid4().hex}")
        self._lock = threading.RLock()
        self._positive_frames: deque[float] = deque()
        self._active_event_id: str | None = None
        self._active_started_at: float | None = None
        self._missing_since: float | None = None
        self._last_event_started_at: float | None = None
        self._next_snapshot_index = 0
        self._last_detection: dict[str, Any] | None = None

    def observe(
        self,
        detections: list[dict[str, Any]],
        jpeg: bytes | None,
        captured_at: str,
        monotonic_at: float | None = None,
    ) -> list[dict[str, Any]]:
        now = time.monotonic() if monotonic_at is None else monotonic_at
        strongest = max(detections, key=lambda item: item.get("confidence", 0), default=None)

        with self._lock:
            self._expire_positive_frames(now)

            if strongest is None:
                if self._active_event_id and self._missing_since is None:
                    self._missing_since = now
                elif (
                    self._active_event_id
                    and self._missing_since is not None
                    and now - self._missing_since >= self.rearm_absence_seconds
                ):
                    self._deactivate()
                return self._capture_if_due(jpeg, captured_at, now, detection_present=False)

            if (
                self._active_event_id
                and self._missing_since is not None
                and now - self._missing_since >= self.rearm_absence_seconds
            ):
                self._deactivate()

            self._missing_since = None
            self._last_detection = strongest
            self._positive_frames.append(now)
            self._expire_positive_frames(now)

            cooldown_complete = (
                self._last_event_started_at is None
                or now - self._last_event_started_at >= self.cooldown_seconds
            )
            if (
                self._active_event_id is None
                and cooldown_complete
                and len(self._positive_frames) >= self.confirm_frames
            ):
                self._active_event_id = self._event_id_factory()
                self._active_started_at = now
                self._last_event_started_at = now
                self._next_snapshot_index = 0
                self._positive_frames.clear()

            return self._capture_if_due(jpeg, captured_at, now, detection_present=True)

    def _capture_if_due(
        self,
        jpeg: bytes | None,
        captured_at: str,
        now: float,
        detection_present: bool,
    ) -> list[dict[str, Any]]:
        if self._active_event_id is None or jpeg is None or self._last_detection is None:
            return []
        if self._next_snapshot_index >= len(self.snapshot_offsets):
            return []

        active_started_at = self._active_started_at if self._active_started_at is not None else now
        elapsed = now - active_started_at
        offset = self.snapshot_offsets[self._next_snapshot_index]
        if elapsed < offset:
            return []

        evidence = {
            "eventId": self._active_event_id,
            "captureId": self._capture_id_factory(),
            "capturedAt": captured_at,
            "snapshotOffsetSeconds": offset,
            "detectionPresent": detection_present,
            "detection": {
                "classId": self._last_detection["classId"],
                "label": self._last_detection["label"],
                "confidence": self._last_detection["confidence"],
                "box": list(self._last_detection["box"]),
            },
            "jpeg": jpeg,
        }
        self._next_snapshot_index += 1
        return [evidence]

    def mark_absent(self, monotonic_at: float | None = None) -> None:
        now = time.monotonic() if monotonic_at is None else monotonic_at
        with self._lock:
            self._expire_positive_frames(now)
            if self._active_event_id and self._missing_since is None:
                self._missing_since = now

    def status(self) -> dict[str, Any]:
        with self._lock:
            return {
                "active": self._active_event_id is not None,
                "activeEventId": self._active_event_id,
                "capturedEvidence": self._next_snapshot_index,
                "configuredEvidence": len(self.snapshot_offsets),
                "rearmAbsenceSeconds": self.rearm_absence_seconds,
                "cooldownSeconds": self.cooldown_seconds,
            }

    def _expire_positive_frames(self, now: float) -> None:
        cutoff = now - self.confirm_window_seconds
        while self._positive_frames and self._positive_frames[0] < cutoff:
            self._positive_frames.popleft()

    def _deactivate(self) -> None:
        self._active_event_id = None
        self._active_started_at = None
        self._missing_since = None
        self._next_snapshot_index = 0
        self._last_detection = None
        self._positive_frames.clear()
