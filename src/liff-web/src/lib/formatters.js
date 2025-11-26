const localeMap = {
  en: 'en-US',
  th: 'th-TH',
  zh: 'zh-CN',
};

const formatPriceTHB = (priceCents = 0, isFree = false, { language = 'en', freeLabel = 'Free access' } = {}) => {
  if (isFree) return freeLabel;
  const amount = Number(priceCents || 0) / 100;
  const locale = localeMap[language] || localeMap.en;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'THB',
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatAccessTimes = (
  accessTimes,
  {
    language = 'en',
    singleLabel = 'Access 1 time',
    unlimitedLabel = 'Unlimited access',
    multipleTemplate = 'Access {count} times',
  } = {},
) => {
  const single = singleLabel;
  const unlimited = unlimitedLabel;
  const pluralTemplate = multipleTemplate;

  if (!accessTimes) return single;
  if (accessTimes === -1) return unlimited;

  return pluralTemplate.replace('{count}', accessTimes);
};

const formatDateDisplay = (dateString, language = 'en') => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  const locale = localeMap[language] || localeMap.en;
  return date.toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatTimeDisplay = (timeString) => {
  if (!timeString) return '';
  return timeString.slice(0, 5);
};

// Updated placeholder with purple/yellow color scheme
const placeholderImage =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400"><defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%234c1d95" /><stop offset="50%" stop-color="%233b0764" /><stop offset="100%" stop-color="%231e1b4b" /></linearGradient><linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="%23fbbf24" /><stop offset="100%" stop-color="%23f59e0b" /></linearGradient></defs><rect width="600" height="400" fill="url(%23grad)"/><circle cx="300" cy="180" r="60" fill="none" stroke="%23c4b5fd" stroke-width="2" opacity="0.3"/><circle cx="300" cy="180" r="40" fill="none" stroke="%23c4b5fd" stroke-width="2" opacity="0.5"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" fill="%23fbbf24" font-family="Arial" font-size="20" font-weight="600">Yoga Course</text><rect x="200" y="300" width="200" height="4" rx="2" fill="url(%23accent)" opacity="0.6"/></svg>';

export { formatAccessTimes, formatDateDisplay, formatPriceTHB, formatTimeDisplay, placeholderImage };