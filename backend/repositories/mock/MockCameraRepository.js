class MockCameraRepository {
  constructor(seedData = []) {
    this.cameras = new Map(seedData.map(camera => [camera.id, { ...camera }]));
  }

  async findAll() {
    return Array.from(this.cameras.values());
  }

  async findById(id) {
    return this.cameras.get(id) || null;
  }

  async upsertRegistration(camera) {
    const existing = await this.findById(camera.id);
    const next = {
      ...existing,
      ...camera,
      createdAt: existing?.createdAt || camera.createdAt,
    };
    this.cameras.set(next.id, next);
    return next;
  }

  async updateHeartbeat(id, updates) {
    const existing = await this.findById(id);
    if (!existing) return null;

    const next = { ...existing, ...updates };
    this.cameras.set(id, next);
    return next;
  }
}

module.exports = MockCameraRepository;
