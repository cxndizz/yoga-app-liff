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

const placeholderImage =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400"><defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="%23192749" /><stop offset="100%" stop-color="%23e7b1a0" /></linearGradient></defs><rect width="600" height="400" fill="url(%23grad)"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23f5f6fb" font-family="Arial" font-size="24">Yoga Course</text></svg>';

export { formatAccessTimes, formatDateDisplay, formatPriceTHB, formatTimeDisplay, placeholderImage };
