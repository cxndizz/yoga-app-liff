import { placeholderImage } from './formatters';

// Generate unique placeholder images with different accent colors
const generatePlaceholder = (text, variant = 0) => {
  const variants = [
    { primary: '%234c1d95', secondary: '%23fbbf24' },
    { primary: '%233b0764', secondary: '%23c4b5fd' },
    { primary: '%235b21b6', secondary: '%23f59e0b' },
  ];
  const colors = variants[variant % variants.length];
  
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400"><defs><linearGradient id="grad${variant}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${colors.primary}" /><stop offset="100%" stop-color="%231e1b4b" /></linearGradient></defs><rect width="600" height="400" fill="url(%23grad${variant})"/><circle cx="300" cy="160" r="50" fill="none" stroke="${colors.secondary}" stroke-width="2" opacity="0.4"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" fill="${colors.secondary}" font-family="Arial" font-size="18" font-weight="600">${text}</text></svg>`;
};

export const mockMyCourses = [
  {
    id: '201',
    courseId: '201',
    title: 'Morning Flow & Breathwork',
    branchName: 'Thonglor Studio',
    channel: 'Hybrid',
    instructorName: 'Coach June',
    nextSession: { date: '2024-11-09', time: '08:30', topic: 'Grounding & Mobility' },
    accessRemaining: 3,
    accessTotal: 6,
    paymentStatus: 'paid',
    coverImage: generatePlaceholder('Morning Flow', 0),
    reference: 'INV-20241109-01',
    priceCents: 149900,
    isFree: false,
  },
  {
    id: '202',
    courseId: '104',
    title: 'Evening Yin & Sound Bath',
    branchName: 'Central Rama 9',
    channel: 'Onsite',
    instructorName: 'Coach May',
    nextSession: { date: '2024-11-12', time: '19:00', topic: 'Deep Stretch' },
    accessRemaining: -1,
    accessTotal: -1,
    paymentStatus: 'pending',
    coverImage: generatePlaceholder('Yin Yoga', 1),
    reference: 'INV-20241112-02',
    priceCents: 99000,
    isFree: false,
  },
  {
    id: '203',
    courseId: '108',
    title: 'Mindful Mobility (Recorded)',
    branchName: 'Online',
    channel: 'Online',
    instructorName: 'Coach Beam',
    nextSession: { date: '2024-11-30', time: 'Anytime', topic: 'Self-paced' },
    accessRemaining: 0,
    accessTotal: 0,
    paymentStatus: 'paid',
    coverImage: generatePlaceholder('Mobility', 2),
    reference: 'INV-20241001-08',
    priceCents: 0,
    isFree: true,
  },
];

export const mockPaymentChannels = [
  {
    id: 'bank',
    label: 'Bank transfer / PromptPay',
    description: 'โอนผ่านธนาคาร หรือสแกน PromptPay แล้วส่งสลิปให้แอดมินตรวจสอบ',
    eta: 'ภายใน 5-10 นาทีหลังส่งสลิป',
    recommended: true,
  },
  {
    id: 'card',
    label: 'Credit / Debit (Gateway)',
    description: 'เปิดใช้งานเมื่อเชื่อมต่อเกตเวย์บัตรแล้ว — หน้านี้จำลองการชำระเงิน',
    eta: 'ชำระแล้วเปิดสิทธิ์อัตโนมัติ',
    disabled: true,
  },
];

export const mockTransferAccounts = [
  {
    bank: 'Kasikorn Bank',
    accountName: 'Yoga Luxe Studio',
    accountNumber: '123-4-56789-0',
    promptPay: '0123456789012',
  },
];