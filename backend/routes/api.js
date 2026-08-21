const express = require('express');
const router = express.Router();
const incidentController = require('../controllers/IncidentController');
const cameraController = require('../controllers/CameraController');

router.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'ISMP Backend running (DEMO_MODE API)' });
});

router.get('/incidents', incidentController.getAllIncidents);
router.get('/incidents/:incidentId', incidentController.getIncidentById);

router.post('/v1/edge/cameras/register', cameraController.register);
router.post('/v1/edge/cameras/:cameraId/heartbeat', cameraController.heartbeat);
router.post(
  '/v1/edge/cameras/:cameraId/detection-events/:eventId/evidence',
  express.raw({ type: 'image/jpeg', limit: '2mb' }),
  incidentController.ingestEvidence,
);
router.get('/v1/cameras', cameraController.getAll);
router.get('/v1/cameras/:cameraId', cameraController.getById);
router.get('/v1/incidents', incidentController.getAllIncidents);
router.get('/v1/incidents/:incidentId/evidence/:evidenceId', incidentController.getEvidence);
router.get('/v1/incidents/:incidentId', incidentController.getIncidentById);
router.get('/v1/notifications', incidentController.getAllNotifications);

module.exports = router;
