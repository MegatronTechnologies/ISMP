const test = require('node:test');
const assert = require('node:assert/strict');

process.env.DEMO_MODE = 'true';
process.env.EDGE_ENROLLMENT_SECRET = 'integration-enrollment-secret';
process.env.DEMO_ORGANIZATION_ID = 'org-integration';

const express = require('express');
const apiRoutes = require('../routes/api');

const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);

const requestHeaders = (token, captureId) => ({
  Authorization: `Bearer ${token}`,
  'Content-Type': 'image/jpeg',
  'X-ISMP-Capture-ID': captureId,
  'X-ISMP-Captured-At': '2026-08-21T12:00:00.000Z',
  'X-ISMP-Detection-Class-ID': '39',
  'X-ISMP-Detection-Label-B64': Buffer.from('bottle').toString('base64url'),
  'X-ISMP-Detection-Confidence': '0.94',
  'X-ISMP-Detection-Box': '[10,20,110,220]',
  'X-ISMP-Detection-Present': 'true',
});

test('edge HTTP contract creates an incident and serves its evidence', async () => {
  const app = express();
  app.use(express.json({ limit: '64kb' }));
  app.use('/api', apiRoutes);
  const server = await new Promise(resolve => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
  });
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}/api/v1`;

  try {
    const registration = await fetch(`${baseUrl}/edge/cameras/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-ISMP-Enrollment-Secret': 'integration-enrollment-secret',
      },
      body: JSON.stringify({ cameraId: 'cam-api-test', name: 'API Test Camera' }),
    });
    assert.equal(registration.status, 201);
    const credentials = (await registration.json()).credentials;

    const ingestion = await fetch(
      `${baseUrl}/edge/cameras/cam-api-test/detection-events/event-api-test/evidence`,
      {
        method: 'POST',
        headers: requestHeaders(credentials.deviceToken, 'capture-api-test'),
        body: jpeg,
      },
    );
    assert.equal(ingestion.status, 201);
    const created = await ingestion.json();
    assert.equal(created.incident.evidenceCount, 1);
    assert.equal(created.incident.evidence[0].detectionPresent, true);
    const incidents = await (await fetch(`${baseUrl}/incidents`)).json();
    assert.equal(incidents.length, 1);
    assert.equal(incidents[0].id, created.incident.id);

    const evidence = await fetch(`http://127.0.0.1:${address.port}${created.incident.evidence[0].url}`);
    assert.equal(evidence.status, 200);
    assert.equal(evidence.headers.get('content-type'), 'image/jpeg');
    assert.deepEqual(Buffer.from(await evidence.arrayBuffer()), jpeg);

    const notifications = await (await fetch(`${baseUrl}/notifications`)).json();
    assert.equal(notifications.length, 1);
    assert.equal(notifications[0].incidentId, created.incident.id);
  } finally {
    await new Promise((resolve, reject) => server.close(error => (error ? reject(error) : resolve())));
  }
});
