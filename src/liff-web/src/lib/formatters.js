const formatPriceTHB = (priceCents = 0, isFree = false) => {
  if (isFree) return 'Free Access';
  const amount = Number(priceCents || 0) / 100;
  return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(
    amount,
  );
};

const formatAccessTimes = (accessTimes) => {
  if (!accessTimes) return 'เข้าถึง 1 ครั้ง';
  if (accessTimes === -1) return 'เข้าถึงไม่จำกัดครั้ง';
  return `เข้าถึง ${accessTimes} ครั้ง`;
};

const formatDateDisplay = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatTimeDisplay = (timeString) => {
  if (!timeString) return '';
  return timeString.slice(0, 5);
};

const placeholderImage =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400"><defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="%23192749" /><stop offset="100%" stop-color="%23e7b1a0" /></linearGradient></defs><rect width="600" height="400" fill="url(%23grad)"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23f5f6fb" font-family="Arial" font-size="24">Yoga Course</text></svg>';

export { formatAccessTimes, formatDateDisplay, formatPriceTHB, formatTimeDisplay, placeholderImage };
