const crypto = require('crypto');

const CAMERA_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{2,63}$/;

class CameraRegistryError extends Error {
  constructor(statusCode, code, message) {
    super(message);
    this.name = 'CameraRegistryError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

const safeEqual = (left, right) => {
  const leftBuffer = Buffer.from(String(left || ''), 'utf8');
  const rightBuffer = Buffer.from(String(right || ''), 'utf8');
  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
};

const hashToken = token => crypto.createHash('sha256').update(token, 'utf8').digest('hex');

const requiredString = (value, field, maxLength) => {
  if (typeof value !== 'string' || !value.trim()) {
    throw new CameraRegistryError(400, 'INVALID_PAYLOAD', `${field} is required`);
  }
  const normalized = value.trim();
  if (normalized.length > maxLength) {
    throw new CameraRegistryError(400, 'INVALID_PAYLOAD', `${field} is too long`);
  }
  return normalized;
};

const optionalString = (value, maxLength) => {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized ? normalized.slice(0, maxLength) : null;
};

const finiteNumber = value => (Number.isFinite(value) ? value : null);

const sanitizeTelemetry = payload => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new CameraRegistryError(400, 'INVALID_PAYLOAD', 'Heartbeat payload must be an object');
  }

  const camera = payload.camera && typeof payload.camera === 'object' ? payload.camera : {};
  const detector = payload.detector && typeof payload.detector === 'object' ? payload.detector : {};
  const stream = payload.stream && typeof payload.stream === 'object' ? payload.stream : {};

  return {
    edgeTimestamp: optionalString(payload.heartbeatAt, 64),
    service: {
      state: optionalString(payload.service?.state, 32) || 'UNKNOWN',
      platform: optionalString(payload.service?.platform, 64),
      startedAt: optionalString(payload.service?.startedAt, 64),
    },
    camera: {
      state: optionalString(camera.state, 32) || 'UNKNOWN',
      source: typeof camera.source === 'string'
        ? camera.source.slice(0, 512)
        : (Number.isInteger(camera.source) ? camera.source : null),
      backend: optionalString(camera.backend, 32),
      width: finiteNumber(camera.width),
      height: finiteNumber(camera.height),
      captureFps: finiteNumber(camera.captureFps),
      lastFrameAt: optionalString(camera.lastFrameAt, 64),
      error: optionalString(camera.error, 512),
    },
    detector: {
      state: optionalString(detector.state, 32) || 'UNKNOWN',
      model: optionalString(detector.model, 255),
      device: optionalString(detector.device, 64),
      inferenceMs: finiteNumber(detector.inferenceMs),
      inferenceFps: finiteNumber(detector.inferenceFps),
      error: optionalString(detector.error, 512),
    },
    stream: {
      state: optionalString(stream.state, 32) || 'UNKNOWN',
      clients: finiteNumber(stream.clients),
      sequence: finiteNumber(stream.sequence),
    },
    detectionCount: Array.isArray(payload.detections) ? payload.detections.length : 0,
  };
};

class CameraRegistryService {
  constructor(repository, options = {}) {
    this.repository = repository;
    this.enrollmentSecret = options.enrollmentSecret || '';
    this.organizationId = options.organizationId || '1';
    this.offlineAfterSeconds = Number.isFinite(options.offlineAfterSeconds)
      && options.offlineAfterSeconds > 0
      ? options.offlineAfterSeconds
      : 30;
    this.now = options.now || (() => new Date());
    this.tokenFactory = options.tokenFactory || (() => crypto.randomBytes(32).toString('base64url'));
  }

  async register(presentedSecret, payload = {}) {
    if (!this.enrollmentSecret) {
      throw new CameraRegistryError(503, 'ENROLLMENT_DISABLED', 'Edge enrollment is not configured');
    }
    if (!safeEqual(presentedSecret, this.enrollmentSecret)) {
      throw new CameraRegistryError(401, 'INVALID_ENROLLMENT_SECRET', 'Invalid enrollment credentials');
    }

    const cameraId = requiredString(payload.cameraId, 'cameraId', 64);
    if (!CAMERA_ID_PATTERN.test(cameraId)) {
      throw new CameraRegistryError(400, 'INVALID_CAMERA_ID', 'cameraId contains unsupported characters');
    }

    const now = this.now().toISOString();
    const deviceToken = this.tokenFactory();
    const camera = await this.repository.upsertRegistration({
      id: cameraId,
      name: requiredString(payload.name, 'name', 120),
      organizationId: this.organizationId,
      scope: 'LOCAL',
      platform: optionalString(payload.platform, 64),
      edgeVersion: optionalString(payload.edgeVersion, 32),
      tokenHash: hashToken(deviceToken),
      registeredAt: now,
      createdAt: now,
      updatedAt: now,
      lastHeartbeatAt: null,
      telemetry: null,
    });

    return {
      camera: this.toPublic(camera),
      credentials: {
        cameraId,
        deviceToken,
        tokenType: 'Bearer',
      },
    };
  }

  async heartbeat(cameraId, deviceToken, payload) {
    const camera = await this.repository.findById(cameraId);
    if (!camera || !deviceToken || !safeEqual(hashToken(deviceToken), camera.tokenHash)) {
      throw new CameraRegistryError(401, 'INVALID_DEVICE_CREDENTIALS', 'Invalid device credentials');
    }

    const now = this.now().toISOString();
    const updated = await this.repository.updateHeartbeat(cameraId, {
      lastHeartbeatAt: now,
      updatedAt: now,
      telemetry: sanitizeTelemetry(payload),
    });

    return { accepted: true, camera: this.toPublic(updated) };
  }

  async findAll() {
    const cameras = await this.repository.findAll();
    return cameras.map(camera => this.toPublic(camera));
  }

  async findById(cameraId) {
    const camera = await this.repository.findById(cameraId);
    if (!camera) {
      throw new CameraRegistryError(404, 'CAMERA_NOT_FOUND', 'Camera not found');
    }
    return this.toPublic(camera);
  }

  toPublic(camera) {
    const lastHeartbeatMs = camera.lastHeartbeatAt ? Date.parse(camera.lastHeartbeatAt) : Number.NaN;
    const ageSeconds = Number.isFinite(lastHeartbeatMs)
      ? Math.max(0, (this.now().getTime() - lastHeartbeatMs) / 1000)
      : null;
    const connectionState = ageSeconds !== null && ageSeconds <= this.offlineAfterSeconds
      ? 'ONLINE'
      : 'OFFLINE';

    return {
      id: camera.id,
      name: camera.name,
      organizationId: camera.organizationId,
      scope: camera.scope,
      platform: camera.platform,
      edgeVersion: camera.edgeVersion,
      connectionState,
      lastHeartbeatAt: camera.lastHeartbeatAt,
      registeredAt: camera.registeredAt,
      telemetry: camera.telemetry,
    };
  }
}

module.exports = {
  CameraRegistryError,
  CameraRegistryService,
  hashToken,
  safeEqual,
};
