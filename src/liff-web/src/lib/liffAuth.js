import axios from 'axios';

const apiBase = import.meta.env.VITE_API_BASE_URL;
const liffId = import.meta.env.VITE_LIFF_ID;
const allowedHosts = (import.meta.env.VITE_ALLOWED_HOSTS || '')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

if (!apiBase) {
  throw new Error('VITE_API_BASE_URL is required for LIFF web requests');
}

const api = axios.create({
  baseURL: apiBase,
  headers: { 'Content-Type': 'application/json' },
  timeout: 12000,
});

let liffLoader;

const loadLiffSdk = () => {
  if (typeof window === 'undefined') return Promise.reject(new Error('Window is not available'));
  if (window.liff) return Promise.resolve(window.liff);

  if (!liffLoader) {
    liffLoader = new Promise((resolve, reject) => {
      const existingScript = document.querySelector('script[src="https://static.line-scdn.net/liff/edge/2/sdk.js"]');
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(window.liff));
        existingScript.addEventListener('error', (err) => reject(err));
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://static.line-scdn.net/liff/edge/2/sdk.js';
      script.async = true;
      script.onload = () => resolve(window.liff);
      script.onerror = (err) => reject(err);
      document.body.appendChild(script);
    });
  }

  return liffLoader;
};

const isHostAllowed = () =>
  allowedHosts.length === 0 || allowedHosts.includes(window.location.hostname);

export const getCachedLiffUser = () => {
  try {
    const cached = localStorage.getItem('liff_user_cache');
    if (!cached) return null;
    return JSON.parse(cached);
  } catch (err) {
    console.warn('Unable to read LIFF cache', err);
    return null;
  }
};

/**
 * Initialize LIFF, ensure login, and sync the LINE user to the backend.
 * Returns { user, profile } when ready, or flags to indicate skipped/redirecting states.
 */
export const ensureLiffUserSynced = async () => {
  if (!liffId) {
    console.warn('Skipping LIFF login because VITE_LIFF_ID is not set.');
    return { skip: true };
  }

  if (!isHostAllowed()) {
    console.warn('Skipping LIFF login because the current host is not whitelisted.');
    return { skip: true };
  }

  const liff = await loadLiffSdk();
  if (!liff) {
    throw new Error('ไม่สามารถโหลด LIFF SDK ได้');
  }

  await liff.init({ liffId });
  await liff.ready;

  if (!liff.isLoggedIn()) {
    liff.login({ redirectUri: window.location.href });
    return { pendingRedirect: true };
  }

  const profile = await liff.getProfile();
  const decoded = liff.getDecodedIDToken?.() || {};

  const payload = {
    line_user_id: profile.userId,
    full_name: profile.displayName,
    email: decoded.email || null,
    phone: decoded.phone_number || null,
  };

  const { data } = await api.post('/auth/line-login', payload);
  const syncedUser = data?.user || null;

  const cache = { profile, user: syncedUser, syncedAt: new Date().toISOString() };
  try {
    localStorage.setItem('liff_user_cache', JSON.stringify(cache));
  } catch (err) {
    console.warn('Unable to cache LIFF user locally', err);
  }

  return { user: syncedUser, profile };
};
