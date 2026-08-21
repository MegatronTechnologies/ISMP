# Edge API v1 contract

The edge server and website are separate applications. Their only shared
contract is HTTP under `/api/v1`. Additive fields may be introduced without a
version change; existing fields and meanings must remain compatible.

Default base URL for the local demo: `http://127.0.0.1:8001`.

The default incident evidence cadence is one annotated JPEG every 5 seconds;
the interval is configurable through `ISMP_INCIDENT_SNAPSHOT_INTERVAL_SECONDS`.

## `GET /api/v1/health`

Lightweight readiness response:

```json
{
  "ok": true,
  "ready": true,
  "version": "0.4.1",
  "camera": "ONLINE",
  "detector": "READY"
}
```

`ok` means the process is alive. `ready` means both the camera and model are
ready to produce annotated frames.

## `GET /api/v1/status`

Live status contains these stable top-level fields:

- `service`: process state, platform, and start time;
- `camera`: source, state, backend, resolution, FPS, last frame, and error;
- `detector`: model, state, target classes, confidence, and inference timing;
- `stream`: stream state, client count, sequence, and JPEG quality;
- `detections`: current frame detections;
- `incidentDetection`: confirmation/rearm state, periodic evidence progress,
  and bounded incident recording status;
- `heartbeatAt`: server time in ISO 8601 format.

Each detection contains `classId`, `label`, `confidence`, and an `xyxy` `box`.

## `GET /api/v1/stream.mjpg`

Returns an annotated MJPEG stream using
`multipart/x-mixed-replace; boundary=frame`.

## `POST /api/v1/camera`

Switches the active source without restarting the service:

```json
{"source": 1}
```

`source` accepts a non-negative camera index or a non-empty stream URL. The
response confirms `RECONNECTING`; clients should poll the status endpoint.

## Browser configuration

The current frontend adapter is `frontend/src/services/detectorApi.js`. A
different endpoint can be selected without modifying the edge server:

```js
localStorage.setItem('ismp_detector_url', 'http://127.0.0.1:8001');
location.reload();
```

The origin serving the frontend must also be present in
`ISMP_ALLOWED_ORIGINS` in the edge server `.env`.

## Central control-plane status

`GET /api/v1/health` includes a `central` state and `GET /api/v1/status`
includes a safe `central` object. Device secrets are never exposed by local
status endpoints.

When `ISMP_EDGE_ENROLLMENT_SECRET` is configured, the edge service registers
outbound with the central Node.js API, sends authenticated heartbeats, and
delivers confirmed incident snapshots and the completed WebM recording.
`central.incidentDelivery` exposes only safe queue counts, delivered recording
count, and the latest delivery state; device secrets are never returned. The
control-plane contract is documented in `backend/CAMERA_API.md` in the complete
repository. Camera streaming remains available locally when the central
backend is unavailable.
