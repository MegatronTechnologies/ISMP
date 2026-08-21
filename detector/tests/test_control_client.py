import base64
import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.config import Settings
from app.control_client import EdgeApiError, EdgeControlClient


def edge_status():
    return {
        "service": {"state": "ONLINE", "platform": "Windows"},
        "camera": {"state": "ONLINE", "source": 0, "width": 1280, "height": 720},
        "detector": {"state": "READY", "model": "yolov8n.pt"},
        "stream": {"state": "ONLINE", "sequence": 5},
        "detections": [],
        "heartbeatAt": "2026-08-21T12:00:00+00:00",
    }


class FakeControlClient(EdgeControlClient):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.calls = []

    def _post_json(self, path, payload, headers):
        self.calls.append((path, payload, headers))
        if path.endswith("/register"):
            return {
                "credentials": {
                    "cameraId": payload["cameraId"],
                    "deviceToken": "issued-device-token",
                }
            }
        return {
            "accepted": True,
            "camera": {"lastHeartbeatAt": "2026-08-21T12:00:00+00:00"},
        }


class RejectingControlClient(EdgeControlClient):
    def _post_json(self, path, payload, headers):
        raise EdgeApiError("rejected", 401)


class RecoveringControlClient(FakeControlClient):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.reject_first_heartbeat = True

    def _post_json(self, path, payload, headers):
        if path.endswith("/heartbeat") and self.reject_first_heartbeat:
            self.reject_first_heartbeat = False
            raise EdgeApiError("backend forgot the demo token", 401)
        return super()._post_json(path, payload, headers)


class EvidenceControlClient(FakeControlClient):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.evidence_calls = []

    def _post_jpeg(self, path, jpeg, headers):
        self.evidence_calls.append((path, jpeg, headers))
        return {"accepted": True}


class RecordingControlClient(FakeControlClient):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.binary_calls = []

    def _post_binary(self, path, body, headers, timeout=None):
        self.binary_calls.append((path, body, headers, timeout))
        return {"accepted": True}


