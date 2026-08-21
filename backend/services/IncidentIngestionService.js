const crypto = require('crypto');

const { hashToken, safeEqual } = require('./CameraRegistryService');

const SAFE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{7,127}$/;
const MAX_EVIDENCE_BYTES = 2 * 1024 * 1024;

class IncidentIngestionError extends Error {
  constructor(statusCode, code, message) {
    super(message);
    this.name = 'IncidentIngestionError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

const requiredSafeId = (value, field) => {
  if (typeof value !== 'string' || !SAFE_ID_PATTERN.test(value)) {
    throw new IncidentIngestionError(400, 'INVALID_EVENT_METADATA', `${field} is invalid`);
  }
  return value;
};

const requiredTimestamp = (value, field) => {
  if (typeof value !== 'string' || !Number.isFinite(Date.parse(value))) {
    throw new IncidentIngestionError(400, 'INVALID_EVENT_METADATA', `${field} must be an ISO timestamp`);
  }
  return new Date(value).toISOString();
};

const requiredNumber = (value, field, minimum, maximum) => {
  const number = Number(value);
  if (!Number.isFinite(number) || number < minimum || number > maximum) {
    throw new IncidentIngestionError(400, 'INVALID_EVENT_METADATA', `${field} is invalid`);
  }
  return number;
};

const requiredLabel = value => {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > 120) {
    throw new IncidentIngestionError(400, 'INVALID_EVENT_METADATA', 'detection label is invalid');
  }
  return value.trim();
};

const requiredBox = value => {
  if (!Array.isArray(value) || value.length !== 4) {
    throw new IncidentIngestionError(400, 'INVALID_EVENT_METADATA', 'detection box must contain four coordinates');
  }
  return value.map((coordinate, index) => requiredNumber(coordinate, `box[${index}]`, 0, 100000));
};

const requiredJpeg = value => {
  if (!Buffer.isBuffer(value) || value.length < 4 || value.length > MAX_EVIDENCE_BYTES) {
    throw new IncidentIngestionError(400, 'INVALID_EVIDENCE', 'JPEG evidence must be between 4 bytes and 2 MB');
  }
  if (value[0] !== 0xff || value[1] !== 0xd8 || value[value.length - 2] !== 0xff || value[value.length - 1] !== 0xd9) {
    throw new IncidentIngestionError(400, 'INVALID_EVIDENCE', 'Evidence body is not a valid JPEG');
  }
  return value;
};

const defaultIncidentId = () => {
  const timestamp = new Date().toISOString().replace(/\D/g, '').slice(0, 14);
  return `INC-${timestamp}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
};

class IncidentIngestionService {
  constructor(options = {}) {
    this.cameraRepository = options.cameraRepository;
    this.incidentRepository = options.incidentRepository;
    this.notificationRepository = options.notificationRepository;
    this.evidenceBodies = new Map();
    this.now = options.now || (() => new Date());
    this.incidentIdFactory = options.incidentIdFactory || defaultIncidentId;
    this.maxEvidencePerIncident = Number.isInteger(options.maxEvidencePerIncident)
      ? options.maxEvidencePerIncident
      : 10;
  }

  async authenticateCamera(cameraId, deviceToken) {
    const camera = await this.cameraRepository?.findById(cameraId);
    if (!camera || !deviceToken || !safeEqual(hashToken(deviceToken), camera.tokenHash)) {
      throw new IncidentIngestionError(401, 'INVALID_DEVICE_CREDENTIALS', 'Invalid device credentials');
    }
    return camera;
  }

  async ingestEvidence(cameraId, deviceToken, sourceEventId, metadata, jpegBody) {
    if (!this.incidentRepository?.findBySourceEvent || !this.incidentRepository?.appendEvidence) {
      throw new IncidentIngestionError(503, 'INCIDENT_STORAGE_UNAVAILABLE', 'Incident ingestion storage is not configured');
    }

    const camera = await this.authenticateCamera(cameraId, deviceToken);
    const eventId = requiredSafeId(sourceEventId, 'eventId');
    const captureId = requiredSafeId(metadata.captureId, 'captureId');
    const capturedAt = requiredTimestamp(metadata.capturedAt, 'capturedAt');
    const detection = {
      classId: Math.trunc(requiredNumber(metadata.classId, 'classId', 0, 100000)),
      label: requiredLabel(metadata.label),
      confidence: requiredNumber(metadata.confidence, 'confidence', 0, 1),
      box: requiredBox(metadata.box),
    };
    const jpeg = requiredJpeg(jpegBody);

    let incident = await this.incidentRepository.findBySourceEvent(cameraId, eventId);
    let created = false;
    const now = this.now().toISOString();

    if (!incident) {
      incident = await this.incidentRepository.create({
        id: this.incidentIdFactory(),
        sourceEventId: eventId,
        source: 'YOLO_EDGE',
        cameraId: camera.id,
        cameraName: camera.name,
        cameraScope: camera.scope,
        organizationId: camera.organizationId,
        detectionType: detection.label,
        detectionClassId: detection.classId,
        confidence: detection.confidence,
        status: 'NEW',
        startedAt: capturedAt,
        acknowledgedAt: null,
        resolvedAt: null,
        responseTime: null,
        evidence: [],
        evidenceCount: 0,
        createdAt: now,
        updatedAt: now,
      });
      created = true;

    }

    await this.ensureNotification(incident, camera, detection);

    const duplicate = incident.evidence.some(evidence => evidence.id === captureId);
    if (!duplicate) {
      if (incident.evidence.length >= this.maxEvidencePerIncident) {
        throw new IncidentIngestionError(409, 'EVIDENCE_LIMIT_REACHED', 'Incident evidence limit reached');
      }
      this.evidenceBodies.set(this.evidenceKey(incident.id, captureId), Buffer.from(jpeg));

      incident = await this.incidentRepository.appendEvidence(
        incident.id,
        {
          id: captureId,
          capturedAt,
          confidence: detection.confidence,
          box: detection.box,
          detectionPresent: metadata.detectionPresent !== false,
          contentType: 'image/jpeg',
          url: `/api/v1/incidents/${encodeURIComponent(incident.id)}/evidence/${encodeURIComponent(captureId)}`,
        },
        now,
      );
    }

    return { accepted: true, created, duplicate, incident: this.toPublic(incident) };
  }

  async findAll() {
    const incidents = await this.incidentRepository.findAll();
    return incidents.map(incident => this.toPublic(incident));
  }

  async findById(incidentId) {
    const incident = await this.incidentRepository.findById(incidentId);
    if (!incident) {
      throw new IncidentIngestionError(404, 'INCIDENT_NOT_FOUND', 'Incident not found');
    }
    return this.toPublic(incident);
  }

  async findEvidence(incidentId, evidenceId) {
    const incident = await this.incidentRepository.findById(incidentId);
    const evidence = incident?.evidence?.find(item => item.id === evidenceId);
    if (!evidence) {
      throw new IncidentIngestionError(404, 'EVIDENCE_NOT_FOUND', 'Incident evidence not found');
    }
    const body = this.evidenceBodies.get(this.evidenceKey(incidentId, evidenceId));
    if (!body) {
      throw new IncidentIngestionError(404, 'EVIDENCE_NOT_FOUND', 'Incident evidence not found');
    }
    return { body, contentType: evidence.contentType };
  }

  async findNotifications() {
    return this.notificationRepository?.findAll() || [];
  }

  async ensureNotification(incident, camera, detection) {
    if (!this.notificationRepository) return;
    const notifications = await this.notificationRepository.findAll();
    if (notifications.some(notification => notification.incidentId === incident.id)) return;

    await this.notificationRepository.create({
      type: 'critical',
      titleKey: 'notification.securityAlert',
      messageKey: 'notification.detectionDetails',
      payload: {
        camera: camera.name,
        confidence: Math.round(detection.confidence * 100),
        detectionType: detection.label,
      },
      time: incident.startedAt,
      read: false,
      incidentId: incident.id,
      cameraId: camera.id,
      organizationId: camera.organizationId,
    });
  }

  evidenceKey(incidentId, evidenceId) {
    return `${incidentId}:${evidenceId}`;
  }

  toPublic(incident) {
    return {
      ...incident,
      evidence: (incident.evidence || []).map(evidence => ({ ...evidence })),
      evidenceCount: (incident.evidence || []).length,
    };
  }
}

module.exports = {
  IncidentIngestionError,
  IncidentIngestionService,
  MAX_EVIDENCE_BYTES,
};
