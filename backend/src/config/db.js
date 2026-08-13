const { Pool } = require('pg');
const path = require('path');

// Ensure dotenv is loaded from the backend directory
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const getPoolConfig = () => {
  // If DB_PASSWORD or DB_USER are explicitly defined, use discrete options
  if (process.env.DB_USER && process.env.DB_PASSWORD) {
    return {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'jecrc_community',
      user: String(process.env.DB_USER),
      password: String(process.env.DB_PASSWORD),
    };
  }

  // Fallback to connectionString if discrete parameters are not provided
  if (process.env.DB_URL) {
    return {
      connectionString: process.env.DB_URL,
    };
  }

  // Default development fallback
  return {
    host: 'localhost',
    port: 5432,
    database: 'jecrc_community',
    user: 'postgres',
    password: '12345678',
  };
};

const pool = new Pool(getPoolConfig());

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
