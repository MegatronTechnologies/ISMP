# Python Detector (Future)

This directory will contain the edge device logic.

**Tech Stack:**
- Python 3.10+
- YOLOv8
- OpenCV
- requests

## State Machine
The detector will operate on the following states:

- `IDLE`: Normal operation, analyzing frames.
- `DETECTING`: Threat identified, verifying confidence.
- `GRACE_PERIOD`: Threat disappeared, waiting before stopping recording.
- `RECORDING_COMPLETE`: Grace period expired, saving video and uploading to backend.
