export const decodeJwtPayload = (token) => {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(atob(payload));
    return decoded;
  } catch (_error) {
    return null;
  }
};

export const isTokenExpired = (payload) => {
  if (!payload || !payload.exp) return true;
  const nowInSeconds = Math.floor(Date.now() / 1000);
  return payload.exp <= nowInSeconds;
};

export const shouldRefreshToken = (payload, thresholdSeconds = 120) => {
  if (!payload || !payload.exp) return false;
  const nowInSeconds = Math.floor(Date.now() / 1000);
  return payload.exp - nowInSeconds <= thresholdSeconds;
};
