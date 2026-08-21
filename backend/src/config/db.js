const { Pool } = require('pg');
const path = require('path');

// Ensure dotenv is loaded from the backend directory
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const getPoolConfig = () => {
  const connectionString = process.env.DATABASE_URL || process.env.DB_URL;

  if (connectionString) {
    const isProduction = process.env.NODE_ENV === 'production';
    const isCloudDb = connectionString.includes('render.com') || connectionString.includes('neon.tech') || connectionString.includes('sslmode=require');

    return {
      connectionString,
      ssl: (isProduction || isCloudDb) ? { rejectUnauthorized: false } : false,
    };
  }

  // Discrete parameters fallback
  return {
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

module.exports = {
  query: async (text, params) => {
    const start = Date.now();
    try {
      const res = await pool.query(text, params);
      const duration = Date.now() - start;
      if (duration > 50) {
        const querySnippet = (typeof text === 'string' ? text : text.text || '').replace(/\s+/g, ' ').trim().slice(0, 100);
        logger.debug('DB', `SLOW QUERY (${duration}ms) [rows=${res.rowCount}]: ${querySnippet}`);
      }
      return res;
    } catch (err) {
      const duration = Date.now() - start;
      logger.error('DB', `QUERY ERROR (${duration}ms): ${err.message}`);
      throw err;
    }
  },
  getClient: () => pool.connect(),
  pool,
};
