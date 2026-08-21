import unittest
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.config import Settings
from app.stream_service import CameraStreamService


class StubDetector:
    def start(self):
        return None

    def status(self):
        return {
            "state": "READY",
            "model": "test.pt",
            "device": "cpu",
            "targetClassIds": [39],
            "confidenceThreshold": 0.45,
            "error": None,
        }


class StreamServiceTests(unittest.TestCase):
    def test_mjpeg_frame_contains_boundary_headers_and_jpeg(self):
        service = CameraStreamService(Settings(), StubDetector())
        jpeg = bytes([255, 216, 255, 217])
        with service._condition:
            service._latest_jpeg = jpeg
            service._sequence = 1

        frames = service.mjpeg_frames()
        chunk = next(frames)
        frames.close()

        self.assertTrue(chunk.startswith(b"--frame\r\n"))
        self.assertIn(b"Content-Type: image/jpeg", chunk)
        self.assertIn(jpeg, chunk)

    def test_initial_status_is_observable(self):
        service = CameraStreamService(Settings(), StubDetector())
        status = service.status()

        self.assertEqual(status["service"]["state"], "OFFLINE")
        self.assertEqual(status["camera"]["state"], "STARTING")
        self.assertEqual(status["detector"]["state"], "READY")


if __name__ == "__main__":
    unittest.main()
