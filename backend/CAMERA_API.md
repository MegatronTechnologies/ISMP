# Camera control-plane API v1

This contract connects the standalone Python edge service to the central Node.js
backend. Live video remains on the local edge stream. The control plane carries
camera identity, telemetry, confirmed detection metadata, and selected JPEG
evidence frames.

## Provisioning configuration

Generate a long random enrollment secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Put the same value in ignored local environment files:

```env
# Website/backend .env
EDGE_ENROLLMENT_SECRET=<random value>

# detector/.env on the trusted camera laptop
ISMP_EDGE_ENROLLMENT_SECRET=<same random value>
ISMP_CENTRAL_API_URL=http://127.0.0.1:3000/api/v1
```

The enrollment secret is used only to obtain or rotate a per-camera token. The
backend returns that device token once and stores only its SHA-256 hash. The
edge service stores its token in ignored `detector/.device.json`.

## `POST /api/v1/edge/cameras/register`

Header:

```http
X-ISMP-Enrollment-Secret: <secret>
```

Payload:

```json
{
  "cameraId": "cam-955ecbb5b3304c938b28fbd9eb60bbef",
  "name": "Windows Built-in Camera",
  "platform": "Windows",
  "edgeVersion": "0.2.0"
}
```

The response contains public camera data plus one-time `credentials` with a
Bearer device token. Re-registering the same camera rotates the token.

## `POST /api/v1/edge/cameras/:cameraId/heartbeat`

Header:

```http
Authorization: Bearer <device token>
```

The payload is the edge status snapshot. The backend whitelists camera,
detector, stream, and service telemetry fields and sets `lastHeartbeatAt` using
central server time.

An invalid or expired token returns `401`. The edge service clears it and
automatically enrolls again on the next attempt when the enrollment secret is
still configured.

## `POST /api/v1/edge/cameras/:cameraId/detection-events/:eventId/evidence`

This device-only endpoint accepts one YOLO-annotated JPEG per request. It uses
the same Bearer device token as heartbeat. The request body has
`Content-Type: image/jpeg` and a maximum size of 2 MB. Detection metadata is
sent in these bounded headers:

- `X-ISMP-Capture-ID`
- `X-ISMP-Captured-At`
- `X-ISMP-Detection-Class-ID`
- `X-ISMP-Detection-Label-B64` (UTF-8 base64url)
- `X-ISMP-Detection-Confidence`
- `X-ISMP-Detection-Box` (four JSON `xyxy` coordinates)

The first capture for an `eventId` creates one canonical `NEW` incident and one
linked unread notification. Later captures with that `eventId` append to the
same incident. The `(eventId, captureId)` pair is idempotent, so safe delivery
retries do not duplicate incidents, notifications, or images. The backend caps
one incident at 10 evidence files as a basic disk-abuse guard.

The edge defaults confirm 3 positive frames inside 2 seconds, collect annotated
frames at 0, 1, and 2 seconds, rearm after 3 continuous seconds without the
target, and enforce a 30-second minimum cooldown. These values belong to the
edge `.env`, not the website.

## Frontend read endpoints

- `GET /api/v1/cameras`
- `GET /api/v1/cameras/:cameraId`
- `GET /api/v1/incidents`
- `GET /api/v1/incidents/:incidentId`
- `GET /api/v1/incidents/:incidentId/evidence/:evidenceId`
- `GET /api/v1/notifications`

These responses never contain the enrollment secret, device token, or token
hash. `connectionState` becomes `OFFLINE` after
`CAMERA_OFFLINE_AFTER_SECONDS` without a successful heartbeat.

User-account authorization for these read endpoints will be added with the
real accounts/RBAC stage. Do not expose this demo backend publicly.

In `DEMO_MODE`, incident metadata, notifications, and evidence JPEGs exist only
in process memory and disappear together when the Node.js backend restarts.
Nothing accumulates on disk. Persistent metadata, object storage, and retention
rules will be introduced only in the real database stage.
