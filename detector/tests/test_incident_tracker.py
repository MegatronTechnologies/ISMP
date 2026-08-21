import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.config import Settings
from app.incident_tracker import IncidentTracker


DETECTION = {
    "classId": 39,
    "label": "bottle",
    "confidence": 0.94,
    "box": [10, 20, 110, 220],
}


class IncidentTrackerTests(unittest.TestCase):
    def make_tracker(self, **overrides):
        values = {
            "incident_confirm_frames": 3,
            "incident_confirm_window_seconds": 2,
            "incident_rearm_absence_seconds": 3,
            "incident_cooldown_seconds": 30,
            "incident_snapshot_interval_seconds": 1,
            "incident_max_snapshots": 60,
        }
        values.update(overrides)
        settings = Settings(**values)
        event_ids = iter(("event-test-1", "event-test-2"))
        capture_ids = iter(("capture-test-1", "capture-test-2", "capture-test-3", "capture-test-4"))
        return IncidentTracker(
            settings,
            event_id_factory=lambda: next(event_ids),
            capture_id_factory=lambda: next(capture_ids),
        )

    def observe(self, tracker, at, detections=None):
        return tracker.observe(
            [DETECTION] if detections is None else detections,
            b"jpeg",
            f"2026-08-21T12:00:{int(at):02d}.000Z",
            monotonic_at=at,
        )

    def test_three_positive_frames_create_one_event_with_three_timed_snapshots(self):
        tracker = self.make_tracker()

        self.assertEqual(self.observe(tracker, 0.0), [])
        self.assertEqual(self.observe(tracker, 0.2), [])
        first = self.observe(tracker, 0.4)
        self.assertEqual(first[0]["eventId"], "event-test-1")
        self.assertEqual(first[0]["snapshotOffsetSeconds"], 0)
        self.assertEqual(self.observe(tracker, 1.3), [])
        second = self.observe(tracker, 1.41)
        third = self.observe(tracker, 2.41)

        self.assertEqual(second[0]["eventId"], "event-test-1")
        self.assertAlmostEqual(second[0]["snapshotOffsetSeconds"], 1.01)
        self.assertAlmostEqual(third[0]["snapshotOffsetSeconds"], 2.01)
        self.assertEqual(tracker.status()["capturedEvidence"], 3)
        self.assertEqual(self.observe(tracker, 3.0), [])

    def test_snapshots_continue_at_the_configured_interval_while_event_is_active(self):
        tracker = self.make_tracker(incident_snapshot_interval_seconds=0.5)
        self.observe(tracker, 0.0)
        self.observe(tracker, 0.1)
        first = self.observe(tracker, 0.2)
        second = self.observe(tracker, 0.71)
        third = self.observe(tracker, 1.22)
        fourth = self.observe(tracker, 1.73)

        self.assertEqual(first[0]["snapshotOffsetSeconds"], 0)
        self.assertAlmostEqual(second[0]["snapshotOffsetSeconds"], 0.51)
        self.assertAlmostEqual(third[0]["snapshotOffsetSeconds"], 1.02)
        self.assertAlmostEqual(fourth[0]["snapshotOffsetSeconds"], 1.53)
        self.assertEqual(tracker.status()["capturedEvidence"], 4)
        self.assertEqual(tracker.status()["snapshotIntervalSeconds"], 0.5)

    def test_rearms_after_three_continuous_seconds_without_a_detection(self):
        tracker = self.make_tracker(incident_cooldown_seconds=0)
        self.observe(tracker, 0.0)
        self.observe(tracker, 0.1)
        self.observe(tracker, 0.2)

        self.observe(tracker, 0.3, [])
        self.observe(tracker, 3.2, [])
        self.assertTrue(tracker.status()["active"])
        self.observe(tracker, 3.31, [])
        self.assertFalse(tracker.status()["active"])

        self.assertEqual(self.observe(tracker, 3.4), [])
        self.assertEqual(self.observe(tracker, 3.5), [])
        next_event = self.observe(tracker, 3.6)
        self.assertEqual(next_event[0]["eventId"], "event-test-2")

    def test_timed_evidence_continues_during_a_short_detection_gap(self):
        tracker = self.make_tracker()
        self.observe(tracker, 0.0)
        self.observe(tracker, 0.1)
        self.observe(tracker, 0.2)

        second = self.observe(tracker, 1.21, [])
        third = self.observe(tracker, 2.21, [])

        self.assertFalse(second[0]["detectionPresent"])
        self.assertFalse(third[0]["detectionPresent"])
        self.assertEqual(tracker.status()["capturedEvidence"], 3)
        self.assertTrue(tracker.status()["active"])

    def test_thirty_second_cooldown_blocks_duplicate_incidents(self):
        tracker = self.make_tracker()
        self.observe(tracker, 0.0)
        self.observe(tracker, 0.1)
        self.observe(tracker, 0.2)
        self.observe(tracker, 0.3, [])
        self.observe(tracker, 3.3, [])

        self.observe(tracker, 4.0)
        self.observe(tracker, 4.1)
        self.assertEqual(self.observe(tracker, 4.2), [])

        self.observe(tracker, 30.3)
        self.observe(tracker, 30.4)
        next_event = self.observe(tracker, 30.5)
        self.assertEqual(next_event[0]["eventId"], "event-test-2")


if __name__ == "__main__":
    unittest.main()
