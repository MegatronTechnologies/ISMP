class GenericMockRepository {
  constructor(seedData = []) {
    this.data = seedData;
    this.nextId = seedData.length + 1;
  }

  async findAll() { return this.data; }
  async findById(id) { return this.data.find(item => item.id === id); }
  async create(item) {
    const newItem = { id: String(this.nextId++), ...item, created_at: new Date().toISOString() };
    this.data.push(newItem);
    return newItem;
  }
  async update(id, updates) {
    const index = this.data.findIndex(item => item.id === id);
    if (index !== -1) {
      this.data[index] = { ...this.data[index], ...updates };
      return this.data[index];
    }
    return null;
  }
}

module.exports = GenericMockRepository;
