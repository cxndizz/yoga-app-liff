const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

class ValidationError extends Error {
  constructor(details) {
    super('Invalid request payload');
    this.statusCode = 400;
    this.details = details;
  }
}

const sanitize = (value) => (typeof value === 'string' ? value.trim() : '');

const validateLoginPayload = (body = {}) => {
  const errors = {};
  const email = sanitize(body.email);
  const password = sanitize(body.password);

  if (!email) {
    errors.email = 'Email is required';
  } else if (!EMAIL_REGEX.test(email)) {
    errors.email = 'Email format is invalid';
  }

  if (!password) {
    errors.password = 'Password is required';
  } else if (password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  }

  if (Object.keys(errors).length > 0) {
    throw new ValidationError(errors);
  }

  return {
    email: email.toLowerCase(),
    password,
  };
};

const validateRefreshPayload = (body = {}) => {
  const token = sanitize(body.refreshToken || body.token || body.refresh_token);
  if (!token || token.length < 16) {
    throw new ValidationError({ refreshToken: 'Refresh token is required' });
  }
  return token;
};

module.exports = {
  ValidationError,
  validateLoginPayload,
  validateRefreshPayload,
};
