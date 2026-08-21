from __future__ import annotations

import platform
import threading
import time
from datetime import datetime, timezone
from typing import Any, Callable, Generator

import cv2

from .config import CameraSource, Settings
from .incident_recorder import IncidentVideoRecorder
from .incident_tracker import IncidentTracker
from .yolo_detector import YoloDetector


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


class CameraStreamService:
    """Owns one camera, runs YOLO, and publishes the latest JPEG frame."""

    def __init__(self, settings: Settings, detector: YoloDetector) -> None:
        self.settings = settings
        self.detector = detector
        self.incident_tracker = IncidentTracker(settings)
        self.incident_recorder = IncidentVideoRecorder(settings)
        self._incident_sink: Callable[[dict[str, Any]], bool] | None = None
        self._source: CameraSource = settings.camera_source
        self._capture: cv2.VideoCapture | None = None
        self._thread: threading.Thread | None = None
        self._stop_event = threading.Event()
        self._reconnect_event = threading.Event()
        self._condition = threading.Condition(threading.RLock())
        self._latest_jpeg: bytes | None = None
        self._sequence = 0
        self._clients = 0
        self._camera_state = "STARTING"
        self._camera_backend = "NONE"
        self._camera_error: str | None = None
        self._last_frame_at: str | None = None
        self._capture_fps = 0.0
        self._inference_ms = 0.0
        self._detections: list[dict[str, Any]] = []
        self._actual_width = 0
        self._actual_height = 0
        self._started_at = _utc_now()

    def set_incident_sink(self, sink: Callable[[dict[str, Any]], bool]) -> None:
        self._incident_sink = sink

    def start(self) -> None:
        if self._thread and self._thread.is_alive():
            return
        self._stop_event.clear()
        self.detector.start()
        self._thread = threading.Thread(
            target=self._capture_loop,
            name="ismp-camera-stream",
            daemon=True,
        )
        self._thread.start()

    def stop(self) -> None:
        self._stop_event.set()
        self._reconnect_event.set()
        with self._condition:
            self._condition.notify_all()
        if self._thread:
            self._thread.join(timeout=5)
        self._release_capture()

    def select_source(self, source: CameraSource) -> None:
        with self._condition:
            self._source = source
            self._camera_state = "RECONNECTING"
            self._camera_error = None
        self._reconnect_event.set()

    def _open_capture(self) -> cv2.VideoCapture | None:
        source = self._source
        backend_map = {
            "DSHOW": cv2.CAP_DSHOW,
            "MSMF": cv2.CAP_MSMF,
            "ANY": cv2.CAP_ANY,
        }
        if platform.system() == "Windows" and isinstance(source, int):
            backend_names = (
                ["MSMF", "DSHOW", "ANY"]
                if self.settings.camera_backend == "AUTO"
                else [self.settings.camera_backend]
            )
        else:
            backend_names = ["ANY"]

        for backend_name in backend_names:
            capture = cv2.VideoCapture(source, backend_map[backend_name])
            capture.set(cv2.CAP_PROP_FRAME_WIDTH, self.settings.camera_width)
            capture.set(cv2.CAP_PROP_FRAME_HEIGHT, self.settings.camera_height)
            capture.set(cv2.CAP_PROP_FPS, self.settings.camera_fps)
            if capture.isOpened():
                self._camera_backend = backend_name
                return capture
            capture.release()

        self._camera_backend = "NONE"
        return None

    def _release_capture(self) -> None:
        capture = self._capture
        self._capture = None
        if capture is not None:
            capture.release()

    def _set_offline(self, error: str) -> None:
        ended_event_id = self.incident_tracker.end_active_event()
        if ended_event_id:
            self._submit_incident_payload(self.incident_recorder.finish(_utc_now()))
        with self._condition:
            self._camera_state = "OFFLINE"
            self._camera_error = error
            self._latest_jpeg = None
            self._detections = []
            self._condition.notify_all()

    def _capture_loop(self) -> None:
        frame_counter = 0
        fps_window_started = time.perf_counter()

        while not self._stop_event.is_set():
            if self._capture is None or self._reconnect_event.is_set():
                self._reconnect_event.clear()
                self._release_capture()
                self._capture = self._open_capture()
                if self._capture is None:
                    self._set_offline(f"Unable to open camera source {self._source!r}")
                    self._stop_event.wait(self.settings.camera_reconnect_seconds)
                    continue
                with self._condition:
                    self._camera_state = "ONLINE"
                    self._camera_error = None
                frame_counter = 0
                fps_window_started = time.perf_counter()

            ok, frame = self._capture.read()
            if not ok or frame is None:
                self._set_offline("Camera opened but did not return a frame")
                self._release_capture()
                self._stop_event.wait(self.settings.camera_reconnect_seconds)
                continue

            annotated, detections, inference_ms = self.detector.process(frame)
            encode_ok, encoded = cv2.imencode(
                ".jpg",
                annotated,
                [int(cv2.IMWRITE_JPEG_QUALITY), self.settings.jpeg_quality],
            )
            if not encode_ok:
                continue

            jpeg = encoded.tobytes()
            captured_at = _utc_now()
            observed_at = time.monotonic()
            event_before_observation = self.incident_tracker.active_event_id
            incident_evidence = self.incident_tracker.observe(
                detections,
                jpeg,
                captured_at,
                monotonic_at=observed_at,
            )
            active_event_id = self.incident_tracker.active_event_id

            if active_event_id and active_event_id != event_before_observation:
                detection = (
                    incident_evidence[0].get("detection")
                    if incident_evidence
                    else self.incident_tracker.current_detection
                )
                if detection:
                    self.incident_recorder.start(
                        active_event_id,
                        captured_at,
                        detection,
                        annotated,
                        monotonic_at=observed_at,
                    )

            completed_recording = self.incident_recorder.write_frame(
                annotated,
                captured_at,
                monotonic_at=observed_at,
            )
            if (
                event_before_observation
                and active_event_id is None
                and self.incident_recorder.active_event_id == event_before_observation
            ):
                completed_recording = self.incident_recorder.finish(
                    captured_at,
                    monotonic_at=observed_at,
                )

            frame_counter += 1
            elapsed = time.perf_counter() - fps_window_started
            if elapsed >= 1:
                self._capture_fps = frame_counter / elapsed
                frame_counter = 0
                fps_window_started = time.perf_counter()

            height, width = annotated.shape[:2]
            with self._condition:
                self._latest_jpeg = jpeg
                self._sequence += 1
                self._last_frame_at = captured_at
                self._camera_state = "ONLINE"
                self._actual_width = width
                self._actual_height = height
                self._inference_ms = inference_ms
                self._detections = detections
                self._condition.notify_all()

            for evidence in incident_evidence:
                self._submit_incident_payload(evidence)
            self._submit_incident_payload(completed_recording)

        self._submit_incident_payload(self.incident_recorder.finish(_utc_now()))
        self._release_capture()

    def _submit_incident_payload(self, payload: dict[str, Any] | None) -> None:
        if not payload or not self._incident_sink:
            return
        try:
            self._incident_sink(payload)
        except Exception:
            # Incident delivery must never stop camera capture or streaming.
            return

    def mjpeg_frames(self) -> Generator[bytes, None, None]:
        previous_sequence = -1
        with self._condition:
            self._clients += 1
        try:
            while not self._stop_event.is_set():
                with self._condition:
                    self._condition.wait_for(
                        lambda: self._sequence != previous_sequence or self._stop_event.is_set(),
                        timeout=2,
                    )
                    if self._stop_event.is_set():
                        break
                    if self._latest_jpeg is None or self._sequence == previous_sequence:
                        continue
                    frame = self._latest_jpeg
                    previous_sequence = self._sequence
                yield (
                    b"--frame\r\n"
                    b"Content-Type: image/jpeg\r\n"
                    + f"Content-Length: {len(frame)}\r\n\r\n".encode("ascii")
                    + frame
                    + b"\r\n"
                )
        finally:
            with self._condition:
                self._clients = max(0, self._clients - 1)

    def status(self) -> dict[str, Any]:
        with self._condition:
            detector_status = self.detector.status()
            detector_status.update(
                {
                    "inferenceMs": round(self._inference_ms, 1),
                    "inferenceFps": round(1000 / self._inference_ms, 1)
                    if self._inference_ms > 0
                    else 0,
                }
            )
            return {
                "service": {
                    "state": "ONLINE" if self._thread and self._thread.is_alive() else "OFFLINE",
                    "startedAt": self._started_at,
                    "platform": platform.system(),
                },
                "camera": {
                    "state": self._camera_state,
                    "source": self._source,
                    "name": self.settings.camera_name,
                    "backend": self._camera_backend,
                    "width": self._actual_width,
                    "height": self._actual_height,
                    "captureFps": round(self._capture_fps, 1),
                    "lastFrameAt": self._last_frame_at,
                    "error": self._camera_error,
                },
                "detector": detector_status,
                "stream": {
                    "state": "ONLINE" if self._latest_jpeg else "WAITING",
                    "clients": self._clients,
                    "sequence": self._sequence,
                    "jpegQuality": self.settings.jpeg_quality,
                },
                "detections": list(self._detections),
                "incidentDetection": {
                    **self.incident_tracker.status(),
                    "recording": self.incident_recorder.status(),
                },
                "heartbeatAt": _utc_now(),
            }
