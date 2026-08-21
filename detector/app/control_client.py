from __future__ import annotations

import json
import os
import platform
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable
from urllib.error import HTTPError, URLError
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
        self._stop_event = threading.Event()
        self._lock = threading.RLock()
        self._state = "STARTING"
        self._error: str | None = None
        self._last_attempt_at: str | None = None
        self._last_success_at: str | None = None
        self._consecutive_failures = 0

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

    def stop(self) -> None:
        self._stop_event.set()
        if self._thread:
            self._thread.join(timeout=self.settings.central_timeout_seconds + 2)
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

        identity = self._ensure_identity()
        with self._lock:
            self._last_attempt_at = _utc_now()

        if not identity.get("deviceToken"):
            self._register(identity)

        try:
            response = self._post_json(
                f"/edge/cameras/{identity['cameraId']}/heartbeat",
                self.status_provider(),
                {"Authorization": f"Bearer {identity['deviceToken']}"},
            )
        except EdgeApiError as exc:
            if exc.status_code in {401, 404}:
                identity["deviceToken"] = None
                self._save_identity(identity)
            raise

        with self._lock:
            self._state = "ONLINE"
            self._error = None
            self._last_success_at = response.get("camera", {}).get("lastHeartbeatAt") or _utc_now()
            self._consecutive_failures = 0

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
            }
