const test = require('node:test');
const assert = require('node:assert/strict');

const GenericMockRepository = require('../repositories/mock/GenericMockRepository');
const MockCameraRepository = require('../repositories/mock/MockCameraRepository');
const MockIncidentRepository = require('../repositories/mock/MockIncidentRepository');
const { CameraRegistryService } = require('../services/CameraRegistryService');
const { IncidentIngestionService } = require('../services/IncidentIngestionService');

const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);
const webm = Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 0x01, 0x02, 0x03, 0x04]);
const metadata = {
  captureId: 'capture-test-1',
  capturedAt: '2026-08-21T12:00:00.000Z',
  classId: 39,
  label: 'bottle',
  confidence: 0.94,
  box: [10, 20, 110, 220],
};
const recordingMetadata = {
  recordingId: 'recording-test-1',
  startedAt: '2026-08-21T12:00:00.000Z',
  endedAt: '2026-08-21T12:00:05.000Z',
  durationSeconds: 5,
  frameCount: 50,
  contentType: 'video/webm',
  classId: 39,
  label: 'bottle',
  confidence: 0.94,
  box: [10, 20, 110, 220],
};

const createFixture = async (options = {}) => {
  const cameraRepository = new MockCameraRepository();
  const incidentRepository = new MockIncidentRepository();
  const notificationRepository = new GenericMockRepository();
  const cameraService = new CameraRegistryService(cameraRepository, {
    enrollmentSecret: 'enrollment-secret',
    organizationId: 'org-demo',
    tokenFactory: () => 'device-token-value',
    now: () => new Date('2026-08-21T11:59:00.000Z'),
  });
  await cameraService.register('enrollment-secret', {
    cameraId: 'cam-test-1',
    name: 'Front Camera',
  });
  const service = new IncidentIngestionService({
    cameraRepository,
    incidentRepository,
    notificationRepository,
    incidentIdFactory: () => 'INC-TEST-1',
    now: () => new Date('2026-08-21T12:00:01.000Z'),
    maxEvidencePerIncident: options.maxEvidencePerIncident,
  });
  return { incidentRepository, notificationRepository, service };
};

test('authenticated YOLO evidence creates one canonical incident and notification', async () => {
  const fixture = await createFixture();
  const result = await fixture.service.ingestEvidence(
    'cam-test-1',
    'device-token-value',
    'event-test-1',
    metadata,
    jpeg,
  );

  assert.equal(result.accepted, true);
  assert.equal(result.created, true);
  assert.equal(result.incident.cameraId, 'cam-test-1');
  assert.equal(result.incident.cameraName, 'Front Camera');
  assert.equal(result.incident.organizationId, 'org-demo');
  assert.equal(result.incident.detectionType, 'bottle');
  assert.equal(result.incident.status, 'NEW');
  assert.equal(result.incident.evidenceCount, 1);
  assert.equal(result.incident.evidence[0].url, '/api/v1/incidents/INC-TEST-1/evidence/capture-test-1');

  const evidence = await fixture.service.findEvidence('INC-TEST-1', 'capture-test-1');
  assert.deepEqual(evidence.body, jpeg);

  const notifications = await fixture.notificationRepository.findAll();
  assert.equal(notifications.length, 1);
  assert.equal(notifications[0].incidentId, 'INC-TEST-1');
  assert.equal(notifications[0].read, false);
});

test('retries are idempotent and later snapshots append to the same incident', async () => {
  const fixture = await createFixture();
  const first = await fixture.service.ingestEvidence(
    'cam-test-1', 'device-token-value', 'event-test-1', metadata, jpeg,
  );
  const duplicate = await fixture.service.ingestEvidence(
    'cam-test-1', 'device-token-value', 'event-test-1', metadata, jpeg,
  );
  const second = await fixture.service.ingestEvidence(
    'cam-test-1',
    'device-token-value',
    'event-test-1',
    { ...metadata, captureId: 'capture-test-2', capturedAt: '2026-08-21T12:00:01.000Z' },
    jpeg,
  );

  assert.equal(first.created, true);
  assert.equal(duplicate.created, false);
  assert.equal(duplicate.duplicate, true);
  assert.equal(second.created, false);
  assert.equal(second.incident.evidenceCount, 2);
  assert.equal((await fixture.incidentRepository.findAll()).length, 1);
  assert.equal((await fixture.notificationRepository.findAll()).length, 1);
});

test('completed WebM recording is attached idempotently to the canonical incident', async () => {
  const fixture = await createFixture();
  await fixture.service.ingestEvidence(
    'cam-test-1', 'device-token-value', 'event-test-1', metadata, jpeg,
  );

  const first = await fixture.service.ingestRecording(
    'cam-test-1',
    'device-token-value',
    'event-test-1',
    recordingMetadata,
    webm,
  );
  const duplicate = await fixture.service.ingestRecording(
    'cam-test-1',
    'device-token-value',
    'event-test-1',
    recordingMetadata,
    webm,
  );

  assert.equal(first.created, false);
  assert.equal(first.duplicate, false);
  assert.equal(first.incident.recording.contentType, 'video/webm');
  assert.equal(first.incident.recording.durationSeconds, 5);
  assert.equal(duplicate.duplicate, true);
  const stored = await fixture.service.findRecording('INC-TEST-1');
  assert.deepEqual(stored.body, webm);
});

test('invalid device credentials and invalid evidence are rejected', async () => {
  const fixture = await createFixture();
  await assert.rejects(
    fixture.service.ingestEvidence('cam-test-1', 'wrong-token', 'event-test-1', metadata, jpeg),
    error => error.statusCode === 401 && error.code === 'INVALID_DEVICE_CREDENTIALS',
  );
  await assert.rejects(
    fixture.service.ingestEvidence(
      'cam-test-1', 'device-token-value', 'event-test-1', metadata, Buffer.from('not-jpeg'),
    ),
    error => error.statusCode === 400 && error.code === 'INVALID_EVIDENCE',
  );
});

test('incident evidence count is bounded', async () => {
  const fixture = await createFixture({ maxEvidencePerIncident: 1 });
  await fixture.service.ingestEvidence(
    'cam-test-1', 'device-token-value', 'event-test-1', metadata, jpeg,
  );
  await assert.rejects(
    fixture.service.ingestEvidence(
      'cam-test-1',
      'device-token-value',
      'event-test-1',
      { ...metadata, captureId: 'capture-test-2' },
      jpeg,
    ),
    error => error.statusCode === 409 && error.code === 'EVIDENCE_LIMIT_REACHED',
  );
});

test('a fresh demo service has no incidents, notifications, or evidence', async () => {
  const first = await createFixture();
  await first.service.ingestEvidence(
    'cam-test-1', 'device-token-value', 'event-test-1', metadata, jpeg,
  );

  const restarted = await createFixture();
  assert.deepEqual(await restarted.service.findAll(), []);
  assert.deepEqual(await restarted.service.findNotifications(), []);
  await assert.rejects(
    restarted.service.findEvidence('INC-TEST-1', 'capture-test-1'),
    error => error.statusCode === 404 && error.code === 'EVIDENCE_NOT_FOUND',
  );
  await assert.rejects(
    restarted.service.findRecording('INC-TEST-1'),
    error => error.statusCode === 404 && error.code === 'RECORDING_NOT_FOUND',
  );
});
