# ISMP Edge Stream Service

[Русская инструкция](README.ru.md)

`detector/` is a standalone camera server. It does not import or run any code
from the ISMP frontend or Node.js backend and can be copied to a Windows laptop
by itself.

The only integration point is the versioned HTTP API documented in
[API.md](API.md):

`camera -> OpenCV -> YOLOv8 -> annotated MJPEG + authenticated incident evidence`

Stage 1 detects only COCO class `39` (`bottle`). When the central backend is
configured, confirmed detections create real in-memory incidents, linked
notifications, and three annotated evidence images.

## Requirements

- Windows 10/11 x64
- Python 3.12 x64 with the Python launcher or `python` available in `PATH`
- A built-in or USB webcam
- Internet access during the first installation and first model download

Node.js, the website, and the ISMP databases are not required by this folder.

## Download only this folder

Git sparse checkout downloads the repository metadata and materializes only
the edge-server directory:

```powershell
git clone --filter=blob:none --sparse https://github.com/MegatronTechnologies/ISMP.git
Set-Location ISMP
git sparse-checkout set detector
Set-Location detector
```

Alternatively, download the repository ZIP from GitHub and keep only the
`detector` folder.

## Install and run on Windows

Open PowerShell inside the downloaded `detector` folder:

```powershell
powershell -ExecutionPolicy Bypass -File .\setup_windows.ps1
powershell -ExecutionPolicy Bypass -File .\run_windows.ps1
```

You may also double-click `install_windows.cmd` once and then
`start_windows.cmd` whenever the camera server is needed.

The installation script creates an isolated `.venv`, installs the pinned
packages from `requirements.txt`, and creates `.env` from `.env.example`.
The first service start downloads `yolov8n.pt` into this folder.

Open these URLs while the service is running:

- Health: <http://127.0.0.1:8001/api/v1/health>
- Status: <http://127.0.0.1:8001/api/v1/status>
- Video: <http://127.0.0.1:8001/api/v1/stream.mjpg>
- API docs: <http://127.0.0.1:8001/docs>

Press `Ctrl+C` in the service window to stop it and release the camera.

## Configuration

Edit `.env` after installation:

- `ISMP_CAMERA_SOURCE=0` selects the usual built-in/front camera.
- Use `1`, `2`, and so on for another local camera.
- An RTSP URL can be used later without changing Python code.
- `ISMP_CAMERA_BACKEND=AUTO` tries MSMF, DirectShow, and OpenCV default.
- `ISMP_YOLO_MODEL` selects the current or future custom `.pt` model.
- `ISMP_YOLO_CLASSES` is a comma-separated list of model class IDs.
- `ISMP_ALLOWED_ORIGINS` contains the website origins allowed to read status.
- Incident defaults require 3 positive frames in 2 seconds, capture evidence at
  0, 1, and 2 seconds, rearm after 3 seconds without the target, and enforce a
  30-second minimum cooldown. All values are configurable in `.env`.

### Optional central registration and heartbeat

The local stream works without the central backend. To publish camera health to
the central API, put the same random enrollment secret in the backend `.env`
and this folder's `.env`:

```env
ISMP_CENTRAL_API_URL=http://127.0.0.1:3000/api/v1
ISMP_EDGE_ENROLLMENT_SECRET=<same value as backend EDGE_ENROLLMENT_SECRET>
ISMP_HEARTBEAT_SECONDS=10
```

On first connection the service generates a stable `cameraId`, receives a
per-camera token, and stores both in ignored `.device.json`. The same token
authenticates heartbeat and incident evidence. Evidence delivery uses a bounded
retry queue and never blocks camera capture or local streaming. Do not copy or
commit `.env` or `.device.json`.

## Website independence

The website consumes the API; this service never imports the website and the
website never imports Python files. Frontend changes are safe as long as the
`/api/v1` contract remains supported.

For the current local demo, the website and this service are opened on the same
Windows laptop. The service intentionally binds to `127.0.0.1`. Publishing a
camera over a LAN or the internet will be a later authenticated relay stage;
do not expose port `8001` publicly without access control and TLS.

## Developer checks

```powershell
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
```
