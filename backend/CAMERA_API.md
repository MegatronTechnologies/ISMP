# Camera control-plane API v1

This contract connects the standalone Python edge service to the central Node.js
backend. It transfers identity and telemetry only; video remains on the local
edge stream during this stage.

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

## Frontend read endpoints

- `GET /api/v1/cameras`
- `GET /api/v1/cameras/:cameraId`

These responses never contain the enrollment secret, device token, or token
hash. `connectionState` becomes `OFFLINE` after
`CAMERA_OFFLINE_AFTER_SECONDS` without a successful heartbeat.

User-account authorization for these read endpoints will be added with the
real accounts/RBAC stage. Do not expose this demo backend publicly.
