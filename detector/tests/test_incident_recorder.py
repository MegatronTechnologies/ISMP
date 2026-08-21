import sys
import unittest
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.config import Settings
from app.incident_recorder import IncidentVideoRecorder


DETECTION = {
    "classId": 39,
    "label": "bottle",
    "confidence": 0.94,
    "box": [10, 20, 110, 220],
}


class FakeWriter:
    def __init__(self, path, _fourcc, _fps, _size):
        self.path = Path(path)
        self.frames = 0
        self.opened = True

    def isOpened(self):
        return self.opened

    def write(self, _frame):
        self.frames += 1

    def release(self):
        if self.opened:
            self.path.write_bytes(b"\x1a\x45\xdf\xa3" + bytes([self.frames % 256]))
            self.opened = False


class IncidentVideoRecorderTests(unittest.TestCase):
    def make_recorder(self, **overrides):
        values = {
            "incident_video_fps": 2,
            "incident_video_max_seconds": 10,
            "incident_video_codec": "VP80",
            "incident_video_extension": "webm",
        }
        values.update(overrides)
        return IncidentVideoRecorder(
            Settings(**values),
            writer_factory=FakeWriter,
            recording_id_factory=lambda: "recording-test-1",
        )

    def test_records_a_time_aligned_clip_and_returns_an_upload_payload(self):
        recorder = self.make_recorder()
        frame = np.zeros((240, 320, 3), dtype=np.uint8)

        self.assertTrue(recorder.start(
            "event-test-1",
            "2026-08-21T12:00:00.000Z",
            DETECTION,
            frame,
            monotonic_at=10,
        ))
        self.assertIsNone(recorder.write_frame(frame, "2026-08-21T12:00:00.000Z", 10))
        self.assertIsNone(recorder.write_frame(frame, "2026-08-21T12:00:01.000Z", 11))
        self.assertIsNone(recorder.write_frame(frame, "2026-08-21T12:00:02.000Z", 12))
        payload = recorder.finish("2026-08-21T12:00:02.000Z", 12)

        self.assertEqual(payload["kind"], "recording")
        self.assertEqual(payload["eventId"], "event-test-1")
        self.assertEqual(payload["recordingId"], "recording-test-1")
        self.assertEqual(payload["durationSeconds"], 2)
        self.assertEqual(payload["frameCount"], 5)
        self.assertEqual(payload["contentType"], "video/webm")
        self.assertTrue(payload["video"].startswith(b"\x1a\x45\xdf\xa3"))
        self.assertFalse(recorder.status()["active"])

    def test_max_duration_finishes_the_clip_automatically(self):
        recorder = self.make_recorder(incident_video_max_seconds=2)
        frame = np.zeros((120, 160, 3), dtype=np.uint8)
        recorder.start(
            "event-test-1",
            "2026-08-21T12:00:00.000Z",
            DETECTION,
            frame,
            monotonic_at=0,
        )
        recorder.write_frame(frame, "2026-08-21T12:00:00.000Z", 0)
        payload = recorder.write_frame(frame, "2026-08-21T12:00:02.100Z", 2.1)

        self.assertEqual(payload["durationSeconds"], 2)
        self.assertEqual(payload["frameCount"], 4)
        self.assertFalse(recorder.status()["active"])

    def test_writer_start_failure_is_reported_without_crashing_capture(self):
        def failing_writer(*_args, **_kwargs):
            raise RuntimeError("codec unavailable")

        recorder = IncidentVideoRecorder(
            Settings(),
            writer_factory=failing_writer,
        )
        frame = np.zeros((120, 160, 3), dtype=np.uint8)

        self.assertFalse(recorder.start(
            "event-test-1",
            "2026-08-21T12:00:00.000Z",
            DETECTION,
            frame,
            monotonic_at=0,
        ))
        self.assertFalse(recorder.status()["active"])
        self.assertIn("codec unavailable", recorder.status()["error"])


if __name__ == "__main__":
    unittest.main()
