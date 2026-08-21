from __future__ import annotations

import base64
import json
import os
import platform
import queue
import threading
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen
from uuid import uuid4

from .config import Settings


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


class EdgeApiError(RuntimeError):
    def __init__(self, message: str, status_code: int | None = None) -> None:
        super().__init__(message)
        self.status_code = status_code


class EdgeControlClient:
    """Registers this edge device and sends authenticated status heartbeats."""

    def __init__(
        self,
        settings: Settings,
        status_provider: Callable[[], dict[str, Any]],
        edge_version: str,
    ) -> None:
        self.settings = settings
        self.status_provider = status_provider
        self.edge_version = edge_version
        self._identity: dict[str, str | None] | None = None
        self._thread: threading.Thread | None = None
        self._event_thread: threading.Thread | None = None
        self._stop_event = threading.Event()
        self._lock = threading.RLock()
        self._auth_lock = threading.RLock()
        self._event_queue: queue.Queue[dict[str, Any]] = queue.Queue(
            maxsize=settings.incident_event_queue_size
        )
        self._state = "STARTING"
        self._error: str | None = None
        self._last_attempt_at: str | None = None
        self._last_success_at: str | None = None
        self._consecutive_failures = 0
        self._delivered_incident_evidence = 0
        self._delivered_incident_recordings = 0
        self._dropped_incident_evidence = 0
        self._last_incident_success_at: str | None = None
        self._last_incident_error: str | None = None

    @property
    def enabled(self) -> bool:
        return bool(self.settings.central_api_url and self.settings.enrollment_secret)

    def start(self) -> None:
        if not self.enabled:
            with self._lock:
                self._state = "DISABLED"
                self._error = "Central enrollment is not configured"
            return
        if self._thread and self._thread.is_alive():
            return

        self._ensure_identity()
        self._stop_event.clear()
        self._thread = threading.Thread(
            target=self._loop,
            name="ismp-central-heartbeat",
            daemon=True,
        )
        self._thread.start()
        self._event_thread = threading.Thread(
            target=self._event_loop,
            name="ismp-incident-delivery",
            daemon=True,
        )
        self._event_thread.start()

    def stop(self) -> None:
        delivery_deadline = time.monotonic() + max(10, self.settings.central_timeout_seconds + 5)
        while self._event_queue.unfinished_tasks and time.monotonic() < delivery_deadline:
            time.sleep(0.05)
        self._stop_event.set()
        if self._thread:
            self._thread.join(timeout=self.settings.central_timeout_seconds + 2)
        if self._event_thread:
            self._event_thread.join(timeout=self.settings.central_timeout_seconds + 2)
        with self._lock:
            if self._state != "DISABLED":
                self._state = "STOPPED"

    def _loop(self) -> None:
        while not self._stop_event.is_set():
            try:
                self.sync_once()
            except EdgeApiError as exc:
                with self._lock:
                    self._state = "DEGRADED"
                    self._error = str(exc)
                    self._consecutive_failures += 1
            except Exception as exc:  # keep camera streaming on control-plane failure
                with self._lock:
                    self._state = "DEGRADED"
                    self._error = str(exc)
                    self._consecutive_failures += 1
            self._stop_event.wait(self.settings.heartbeat_seconds)

    def sync_once(self) -> None:
        if not self.enabled:
            raise EdgeApiError("Central enrollment is not configured")

        with self._lock:
            self._last_attempt_at = _utc_now()

        camera_id, device_token = self._device_credentials()

        try:
            response = self._post_json(
                f"/edge/cameras/{camera_id}/heartbeat",
                self.status_provider(),
                {"Authorization": f"Bearer {device_token}"},
            )
        except EdgeApiError as exc:
            if exc.status_code in {401, 404}:
                self._invalidate_device_token(device_token)
            raise

        with self._lock:
            self._state = "ONLINE"
            self._error = None
            self._last_success_at = response.get("camera", {}).get("lastHeartbeatAt") or _utc_now()
            self._consecutive_failures = 0

    def submit_incident_payload(self, payload: dict[str, Any]) -> bool:
        if not self.enabled:
            with self._lock:
                self._dropped_incident_evidence += 1
                self._last_incident_error = "Central enrollment is not configured"
            return False
        try:
            self._event_queue.put_nowait(payload)
            return True
        except queue.Full:
            with self._lock:
                self._dropped_incident_evidence += 1
                self._last_incident_error = "Incident delivery queue is full"
            return False

    def submit_detection_evidence(self, evidence: dict[str, Any]) -> bool:
        return self.submit_incident_payload(evidence)

    def _event_loop(self) -> None:
        while not self._stop_event.is_set():
            try:
                payload = self._event_queue.get(timeout=0.5)
            except queue.Empty:
                continue

            delivered = False
            for attempt in range(1, self.settings.incident_event_max_attempts + 1):
                if self._stop_event.is_set():
                    break
                try:
                    self._deliver_incident_payload(payload)
                    delivered = True
                    with self._lock:
                        if payload.get("kind") == "recording":
                            self._delivered_incident_recordings += 1
                        else:
                            self._delivered_incident_evidence += 1
                        self._last_incident_success_at = _utc_now()
                        self._last_incident_error = None
                    break
                except EdgeApiError as exc:
                    with self._lock:
                        self._last_incident_error = str(exc)
                    if attempt < self.settings.incident_event_max_attempts:
                        self._stop_event.wait(self.settings.incident_event_retry_seconds)
                except Exception as exc:  # keep capture alive on any delivery failure
                    with self._lock:
                        self._last_incident_error = str(exc)
                    if attempt < self.settings.incident_event_max_attempts:
                        self._stop_event.wait(self.settings.incident_event_retry_seconds)

            if not delivered:
                with self._lock:
                    self._dropped_incident_evidence += 1
            self._event_queue.task_done()

    def _deliver_incident_payload(self, payload: dict[str, Any]) -> dict[str, Any]:
        if payload.get("kind") == "recording":
            return self._deliver_incident_recording(payload)
        return self._deliver_detection_evidence(payload)

    @staticmethod
    def _detection_headers(detection: dict[str, Any]) -> dict[str, str]:
        encoded_label = base64.urlsafe_b64encode(
            str(detection["label"]).encode("utf-8")
        ).decode("ascii").rstrip("=")
        return {
            "X-ISMP-Detection-Class-ID": str(detection["classId"]),
            "X-ISMP-Detection-Label-B64": encoded_label,
            "X-ISMP-Detection-Confidence": str(detection["confidence"]),
            "X-ISMP-Detection-Box": json.dumps(detection["box"], separators=(",", ":")),
        }

    def _deliver_detection_evidence(self, evidence: dict[str, Any]) -> dict[str, Any]:
        camera_id, device_token = self._device_credentials()
        detection = evidence["detection"]
        path = (
            f"/edge/cameras/{quote(camera_id, safe='')}/detection-events/"
            f"{quote(str(evidence['eventId']), safe='')}/evidence"
        )
        headers = {
            "Authorization": f"Bearer {device_token}",
            "Content-Type": "image/jpeg",
            "X-ISMP-Capture-ID": str(evidence["captureId"]),
            "X-ISMP-Captured-At": str(evidence["capturedAt"]),
            "X-ISMP-Detection-Present": "true" if evidence.get("detectionPresent", True) else "false",
            **self._detection_headers(detection),
        }
        try:
            return self._post_jpeg(path, evidence["jpeg"], headers)
        except EdgeApiError as exc:
            if exc.status_code in {401, 404}:
                self._invalidate_device_token(device_token)
            raise

    def _deliver_incident_recording(self, recording: dict[str, Any]) -> dict[str, Any]:
        camera_id, device_token = self._device_credentials()
        path = (
            f"/edge/cameras/{quote(camera_id, safe='')}/detection-events/"
            f"{quote(str(recording['eventId']), safe='')}/recording"
        )
        headers = {
            "Authorization": f"Bearer {device_token}",
            "Content-Type": str(recording.get("contentType") or "video/webm"),
            "X-ISMP-Recording-ID": str(recording["recordingId"]),
            "X-ISMP-Recording-Started-At": str(recording["startedAt"]),
            "X-ISMP-Recording-Ended-At": str(recording["endedAt"]),
            "X-ISMP-Recording-Duration-Seconds": str(recording["durationSeconds"]),
            "X-ISMP-Recording-Frame-Count": str(recording["frameCount"]),
            **self._detection_headers(recording["detection"]),
        }
        try:
            return self._post_binary(
                path,
                recording["video"],
                headers,
                timeout=max(30, self.settings.central_timeout_seconds),
            )
        except EdgeApiError as exc:
            if exc.status_code in {401, 404}:
                self._invalidate_device_token(device_token)
            raise

    def _device_credentials(self) -> tuple[str, str]:
        with self._auth_lock:
            identity = self._ensure_identity()
            if not identity.get("deviceToken"):
                self._register(identity)
            return str(identity["cameraId"]), str(identity["deviceToken"])

    def _invalidate_device_token(self, rejected_token: str) -> None:
        with self._auth_lock:
            identity = self._ensure_identity()
            if identity.get("deviceToken") == rejected_token:
                identity["deviceToken"] = None
                self._save_identity(identity)

    def _register(self, identity: dict[str, str | None]) -> None:
        with self._lock:
            self._state = "REGISTERING"

        response = self._post_json(
            "/edge/cameras/register",
            {
                "cameraId": identity["cameraId"],
                "name": self.settings.camera_name,
                "platform": platform.system(),
                "edgeVersion": self.edge_version,
            },
            {"X-ISMP-Enrollment-Secret": self.settings.enrollment_secret},
        )
        credentials = response.get("credentials") or {}
        camera_id = credentials.get("cameraId")
        device_token = credentials.get("deviceToken")
        if not camera_id or not device_token:
            raise EdgeApiError("Central registration returned incomplete credentials")

        identity["cameraId"] = str(camera_id)
        identity["deviceToken"] = str(device_token)
        self._save_identity(identity)

    def _ensure_identity(self) -> dict[str, str | None]:
        if self._identity is not None:
            return self._identity

        identity_path = self.settings.identity_file
        loaded: dict[str, Any] = {}
        if identity_path.exists():
            try:
                loaded = json.loads(identity_path.read_text(encoding="utf-8"))
            except (OSError, ValueError, TypeError):
                loaded = {}

        configured_id = self.settings.configured_camera_id or None
        loaded_id = loaded.get("cameraId") if isinstance(loaded.get("cameraId"), str) else None
        camera_id = configured_id or loaded_id or f"cam-{uuid4().hex}"
        keep_token = not configured_id or configured_id == loaded_id
        device_token = loaded.get("deviceToken") if keep_token and isinstance(loaded.get("deviceToken"), str) else None

        self._identity = {"cameraId": camera_id, "deviceToken": device_token}
        self._save_identity(self._identity)
        return self._identity

    def _save_identity(self, identity: dict[str, str | None]) -> None:
        identity_path = self.settings.identity_file
        identity_path.parent.mkdir(parents=True, exist_ok=True)
        temporary_path = Path(f"{identity_path}.tmp")
        temporary_path.write_text(json.dumps(identity, indent=2), encoding="utf-8")
        os.replace(temporary_path, identity_path)
        if os.name != "nt":
            identity_path.chmod(0o600)

    def _post_json(
        self,
        path: str,
        payload: dict[str, Any],
        headers: dict[str, str],
    ) -> dict[str, Any]:
        data = json.dumps(payload).encode("utf-8")
        request = Request(
            f"{self.settings.central_api_url}{path}",
            data=data,
            method="POST",
            headers={"Content-Type": "application/json", **headers},
        )
        try:
            with urlopen(request, timeout=self.settings.central_timeout_seconds) as response:
                return json.loads(response.read().decode("utf-8"))
        except HTTPError as exc:
            try:
                body = json.loads(exc.read().decode("utf-8"))
                message = body.get("message") or body.get("error") or str(exc)
            except (ValueError, UnicodeDecodeError):
                message = str(exc)
            raise EdgeApiError(f"Central API HTTP {exc.code}: {message}", exc.code) from exc
        except URLError as exc:
            raise EdgeApiError(f"Central API unavailable: {exc.reason}") from exc
        except (ValueError, UnicodeDecodeError) as exc:
            raise EdgeApiError("Central API returned invalid JSON") from exc

    def _post_jpeg(
        self,
        path: str,
        jpeg: bytes,
        headers: dict[str, str],
    ) -> dict[str, Any]:
        return self._post_binary(path, jpeg, headers)

    def _post_binary(
        self,
        path: str,
        body: bytes,
        headers: dict[str, str],
        timeout: float | None = None,
    ) -> dict[str, Any]:
        request = Request(
            f"{self.settings.central_api_url}{path}",
            data=body,
            method="POST",
            headers=headers,
        )
        try:
            with urlopen(
                request,
                timeout=timeout or self.settings.central_timeout_seconds,
            ) as response:
                return json.loads(response.read().decode("utf-8"))
        except HTTPError as exc:
            try:
                body = json.loads(exc.read().decode("utf-8"))
                message = body.get("message") or body.get("error") or str(exc)
            except (ValueError, UnicodeDecodeError):
                message = str(exc)
            raise EdgeApiError(f"Central API HTTP {exc.code}: {message}", exc.code) from exc
        except URLError as exc:
            raise EdgeApiError(f"Central API unavailable: {exc.reason}") from exc
        except (ValueError, UnicodeDecodeError) as exc:
            raise EdgeApiError("Central API returned invalid JSON") from exc

    def status(self) -> dict[str, Any]:
        with self._lock:
            camera_id = self._identity.get("cameraId") if self._identity else None
            return {
                "state": self._state,
                "cameraId": camera_id,
                "apiUrl": self.settings.central_api_url or None,
                "lastAttemptAt": self._last_attempt_at,
                "lastSuccessAt": self._last_success_at,
                "consecutiveFailures": self._consecutive_failures,
                "error": self._error,
                "incidentDelivery": {
                    "pendingEvidence": self._event_queue.qsize(),
                    "deliveredEvidence": self._delivered_incident_evidence,
                    "deliveredRecordings": self._delivered_incident_recordings,
                    "droppedEvidence": self._dropped_incident_evidence,
                    "lastSuccessAt": self._last_incident_success_at,
                    "error": self._last_incident_error,
                },
            }
