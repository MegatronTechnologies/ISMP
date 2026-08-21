const env = require('../config/env');
const repositories = require('../repositories');
const {
  CameraRegistryError,
  CameraRegistryService,
} = require('../services/CameraRegistryService');

const cameraService = new CameraRegistryService(repositories.cameraRepository, {
  enrollmentSecret: env.edge.enrollmentSecret,
  organizationId: env.edge.demoOrganizationId,
  offlineAfterSeconds: env.edge.cameraOfflineAfterSeconds,
});

const bearerToken = request => {
  const authorization = request.get('authorization') || '';
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : '';
};

const sendError = (response, error) => {
  if (error instanceof CameraRegistryError) {
    return response.status(error.statusCode).json({ error: error.code, message: error.message });
  }

  console.error('Camera registry error:', error);
  return response.status(500).json({ error: 'CAMERA_REGISTRY_ERROR', message: 'Camera registry request failed' });
};

class CameraController {
  constructor(service) {
    this.service = service;
    this.register = this.register.bind(this);
    this.heartbeat = this.heartbeat.bind(this);
    this.getAll = this.getAll.bind(this);
    this.getById = this.getById.bind(this);
  }

  async register(req, res) {
    try {
      const result = await this.service.register(req.get('x-ismp-enrollment-secret'), req.body);
      return res.status(201).json(result);
    } catch (error) {
      return sendError(res, error);
    }
  }

  async heartbeat(req, res) {
    try {
      const result = await this.service.heartbeat(req.params.cameraId, bearerToken(req), req.body);
      return res.json(result);
    } catch (error) {
      return sendError(res, error);
    }
  }

  async getAll(req, res) {
    try {
      return res.json(await this.service.findAll());
    } catch (error) {
      return sendError(res, error);
    }
  }

  async getById(req, res) {
    try {
      return res.json(await this.service.findById(req.params.cameraId));
    } catch (error) {
      return sendError(res, error);
    }
  }
}

module.exports = new CameraController(cameraService);
