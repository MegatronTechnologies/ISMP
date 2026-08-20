const env = require('./env');

let mysqlPool = null;
let mongoClient = null;
let redisClient = null;

async function initDatabases() {
  if (env.isDemoMode) {
    console.log('🟡 Running in DEMO_MODE: External databases (MySQL, MongoDB, Redis) are bypassed.');
    console.log('🟡 Using in-memory seeded mock repositories instead.');
    return;
  }

  try {
    console.log('🟢 Initializing real database connections...');
    
    // MySQL (Primary Business DB)
    const mysql = require('mysql2/promise');
    mysqlPool = mysql.createPool({
      host: env.mysql.host,
      user: env.mysql.user,
      password: env.mysql.password,
      database: env.mysql.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    console.log('✔️ MySQL pool created.');

    // MongoDB (Telemetry & AI Metadata)
    const mongoose = require('mongoose');
    await mongoose.connect(env.mongo.uri);
    mongoClient = mongoose.connection;
    console.log('✔️ MongoDB connected.');

    // Redis (Real-time state & Cache)
    const redis = require('redis');
    redisClient = redis.createClient({ url: env.redis.url });
    redisClient.on('error', (err) => console.error('Redis Client Error', err));
    await redisClient.connect();
    console.log('✔️ Redis connected.');

  } catch (error) {
    console.error('❌ Failed to initialize databases:', error.message);
    process.exit(1);
  }
}

module.exports = {
  initDatabases,
  getMysql: () => mysqlPool,
  getMongo: () => mongoClient,
  getRedis: () => redisClient,
};
