const express = require('express');
const router = express.Router();
const incidentController = require('../controllers/IncidentController');

router.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'ISMP Backend running (DEMO_MODE API)' });
});

router.get('/incidents', incidentController.getAllIncidents);
router.post('/incidents', incidentController.createIncident);

module.exports = router;
