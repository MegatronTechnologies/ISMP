class RealIncidentRepository {
  constructor(mysqlPool) {
    this.pool = mysqlPool;
  }

  async findAll() {
    if (!this.pool) throw new Error("MySQL Pool not initialized");
    const [rows] = await this.pool.query('SELECT * FROM incidents ORDER BY created_at DESC');
    return rows;
  }

  async findById(id) {
    if (!this.pool) throw new Error("MySQL Pool not initialized");
    const [rows] = await this.pool.query('SELECT * FROM incidents WHERE id = ?', [id]);
    return rows[0] || null;
  }

  async create(data) {
    if (!this.pool) throw new Error("MySQL Pool not initialized");
    const [result] = await this.pool.query(
      'INSERT INTO incidents (camera_id, type, confidence, status, created_at) VALUES (?, ?, ?, ?, NOW())',
      [data.cameraId, data.type, data.conf, 'NEW']
    );
    return this.findById(result.insertId);
  }

  async updateStatus(id, status) {
    if (!this.pool) throw new Error("MySQL Pool not initialized");
    await this.pool.query('UPDATE incidents SET status = ? WHERE id = ?', [status, id]);
    return this.findById(id);
  }
}

module.exports = RealIncidentRepository;
