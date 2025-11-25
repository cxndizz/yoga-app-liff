import { placeholderImage } from './formatters';

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
    coverImage: placeholderImage,
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
    coverImage: placeholderImage,
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
    coverImage: placeholderImage,
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
    label: 'Credit / Debit (Omise)',
    description: 'เปิดใช้งานเมื่อเชื่อมต่อ Omise แล้ว — หน้านี้จำลองการชำระเงิน',
    eta: 'ชำระแล้วเปิดสิทธิ์อัตโนมัติ',
    disabled: true,
    disabledReason: 'เชื่อมต่อ Omise เพื่อเปิดชำระผ่านบัตร',
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
