const dotenv = require('dotenv');
dotenv.config();

// Determine if we should run in DEMO_MODE. 
// Fallback to true if external DB host variables are completely missing.
const isDemoMode = process.env.DEMO_MODE === 'true' || (!process.env.MYSQL_HOST && !process.env.MONGO_URI);

// Generate/use a temporary dev secret only if in DEMO_MODE and secret is missing.
let jwtSecret = process.env.JWT_SECRET;
if (isDemoMode && !jwtSecret) {
  jwtSecret = 'dev_fallback_secret_do_not_use_in_prod_12345';
  console.warn('⚠️  WARNING: Running in DEMO_MODE with a temporary development JWT_SECRET.');
} else if (!isDemoMode && !jwtSecret) {
  throw new Error('❌ FATAL: JWT_SECRET is required in production/real mode. Please set it in your environment.');
}

module.exports = {
  isDemoMode,
  jwtSecret,
  port: Number.parseInt(process.env.PORT || '3000', 10),
  edge: {
    enrollmentSecret: process.env.EDGE_ENROLLMENT_SECRET || '',
    cameraOfflineAfterSeconds: Number.parseInt(process.env.CAMERA_OFFLINE_AFTER_SECONDS || '30', 10),
    demoOrganizationId: process.env.DEMO_ORGANIZATION_ID || '1',
  },
  mysql: {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DB,
  },
  mongo: {
    uri: process.env.MONGO_URI,
  },
  redis: {
    url: process.env.REDIS_URL,
  }
};
