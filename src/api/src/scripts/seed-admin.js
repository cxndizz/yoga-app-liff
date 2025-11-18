#!/usr/bin/env node

const path = require('path');
const dotenv = require('dotenv');

const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

const db = require('../db');
const { createPasswordHash } = require('../utils/security');

const parseArgs = () => {
  const args = process.argv.slice(2);
  return args.reduce((acc, arg) => {
    const cleaned = arg.startsWith('--') ? arg.slice(2) : arg;
    const [key, ...rest] = cleaned.split('=');
    if (!key) {
      return acc;
    }
    const value = rest.length > 0 ? rest.join('=') : 'true';
    acc[key] = value;
    return acc;
  }, {});
};

const parsePermissions = (value) => {
  if (!value) {
    return null;
  }
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const options = parseArgs();

const email = options.email || process.env.SEED_ADMIN_EMAIL || 'admin@yoga.local';
const password = options.password || process.env.SEED_ADMIN_PASSWORD || 'Admin123!';
const fullName = options.name || options.fullName || process.env.SEED_ADMIN_FULL_NAME || 'Default Admin';
const role = options.role || process.env.SEED_ADMIN_ROLE || 'super_admin';
const permissionsFromArgs =
  parsePermissions(options.permissions) ||
  parsePermissions(process.env.SEED_ADMIN_PERMISSIONS);
const permissions = permissionsFromArgs || (role === 'super_admin' ? ['*'] : []);

if (!email) {
  console.error('Seed aborted: email is required');
  process.exit(1);
}

if (!password) {
  console.error('Seed aborted: password is required');
  process.exit(1);
}

const upsertAdminUser = async () => {
  const passwordHash = createPasswordHash(password);
  const query = `
    INSERT INTO admin_users (email, full_name, password_hash, role, permissions, is_active)
    VALUES ($1, $2, $3, $4, $5, TRUE)
    ON CONFLICT (email)
    DO UPDATE SET
      full_name = EXCLUDED.full_name,
      password_hash = EXCLUDED.password_hash,
      role = EXCLUDED.role,
      permissions = EXCLUDED.permissions,
      is_active = TRUE
    RETURNING id, email, full_name, role, permissions, is_active, created_at, last_login_at;
  `;

  const result = await db.query(query, [email, fullName, passwordHash, role, permissions]);
  return result.rows[0];
};

(async () => {
  try {
    const user = await upsertAdminUser();
    console.log('✅ Admin user is ready for login');
    console.log('-------------------------------');
    console.log(`Email     : ${user.email}`);
    console.log(`Full Name : ${user.full_name}`);
    console.log(`Role      : ${user.role}`);
    console.log(`Permissions: ${Array.isArray(user.permissions) ? user.permissions.join(', ') : 'None'}`);
    console.log(`Password  : ${password}`);
    console.log('-------------------------------');
    console.log('You can now log in to the admin portal with the credentials above.');
  } catch (error) {
    console.error('❌ Failed to seed admin user');
    console.error(error.message || error);
    process.exitCode = 1;
  } finally {
    if (typeof db.close === 'function') {
      await db.close().catch(() => {});
    }
  }
})();
