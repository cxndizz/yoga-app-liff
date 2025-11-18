const { login, refreshSession, AuthError } = require('./auth.service');
const { ValidationError, validateLoginPayload, validateRefreshPayload } = require('./auth.validator');

const formatResponse = (result) => ({
  accessToken: result.accessToken,
  refreshToken: result.refreshToken,
  expiresIn: {
    accessToken: result.accessTokenExpiresIn,
    refreshToken: result.refreshTokenExpiresIn,
  },
  user: result.user,
});

const handleError = (error, res) => {
  if (error instanceof ValidationError) {
    return res.status(error.statusCode).json({ message: error.message, details: error.details });
  }
  if (error instanceof AuthError) {
    return res.status(error.statusCode).json({ message: error.message });
  }
  console.error('Unexpected auth error', error);
  return res.status(500).json({ message: 'Unexpected authentication error' });
};

const loginAdmin = async (req, res) => {
  try {
    const credentials = validateLoginPayload(req.body);
    const result = await login(credentials.email, credentials.password);
    return res.json(formatResponse(result));
  } catch (error) {
    return handleError(error, res);
  }
};

const refreshAdminSession = async (req, res) => {
  try {
    const refreshToken = validateRefreshPayload(req.body);
    const result = await refreshSession(refreshToken);
    return res.json(formatResponse(result));
  } catch (error) {
    return handleError(error, res);
  }
};

const logoutAdmin = async (_req, res) => {
  return res.status(204).send();
};

module.exports = {
  loginAdmin,
  refreshAdminSession,
  logoutAdmin,
};
