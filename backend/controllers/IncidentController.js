const repositories = require('../repositories');

class IncidentController {
  async getAllIncidents(req, res) {
    try {
      const incidents = await repositories.incidentRepository.findAll();
      res.json(incidents);
    } catch (error) {
      console.error('Error fetching incidents:', error);
      res.status(500).json({ error: 'Failed to fetch incidents' });
    }
  }

  async createIncident(req, res) {
    try {
      const { cameraId, type, conf } = req.body;
      const incident = await repositories.incidentRepository.create({ cameraId, type, conf });
      res.status(201).json(incident);
    } catch (error) {
      console.error('Error creating incident:', error);
      res.status(500).json({ error: 'Failed to create incident' });
    }
  }
}

module.exports = new IncidentController();
