const LINE_API_BASE = 'https://api.line.me/v2/bot';

const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;

const hasAccessToken = () => typeof accessToken === 'string' && accessToken.trim().length > 0;

async function callLineApi(path, payload) {
  if (!hasAccessToken()) {
    throw new Error('LINE_CHANNEL_ACCESS_TOKEN is not configured');
  }

  const response = await fetch(`${LINE_API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`LINE API error (${response.status}): ${text}`);
  }

  return response.json().catch(() => ({}));
}

async function pushMessage(to, messages) {
  if (!hasAccessToken()) {
    console.warn('[lineMessaging] Missing LINE_CHANNEL_ACCESS_TOKEN, skip push');
    return { skipped: true };
  }

  const normalizedMessages = Array.isArray(messages) ? messages : [messages];
  return callLineApi('/message/push', { to, messages: normalizedMessages });
}

const formatDateForThai = (value) => {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

module.exports = {
  pushMessage,
  formatDateForThai,
};
