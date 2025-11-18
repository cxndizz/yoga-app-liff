const dotenv = require('dotenv');
dotenv.config();
const { verifyJwt } = require('../utils/security');

const accessSecret = process.env.JWT_ACCESS_SECRET;
if (!accessSecret) {
  throw new Error('JWT_ACCESS_SECRET is not configured');
}

const extractToken = (headerValue) => {
  if (!headerValue) return null;
  if (headerValue.startsWith('Bearer ')) {
    return headerValue.slice(7).trim();
  }
  return headerValue.trim();
};

const requireAdminAuth = (allowedRoles = []) => (req, res, next) => {
  const token = extractToken(req.headers.authorization);
  if (!token) {
    return res.status(401).json({ message: 'Missing authorization token' });
  }

  try {
    const payload = verifyJwt(token, accessSecret);
    if (payload.tokenType !== 'access') {
      return res.status(401).json({ message: 'Invalid token type' });
    }

    const adminId = payload.sub ? Number(payload.sub) : null;
    if (!adminId) {
      return res.status(401).json({ message: 'Invalid token subject' });
    }

    const adminRole = payload.role || null;
    if (allowedRoles.length > 0 && (!adminRole || !allowedRoles.includes(adminRole))) {
      return res.status(403).json({ message: 'Insufficient role to access this resource' });
    }

    req.admin = {
      id: adminId,
      role: adminRole,
      permissions: payload.permissions || [],
      token,
    };
    return next();
  } catch (error) {
    console.warn('Admin authentication failed', error.message);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = { requireAdminAuth };
