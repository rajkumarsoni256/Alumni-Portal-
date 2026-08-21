const { Pool } = require('pg');
const path = require('path');

// Ensure dotenv is loaded from the backend directory
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const getPoolConfig = () => {
  const connectionString = process.env.DATABASE_URL || process.env.DB_URL;
  const isProduction = process.env.NODE_ENV === 'production';
  const isCloudDb = Boolean(
    connectionString &&
    (connectionString.includes('render.com') ||
     connectionString.includes('neon.tech') ||
     connectionString.includes('sslmode=require'))
  );

  const baseConfig = {
    max: parseInt(process.env.DB_POOL_MAX || '15', 10),
    min: parseInt(process.env.DB_POOL_MIN || '2', 10),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    statement_timeout: 10000, // Abort queries running over 10 seconds
    query_timeout: 10000,
  };

  if (connectionString) {
    return {
      ...baseConfig,
      connectionString,
      ssl: (isProduction || isCloudDb) ? { rejectUnauthorized: false } : false,
    };
  }

  // Discrete parameters fallback
  return {
    ...baseConfig,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'jecrc_community',
    user: process.env.DB_USER ? String(process.env.DB_USER) : 'postgres',
    password: process.env.DB_PASSWORD ? String(process.env.DB_PASSWORD) : '12345678',
  };
};

const pool = new Pool(getPoolConfig());

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
});

const logger = require('../utils/logger');

// Periodic DB pool stats logger (every 30 seconds if waiting clients exist or in production)
setInterval(() => {
  if (pool.waitingCount > 0) {
    logger.warn('DB', `[POOL STATS] total=${pool.totalCount} idle=${pool.idleCount} waiting=${pool.waitingCount}`);
  }
}, 10000);

module.exports = {
  query: async (text, params) => {
    const checkoutStart = Date.now();
    let client;
    try {
      client = await pool.connect();
      const waitDuration = Date.now() - checkoutStart;

      const execStart = Date.now();
      const res = await client.query(text, params);
      const execDuration = Date.now() - execStart;
      const totalDuration = Date.now() - checkoutStart;

      if (totalDuration > 50) {
        const querySnippet = (typeof text === 'string' ? text : text.text || '').replace(/\s+/g, ' ').trim().slice(0, 120);
        logger.debug(
          'DB',
          `SLOW QUERY total=${totalDuration}ms (wait=${waitDuration}ms, exec=${execDuration}ms) [rows=${res.rowCount}]: ${querySnippet}`
        );
      }
      return res;
    } catch (err) {
      const totalDuration = Date.now() - checkoutStart;
      logger.error('DB', `QUERY ERROR (${totalDuration}ms): ${err.message}`);
      throw err;
    } finally {
      if (client) {
        client.release();
      }
    }
  },
  getClient: () => pool.connect(),
  pool,
};
