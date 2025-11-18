const dotenv = require('dotenv');
dotenv.config();
const db = require('../db');
const { signJwt, verifyJwt, verifyPassword, parseDuration } = require('../utils/security');

const ROLE_PERMISSIONS = {
  super_admin: ['*'],
  admin: ['courses:read', 'courses:write', 'users:read', 'orders:read', 'payments:read'],
  staff: ['courses:read', 'users:read'],
};

class AuthError extends Error {
  constructor(message, statusCode = 401) {
    super(message);
    this.statusCode = statusCode;
  }
}

const requireEnv = (key) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`${key} is not configured`);
  }
  return value;
};

const accessSecret = requireEnv('JWT_ACCESS_SECRET');
const refreshSecret = requireEnv('JWT_REFRESH_SECRET');
const accessTokenExpiresIn = parseDuration(process.env.ACCESS_TOKEN_TTL, 15 * 60);
const refreshTokenExpiresIn = parseDuration(process.env.REFRESH_TOKEN_TTL, 7 * 24 * 60 * 60);

const mapPermissions = (user) => {
  if (Array.isArray(user.permissions) && user.permissions.length > 0) {
    return user.permissions;
  }
  return ROLE_PERMISSIONS[user.role] || [];
};

const buildUserPayload = (user) => ({
  id: user.id,
  email: user.email,
  fullName: user.full_name,
  role: user.role,
  permissions: mapPermissions(user),
});

const revokedRefreshTokens = new Map();

const cleanupRevokedTokens = () => {
  const now = Date.now();
  for (const [token, expiresAt] of revokedRefreshTokens.entries()) {
    if (expiresAt <= now) {
      revokedRefreshTokens.delete(token);
    }
  }
};

const isRefreshTokenRevoked = (token) => {
  cleanupRevokedTokens();
  if (!revokedRefreshTokens.has(token)) {
    return false;
  }
  const expiresAt = revokedRefreshTokens.get(token);
  if (expiresAt <= Date.now()) {
    revokedRefreshTokens.delete(token);
    return false;
  }
  return true;
};

const revokeRefreshToken = (token, expiresAtSeconds) => {
  const fallbackExpiry = Date.now() + refreshTokenExpiresIn * 1000;
  const expiresAtMs = Number(expiresAtSeconds) * 1000;
  const validExpiry = Number.isFinite(expiresAtMs) && expiresAtMs > Date.now() ? expiresAtMs : fallbackExpiry;
  revokedRefreshTokens.set(token, validExpiry);
};

const issueTokens = (userPayload) => ({
  accessToken: signJwt(
    {
      sub: String(userPayload.id),
      role: userPayload.role,
      permissions: userPayload.permissions,
      tokenType: 'access',
    },
    accessSecret,
    accessTokenExpiresIn
  ),
  refreshToken: signJwt(
    {
      sub: String(userPayload.id),
      role: userPayload.role,
      permissions: userPayload.permissions,
      tokenType: 'refresh',
    },
    refreshSecret,
    refreshTokenExpiresIn
  ),
});

const findUserByEmail = async (email) => {
  const result = await db.query('SELECT * FROM admin_users WHERE email = $1', [email]);
  return result.rows[0];
};

const findUserById = async (id) => {
  const result = await db.query('SELECT * FROM admin_users WHERE id = $1', [id]);
  return result.rows[0];
};

const login = async (email, password) => {
  const user = await findUserByEmail(email);
  if (!user || user.is_active === false) {
    throw new AuthError('Invalid email or password');
  }

  const isValid = verifyPassword(password, user.password_hash);
  if (!isValid) {
    throw new AuthError('Invalid email or password');
  }

  await db.query('UPDATE admin_users SET last_login_at = NOW() WHERE id = $1', [user.id]);

  const payload = buildUserPayload(user);
  const tokens = issueTokens(payload);

  return {
    user: payload,
    ...tokens,
    accessTokenExpiresIn,
    refreshTokenExpiresIn,
  };
};

const refreshSession = async (refreshToken) => {
  let decoded;
  try {
    decoded = verifyJwt(refreshToken, refreshSecret);
  } catch (err) {
    throw new AuthError('Refresh token is invalid or expired');
  }

  if (decoded.tokenType !== 'refresh') {
    throw new AuthError('Invalid token type');
  }

  if (isRefreshTokenRevoked(refreshToken)) {
    throw new AuthError('Refresh token has been revoked');
  }

  const userId = Number(decoded.sub);
  if (!userId) {
    throw new AuthError('User is not available');
  }
  const user = await findUserById(userId);
  if (!user || user.is_active === false) {
    throw new AuthError('User is not available');
  }

  const payload = buildUserPayload(user);
  const tokens = issueTokens(payload);

  return {
    user: payload,
    ...tokens,
    accessTokenExpiresIn,
    refreshTokenExpiresIn,
  };
};

const logout = async (refreshToken) => {
  let decoded;
  try {
    decoded = verifyJwt(refreshToken, refreshSecret);
  } catch (error) {
    throw new AuthError('Refresh token is invalid or expired');
  }

  if (decoded.tokenType !== 'refresh') {
    throw new AuthError('Invalid token type');
  }

  revokeRefreshToken(refreshToken, decoded.exp);

  return { success: true };
};

module.exports = {
  login,
  refreshSession,
  logout,
  AuthError,
  accessTokenExpiresIn,
  refreshTokenExpiresIn,
};
