const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

const envPath = path.resolve(__dirname, '../../.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

const db = require('../db');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const maxAttempts = parseInt(process.env.DB_WAIT_MAX_ATTEMPTS || '30', 10);
const intervalMs = parseInt(process.env.DB_WAIT_INTERVAL_MS || '2000', 10);

const waitForDb = async () => {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await db.query('SELECT 1');
      console.log('✅ Database connection is ready.');
      return;
    } catch (error) {
      const remaining = maxAttempts - attempt;
      console.log(
        `⏳ Database not ready yet (attempt ${attempt}/${maxAttempts}): ${error.message || error}`
      );
      if (remaining === 0) {
        throw error;
      }
      await delay(intervalMs);
    }
  }
};

waitForDb()
  .catch((error) => {
    console.error('❌ Unable to connect to the database in time.');
    if (error) {
      console.error(error.message || error);
    }
    process.exitCode = 1;
  })
  .finally(async () => {
    if (typeof db.close === 'function') {
      await db.close().catch(() => {});
    }
  });
