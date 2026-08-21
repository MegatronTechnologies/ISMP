const env = require('../config/env');
const db = require('../config/db');

const MockIncidentRepository = require('./mock/MockIncidentRepository');
const RealIncidentRepository = require('./real/RealIncidentRepository');
const GenericMockRepository = require('./mock/GenericMockRepository');
const MockCameraRepository = require('./mock/MockCameraRepository');

// Instantiate Mocks
const mockIncidentRepo = new MockIncidentRepository();
const mockUserRepo = new GenericMockRepository([{ id: '1', name: 'Sulxayev Aydın', role: 'SUPERADMIN', organizationId: '1' }]);
const mockOrgRepo = new GenericMockRepository([{ id: '1', name: 'Holberton School' }]);
const mockCameraRepo = new MockCameraRepository();
const mockNotificationRepo = new GenericMockRepository([]);
const mockAuditLogRepo = new GenericMockRepository([]);
const mockSettingsRepo = new GenericMockRepository([{ id: 'record_stop_delay', value: '30s' }]);
const mockContactRepo = new GenericMockRepository([]);

// Note: Real implementations would go here when needed
// const realUserRepo = new RealUserRepository(db.getMysql()); ...

module.exports = {
  get incidentRepository() { return env.isDemoMode ? mockIncidentRepo : new RealIncidentRepository(db.getMysql()); },
  get userRepository() { return env.isDemoMode ? mockUserRepo : null; /* Fallback to real when ready */ },
  get organizationRepository() { return env.isDemoMode ? mockOrgRepo : null; },
  get cameraRepository() { return env.isDemoMode ? mockCameraRepo : null; },
  get notificationRepository() { return env.isDemoMode ? mockNotificationRepo : null; },
  get auditLogRepository() { return env.isDemoMode ? mockAuditLogRepo : null; },
  get settingsRepository() { return env.isDemoMode ? mockSettingsRepo : null; },
  get contactRepository() { return env.isDemoMode ? mockContactRepo : null; },
};