class ControlClientTests(unittest.TestCase):
    def make_settings(self, identity_file):
        return Settings(
            central_api_url="http://127.0.0.1:3000/api/v1",
            enrollment_secret="enrollment-secret",
            identity_file=identity_file,
            configured_camera_id="cam-test-1",
        )

    def test_registration_persists_identity_and_sends_authenticated_heartbeat(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            identity_file = Path(temp_dir) / ".device.json"
            client = FakeControlClient(
                self.make_settings(identity_file),
                edge_status,
                edge_version="0.2.0",
            )

            client.sync_once()

            self.assertEqual(len(client.calls), 2)
            register_call, heartbeat_call = client.calls
            self.assertEqual(register_call[0], "/edge/cameras/register")
            self.assertEqual(
                register_call[2]["X-ISMP-Enrollment-Secret"],
                "enrollment-secret",
            )
            self.assertEqual(
                heartbeat_call[2]["Authorization"],
                "Bearer issued-device-token",
            )
            persisted = json.loads(identity_file.read_text(encoding="utf-8"))
            self.assertEqual(persisted["cameraId"], "cam-test-1")
            self.assertEqual(persisted["deviceToken"], "issued-device-token")
            self.assertEqual(client.status()["state"], "ONLINE")
            self.assertNotIn("deviceToken", client.status())

    def test_existing_identity_skips_registration(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            identity_file = Path(temp_dir) / ".device.json"
            identity_file.write_text(
                json.dumps({"cameraId": "cam-test-1", "deviceToken": "saved-token"}),
                encoding="utf-8",
            )
            client = FakeControlClient(
                self.make_settings(identity_file),
                edge_status,
                edge_version="0.2.0",
            )

            client.sync_once()

            self.assertEqual(len(client.calls), 1)
            self.assertIn("/heartbeat", client.calls[0][0])
            self.assertEqual(client.calls[0][2]["Authorization"], "Bearer saved-token")

    def test_rejected_token_is_removed_for_next_registration(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            identity_file = Path(temp_dir) / ".device.json"
            identity_file.write_text(
                json.dumps({"cameraId": "cam-test-1", "deviceToken": "expired-token"}),
                encoding="utf-8",
            )
            client = RejectingControlClient(
                self.make_settings(identity_file),
                edge_status,
                edge_version="0.2.0",
            )

            with self.assertRaises(EdgeApiError):
                client.sync_once()

            persisted = json.loads(identity_file.read_text(encoding="utf-8"))
            self.assertIsNone(persisted["deviceToken"])

    def test_next_sync_re_registers_after_backend_restart(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            identity_file = Path(temp_dir) / ".device.json"
            identity_file.write_text(
                json.dumps({"cameraId": "cam-test-1", "deviceToken": "forgotten-token"}),
                encoding="utf-8",
            )
            client = RecoveringControlClient(
                self.make_settings(identity_file),
                edge_status,
                edge_version="0.2.0",
            )

            with self.assertRaises(EdgeApiError):
                client.sync_once()
            client.sync_once()

            paths = [call[0] for call in client.calls]
            self.assertEqual(paths, [
                "/edge/cameras/register",
                "/edge/cameras/cam-test-1/heartbeat",
            ])
            self.assertEqual(client.status()["state"], "ONLINE")

    def test_detection_evidence_uses_device_token_and_encoded_metadata(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            identity_file = Path(temp_dir) / ".device.json"
            identity_file.write_text(
                json.dumps({"cameraId": "cam-test-1", "deviceToken": "saved-token"}),
                encoding="utf-8",
            )
            client = EvidenceControlClient(
                self.make_settings(identity_file),
                edge_status,
                edge_version="0.3.0",
            )
            evidence = {
                "eventId": "event-test-1",
                "captureId": "capture-test-1",
                "capturedAt": "2026-08-21T12:00:00+00:00",
                "detection": {
                    "classId": 39,
                    "label": "bottle",
                    "confidence": 0.94,
                    "box": [10, 20, 110, 220],
                },
                "jpeg": b"jpeg-bytes",
            }

            client._deliver_detection_evidence(evidence)

            self.assertEqual(len(client.evidence_calls), 1)
            path, jpeg, headers = client.evidence_calls[0]
            self.assertEqual(
                path,
                "/edge/cameras/cam-test-1/detection-events/event-test-1/evidence",
            )
            self.assertEqual(jpeg, b"jpeg-bytes")
            self.assertEqual(headers["Authorization"], "Bearer saved-token")
            self.assertEqual(headers["X-ISMP-Detection-Present"], "true")
            padded_label = headers["X-ISMP-Detection-Label-B64"] + "=="
            self.assertEqual(
                base64.urlsafe_b64decode(padded_label).decode("utf-8"),
                "bottle",
            )
            self.assertEqual(client.status()["incidentDelivery"]["pendingEvidence"], 0)

    def test_completed_recording_uses_the_same_event_and_device_credentials(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            identity_file = Path(temp_dir) / ".device.json"
            identity_file.write_text(
                json.dumps({"cameraId": "cam-test-1", "deviceToken": "saved-token"}),
                encoding="utf-8",
            )
            client = RecordingControlClient(
                self.make_settings(identity_file),
                edge_status,
                edge_version="0.4.0",
            )
            recording = {
                "kind": "recording",
                "eventId": "event-test-1",
                "recordingId": "recording-test-1",
                "startedAt": "2026-08-21T12:00:00+00:00",
                "endedAt": "2026-08-21T12:00:05+00:00",
                "durationSeconds": 5,
                "frameCount": 50,
                "contentType": "video/webm",
                "detection": {
                    "classId": 39,
                    "label": "bottle",
                    "confidence": 0.94,
                    "box": [10, 20, 110, 220],
                },
                "video": b"webm-bytes",
            }

            client._deliver_incident_recording(recording)

            self.assertEqual(len(client.binary_calls), 1)
            path, body, headers, timeout = client.binary_calls[0]
            self.assertEqual(
                path,
                "/edge/cameras/cam-test-1/detection-events/event-test-1/recording",
            )
            self.assertEqual(body, b"webm-bytes")
            self.assertEqual(headers["Authorization"], "Bearer saved-token")
            self.assertEqual(headers["Content-Type"], "video/webm")
            self.assertEqual(headers["X-ISMP-Recording-Frame-Count"], "50")
            self.assertGreaterEqual(timeout, 30)


if __name__ == "__main__":
    unittest.main()
