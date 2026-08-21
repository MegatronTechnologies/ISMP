class MockIncidentRepository {
  constructor(seedData = []) {
    this.incidents = seedData.map(incident => ({
      ...incident,
      evidence: [...(incident.evidence || [])],
      recording: incident.recording ? { ...incident.recording } : null,
    }));
  }

  async findAll() {
    return this.incidents;
  }

  async findById(id) {
    return this.incidents.find(incident => incident.id === id) || null;
  }

  async findBySourceEvent(cameraId, sourceEventId) {
    return this.incidents.find(incident => (
      incident.cameraId === cameraId && incident.sourceEventId === sourceEventId
    )) || null;
  }

  async create(data) {
    const newIncident = {
      ...data,
      evidence: [...(data.evidence || [])],
      recording: data.recording ? { ...data.recording } : null,
    };
    this.incidents.unshift(newIncident);
    return newIncident;
  }

  async setRecording(id, recording, updatedAt) {
    const incident = await this.findById(id);
    if (!incident) return null;
    incident.recording = { ...recording };
    incident.updatedAt = updatedAt;
    return incident;
  }

  async appendEvidence(id, evidence, updatedAt) {
    const incident = await this.findById(id);
    if (!incident) return null;
    if (!incident.evidence.some(item => item.id === evidence.id)) {
      incident.evidence.push(evidence);
    }
    incident.evidenceCount = incident.evidence.length;
    incident.updatedAt = updatedAt;
    return incident;
  }

  async updateStatus(id, status) {
    const incident = await this.findById(id);
    if (incident) {
      incident.status = status;
      return incident;
    }
    return null;
  }
}

module.exports = MockIncidentRepository;
