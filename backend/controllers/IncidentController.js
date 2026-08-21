const repositories = require('../repositories');
const {
  IncidentIngestionError,
  IncidentIngestionService,
} = require('../services/IncidentIngestionService');

const incidentService = new IncidentIngestionService({
  cameraRepository: repositories.cameraRepository,
  incidentRepository: repositories.incidentRepository,
  notificationRepository: repositories.notificationRepository,
});

const bearerToken = request => {
  const authorization = request.get('authorization') || '';
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : '';
};

const decodedLabel = request => {
  const encoded = request.get('x-ismp-detection-label-b64') || '';
  try {
    return Buffer.from(encoded, 'base64url').toString('utf8');
  } catch (_error) {
    return '';
  }
};

const parsedBox = request => {
  try {
    return JSON.parse(request.get('x-ismp-detection-box') || 'null');
  } catch (_error) {
    return null;
  }
};

const sendError = (response, error) => {
  if (error instanceof IncidentIngestionError) {
    return response.status(error.statusCode).json({ error: error.code, message: error.message });
  }

  console.error('Incident API error:', error);
  return response.status(500).json({ error: 'INCIDENT_API_ERROR', message: 'Incident request failed' });
};

class IncidentController {
  constructor(service) {
    this.service = service;
    this.getAllIncidents = this.getAllIncidents.bind(this);
    this.getIncidentById = this.getIncidentById.bind(this);
    this.ingestEvidence = this.ingestEvidence.bind(this);
    this.getEvidence = this.getEvidence.bind(this);
    this.getAllNotifications = this.getAllNotifications.bind(this);
  }

  async getAllIncidents(_request, response) {
    try {
      return response.json(await this.service.findAll());
    } catch (error) {
      return sendError(response, error);
    }
  }

  async getIncidentById(request, response) {
    try {
      return response.json(await this.service.findById(request.params.incidentId));
    } catch (error) {
      return sendError(response, error);
    }
  }

  async ingestEvidence(request, response) {
    try {
      const result = await this.service.ingestEvidence(
        request.params.cameraId,
        bearerToken(request),
        request.params.eventId,
        {
          captureId: request.get('x-ismp-capture-id'),
          capturedAt: request.get('x-ismp-captured-at'),
          classId: request.get('x-ismp-detection-class-id'),
          label: decodedLabel(request),
          confidence: request.get('x-ismp-detection-confidence'),
          box: parsedBox(request),
          detectionPresent: request.get('x-ismp-detection-present') !== 'false',
        },
        request.body,
      );
      return response.status(result.created ? 201 : 200).json(result);
    } catch (error) {
      return sendError(response, error);
    }
  }

  async getEvidence(request, response) {
    try {
      const evidence = await this.service.findEvidence(
        request.params.incidentId,
        request.params.evidenceId,
      );
      response.type(evidence.contentType);
      return response.send(evidence.body);
    } catch (error) {
      return sendError(response, error);
    }
  }

  async getAllNotifications(_request, response) {
    try {
      return response.json(await this.service.findNotifications());
    } catch (error) {
      return sendError(response, error);
    }
  }
}

module.exports = new IncidentController(incidentService);
