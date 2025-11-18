const crypto = require('crypto');

const UNIT_IN_SECONDS = {
  s: 1,
  m: 60,
  h: 60 * 60,
  d: 60 * 60 * 24,
};

const base64UrlEncode = (input) =>
  Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

const base64UrlDecode = (input) => {
  const padLength = 4 - (input.length % 4 || 4);
  const padded = input + '='.repeat(padLength === 4 ? 0 : padLength);
  return Buffer.from(padded.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
};

const signJwt = (payload, secret, expiresInSeconds) => {
  const header = { alg: 'HS256', typ: 'JWT' };
  const issuedAt = Math.floor(Date.now() / 1000);
  const claims = {
    ...payload,
    iat: issuedAt,
    exp: issuedAt + expiresInSeconds,
  };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(claims));
  const data = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  return `${data}.${signature}`;
};

const verifyJwt = (token, secret) => {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid token structure');
  }
  const [headerPart, payloadPart, signaturePart] = parts;
  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(`${headerPart}.${payloadPart}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  const provided = Buffer.from(signaturePart, 'utf8');
  const expected = Buffer.from(expectedSig, 'utf8');
  if (provided.length !== expected.length || !crypto.timingSafeEqual(expected, provided)) {
    throw new Error('Invalid token signature');
  }
  const payload = JSON.parse(base64UrlDecode(payloadPart));
  if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
    throw new Error('Token expired');
  }
  return payload;
};

const createPasswordHash = (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
};

const verifyPassword = (password, storedHash) => {
  if (!storedHash || !storedHash.includes(':')) {
    return false;
  }
  const [salt, originalHash] = storedHash.split(':');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(originalHash, 'hex'), Buffer.from(derived, 'hex'));
  } catch (err) {
    return false;
  }
};

const parseDuration = (value, fallbackSeconds) => {
  if (!value) {
    return fallbackSeconds;
  }
  const trimmed = String(value).trim();
  const match = trimmed.match(/^(\d+)([smhd])?$/i);
  if (!match) {
    return fallbackSeconds;
  }
  const amount = Number(match[1]);
  const unit = match[2] ? match[2].toLowerCase() : 's';
  const multiplier = UNIT_IN_SECONDS[unit] || 1;
  return amount * multiplier;
};

module.exports = {
  signJwt,
  verifyJwt,
  createPasswordHash,
  verifyPassword,
  parseDuration,
};
