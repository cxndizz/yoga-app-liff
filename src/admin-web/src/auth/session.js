const ACCESS_TOKEN_KEY = 'adminAccessToken';
const REFRESH_TOKEN_KEY = 'adminRefreshToken';
const USER_KEY = 'adminUser';

const getWindow = () => (typeof window !== 'undefined' ? window : null);

export const persistSession = ({ accessToken, refreshToken, user }) => {
  const win = getWindow();
  if (!win) return;

  if (accessToken) {
    win.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  }
  if (refreshToken) {
    win.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
  if (user) {
    win.localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
};

export const clearSession = () => {
  const win = getWindow();
  if (!win) return;
  win.localStorage.removeItem(ACCESS_TOKEN_KEY);
  win.localStorage.removeItem(REFRESH_TOKEN_KEY);
  win.localStorage.removeItem(USER_KEY);
};

const safeParseUser = (raw) => {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (_error) {
    return null;
  }
};

export const getSessionSnapshot = () => {
  const win = getWindow();
  if (!win) {
    return {
      accessToken: null,
      refreshToken: null,
      user: null,
    };
  }
  return {
    accessToken: win.localStorage.getItem(ACCESS_TOKEN_KEY),
    refreshToken: win.localStorage.getItem(REFRESH_TOKEN_KEY),
    user: safeParseUser(win.localStorage.getItem(USER_KEY)),
  };
};

export const updateStoredUser = (user) => {
  const win = getWindow();
  if (!win) return;
  if (user) {
    win.localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    win.localStorage.removeItem(USER_KEY);
  }
};
