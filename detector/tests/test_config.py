import unittest
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.config import Settings, _camera_source, _float_list, _int_list


class ConfigTests(unittest.TestCase):
    def test_camera_source_accepts_index(self):
        self.assertEqual(_camera_source("0"), 0)
        self.assertEqual(_camera_source(" 2 "), 2)

    def test_camera_source_accepts_rtsp_url(self):
        source = "rtsp://camera.local/live"
        self.assertEqual(_camera_source(source), source)

    def test_target_classes_are_parsed(self):
        self.assertEqual(_int_list("39, 40"), (39, 40))

    def test_incident_snapshot_offsets_are_parsed(self):
        self.assertEqual(_float_list("0, 1, 2.5"), (0.0, 1.0, 2.5))

    def test_invalid_camera_backend_is_rejected(self):
        with self.assertRaises(ValueError):
            Settings(camera_backend="INVALID").validate()

    def test_invalid_configured_camera_id_is_rejected(self):
        with self.assertRaises(ValueError):
            Settings(configured_camera_id="camera id with spaces").validate()

    def test_incident_snapshot_offsets_must_be_ascending(self):
        with self.assertRaises(ValueError):
            Settings(incident_snapshot_offsets_seconds=(0, 2, 1)).validate()

    def test_periodic_snapshot_and_video_settings_are_validated(self):
        with self.assertRaises(ValueError):
            Settings(incident_snapshot_interval_seconds=0).validate()
        with self.assertRaises(ValueError):
            Settings(incident_max_snapshots=0).validate()
        with self.assertRaises(ValueError):
            Settings(incident_video_codec="bad").validate()


if __name__ == "__main__":
    unittest.main()
