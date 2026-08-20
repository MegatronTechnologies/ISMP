class MockIncidentRepository {
  constructor() {
    this.incidents = [
      { id: 'INC-1042', camera: 'Demo Camera', type: 'WEAPON', time: new Date().toISOString(), status: 'NEW', response: '-', conf: '94%' },
      { id: 'INC-1041', camera: 'Demo Camera', type: 'WEAPON', time: new Date(Date.now() - 3600000).toISOString(), status: 'ACKNOWLEDGED', response: '45s', conf: '91%' },
      { id: 'INC-1040', camera: 'Demo Camera', type: 'WEAPON', time: new Date(Date.now() - 18000000).toISOString(), status: 'RESOLVED', response: '2m', conf: '88%' },
    ];
  }

  async findAll() {
    return this.incidents;
  }

  async findById(id) {
    return this.incidents.find(inc => inc.id === id);
  }

  async create(data) {
    const newIncident = {
      id: `INC-${1000 + this.incidents.length + 1}`,
      time: new Date().toISOString(),
      status: 'NEW',
      response: '-',
      ...data
    };
    this.incidents.unshift(newIncident);
    return newIncident;
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
