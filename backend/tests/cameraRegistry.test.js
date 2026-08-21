const test = require('node:test');
const assert = require('node:assert/strict');

const MockCameraRepository = require('../repositories/mock/MockCameraRepository');
const {
  CameraRegistryService,
  hashToken,
} = require('../services/CameraRegistryService');

const heartbeatPayload = {
  heartbeatAt: '2026-08-21T12:00:00.000Z',
  service: { state: 'ONLINE', platform: 'Windows', startedAt: '2026-08-21T11:59:00.000Z' },
  camera: {
    state: 'ONLINE',
    source: 0,
    backend: 'MSMF',
    width: 1280,
    height: 720,
    captureFps: 6.2,
    lastFrameAt: '2026-08-21T12:00:00.000Z',
    error: null,
  },
  detector: {
    state: 'READY',
    model: 'yolov8n.pt',
    device: 'cpu',
    inferenceMs: 160.2,
    inferenceFps: 6.2,
    error: null,
  },
  stream: { state: 'ONLINE', clients: 1, sequence: 42 },
  detections: [],
};

const createFixture = () => {
  let now = new Date('2026-08-21T12:00:00.000Z');
  const repository = new MockCameraRepository();
  const service = new CameraRegistryService(repository, {
    enrollmentSecret: 'enrollment-secret',
    organizationId: 'org-demo',
    offlineAfterSeconds: 30,
    now: () => new Date(now),
    tokenFactory: () => 'device-token-value',
  });
  return { repository, service, setNow: value => { now = new Date(value); } };
};

test('registration rejects an invalid enrollment secret', async () => {
  const { service } = createFixture();

  await assert.rejects(
    service.register('wrong-secret', { cameraId: 'cam-test-1', name: 'Front Camera' }),
    error => error.statusCode === 401 && error.code === 'INVALID_ENROLLMENT_SECRET',
  );
});

test('registration issues a token but repository stores only its hash', async () => {
  const { repository, service } = createFixture();
  const result = await service.register('enrollment-secret', {
    cameraId: 'cam-test-1',
    name: 'Front Camera',
    platform: 'Windows',
    edgeVersion: '0.2.0',
  });

  assert.equal(result.credentials.deviceToken, 'device-token-value');
  assert.equal(result.camera.connectionState, 'OFFLINE');

  const stored = await repository.findById('cam-test-1');
  assert.equal(stored.tokenHash, hashToken('device-token-value'));
  assert.equal(JSON.stringify(stored).includes('device-token-value'), false);
  assert.equal(JSON.stringify(result.camera).includes('tokenHash'), false);
});

test('authenticated heartbeat updates telemetry and online state', async () => {
  const { service } = createFixture();
  await service.register('enrollment-secret', {
    cameraId: 'cam-test-1',
    name: 'Front Camera',
  });

  const result = await service.heartbeat('cam-test-1', 'device-token-value', heartbeatPayload);

  assert.equal(result.accepted, true);
  assert.equal(result.camera.connectionState, 'ONLINE');
  assert.equal(result.camera.telemetry.camera.state, 'ONLINE');
  assert.equal(result.camera.telemetry.detector.state, 'READY');
  assert.equal(result.camera.telemetry.detectionCount, 0);
});

test('invalid device token is rejected and stale camera becomes offline', async () => {
  const { service, setNow } = createFixture();
  await service.register('enrollment-secret', {
    cameraId: 'cam-test-1',
    name: 'Front Camera',
  });

  await assert.rejects(
    service.heartbeat('cam-test-1', 'wrong-token', heartbeatPayload),
    error => error.statusCode === 401 && error.code === 'INVALID_DEVICE_CREDENTIALS',
  );

  await service.heartbeat('cam-test-1', 'device-token-value', heartbeatPayload);
  setNow('2026-08-21T12:00:31.000Z');
  const camera = await service.findById('cam-test-1');
  assert.equal(camera.connectionState, 'OFFLINE');
});

test('re-registration rotates the per-camera token', async () => {
  const repository = new MockCameraRepository();
  const tokens = ['first-device-token', 'second-device-token'];
  const service = new CameraRegistryService(repository, {
    enrollmentSecret: 'enrollment-secret',
    now: () => new Date('2026-08-21T12:00:00.000Z'),
    tokenFactory: () => tokens.shift(),
  });
  const camera = { cameraId: 'cam-test-1', name: 'Front Camera' };

  await service.register('enrollment-secret', camera);
  await service.register('enrollment-secret', camera);

  await assert.rejects(
    service.heartbeat('cam-test-1', 'first-device-token', heartbeatPayload),
    error => error.statusCode === 401,
  );
  const result = await service.heartbeat('cam-test-1', 'second-device-token', heartbeatPayload);
  assert.equal(result.accepted, true);
});
