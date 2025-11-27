const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Connection pool configuration for high concurrency (1000+ users)
  max: 50, // Maximum number of clients in the pool
  min: 10, // Minimum number of clients to keep alive
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Return error after 10 seconds if connection cannot be established
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

const query = (text, params) => pool.query(text, params);
const close = () => pool.end();

module.exports = {
  query,
  close,
  pool,
};
