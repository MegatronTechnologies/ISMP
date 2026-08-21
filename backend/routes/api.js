const express = require('express');
const router = express.Router();
const incidentController = require('../controllers/IncidentController');
const cameraController = require('../controllers/CameraController');

router.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'ISMP Backend running (DEMO_MODE API)' });
});

router.get('/incidents', incidentController.getAllIncidents);
router.post('/incidents', incidentController.createIncident);

router.post('/v1/edge/cameras/register', cameraController.register);
router.post('/v1/edge/cameras/:cameraId/heartbeat', cameraController.heartbeat);
router.get('/v1/cameras', cameraController.getAll);
router.get('/v1/cameras/:cameraId', cameraController.getById);

module.exports = router;
