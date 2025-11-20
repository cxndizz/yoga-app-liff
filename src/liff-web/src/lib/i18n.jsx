import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { formatAccessTimes, formatDateDisplay, formatPriceTHB, formatTimeDisplay } from './formatters';

const translations = {
  en: {
    nav: {
      home: 'Home',
      courses: 'Courses',
      premium: 'Premium picks',
      buyCourse: 'Buy courses',
      brandTagline: 'Boutique LIFF Studio',
      language: 'Language',
    },
    hero: {
      signature: 'SIGNATURE EXPERIENCE',
      fallbackSubtitle: 'Hand-picked experiences by our studio team',
      secondaryCta: 'Find the right course',
    },
    home: {
      featuredTitle: 'Featured courses',
      featuredSubtitle: 'Curated classes with real-time availability',
      viewAll: 'View all',
      loading: 'Loading courses...',
      error: 'Unable to load courses right now',
      empty: 'No courses are open for booking yet',
      omisePill1: 'Omise Payment',
      omisePill2: 'Hybrid / Onsite / Online',
      omiseDescription:
        'Seamless booking and payments with Omise and shared SchemaDB — works with LINE LIFF login and real-time access control.',
      ctaStart: 'Start browsing',
      ctaPremium: 'Premium courses',
    },
    courses: {
      title: 'All courses',
      subtitle: 'Search and filter by branch and instructor',
      loading: 'Loading all courses...',
      error: 'Unable to fetch courses',
      empty: 'No courses match your search',
      featuredCtaFree: 'Register for free',
      featuredCtaPaid: 'Book this course',
    },
    detail: {
      loading: 'Loading course details...',
      error: 'Course not found, please return to the main page',
      back: '← Back',
      channelFallback: 'Course',
      priceAccess: 'Price / Access',
      chooseOther: 'Browse other courses',
      registerNow: 'Register now',
      buyNow: 'Pay via Omise',
      levelLabel: 'Level',
      seatsLeft: 'Seats left {left}/{capacity}',
      sessionsTitle: 'Sessions',
      sessionsSubtitle: 'Responsive timetable for Onsite / Online / Hybrid',
    },
    filter: {
      searchLabel: 'Search course name or keywords',
      searchPlaceholder: 'Try Yin, Mobility, Meditation',
      branchLabel: 'Branch / Location',
      branchAll: 'All locations',
      instructorLabel: 'Instructor',
      instructorAll: 'All instructors',
    },
    card: {
      channelFallback: 'Course',
      seats: '{count} seats',
      seatsUnknown: 'Check availability',
      instructorBioFallback: 'Studio instructor',
      viewDetail: 'View details',
      register: 'Register',
      buy: 'Buy course',
    },
    session: {
      none: 'No sessions available yet',
      available: '{count} seats left',
      open: 'Open for booking',
      topicFallback: 'Session',
    },
    footer: {
      tagline: 'Boutique LIFF Studio • Luxury movement and mindfulness experiences',
      about: 'About',
      contact: 'Contact',
      terms: 'Terms',
      privacy: 'Privacy',
      rights: '© 2024 Yoga Luxe LIFF. All rights reserved.',
    },
    price: {
      free: 'Free access',
    },
    access: {
      single: 'Access 1 time',
      unlimited: 'Unlimited access',
      multiple: 'Access {count} times',
    },
    fallback: {
      branch: 'Unspecified branch',
      instructor: 'Unspecified instructor',
      courseLabel: 'Course',
    },
  },
  th: {
    nav: {
      home: 'หน้าแรก',
      courses: 'คอร์สทั้งหมด',
      premium: 'คอร์สพรีเมียม',
      buyCourse: 'ซื้อคอร์ส',
      brandTagline: 'สตูดิโอโยคะ LIFF สไตล์บูทีค',
      language: 'ภาษา',
    },
    hero: {
      signature: 'SIGNATURE EXPERIENCE',
      fallbackSubtitle: 'คอร์สที่ทีมคัดมาเป็นพิเศษ',
      secondaryCta: 'ค้นหาคอร์สที่ใช่',
    },
    home: {
      featuredTitle: 'คอร์สแนะนำ',
      featuredSubtitle: 'เลือกจากคอร์สยอดนิยม พร้อมดูที่ว่างแบบเรียลไทม์',
      viewAll: 'ดูทั้งหมด',
      loading: 'กำลังโหลดคอร์ส...',
      error: 'เกิดข้อผิดพลาดในการโหลดข้อมูล',
      empty: 'ยังไม่พบคอร์สที่เปิดรับจองในระบบ',
      omisePill1: 'Omise Payment',
      omisePill2: 'Hybrid / Onsite / Online',
      omiseDescription:
        'ประสบการณ์จองและชำระเงินที่ลื่นไหลด้วย Omise เชื่อม SchemaDB เดิม รองรับ LINE LIFF และสิทธิ์เข้าเรียนแบบเรียลไทม์',
      ctaStart: 'เริ่มเลือกคอร์ส',
      ctaPremium: 'คอร์สระดับพรีเมียม',
    },
    courses: {
      title: 'คอร์สทั้งหมด',
      subtitle: 'ค้นหาและกรองคอร์สด้วยสาขาและผู้สอน',
      loading: 'กำลังโหลดคอร์สทั้งหมด...',
      error: 'ไม่สามารถดึงข้อมูลคอร์สได้',
      empty: 'ไม่มีคอร์สที่ตรงกับเงื่อนไขการค้นหา',
      featuredCtaFree: 'ลงทะเบียนฟรี',
      featuredCtaPaid: 'จองคอร์สนี้',
    },
    detail: {
      loading: 'กำลังโหลดรายละเอียดคอร์ส...',
      error: 'ไม่พบคอร์สที่คุณต้องการ กรุณากลับไปหน้าหลัก',
      back: '← กลับ',
      channelFallback: 'คอร์ส',
      priceAccess: 'ราคา / สิทธิ์เข้าเรียน',
      chooseOther: 'เลือกคอร์สอื่น',
      registerNow: 'ลงทะเบียนทันที',
      buyNow: 'ซื้อคอร์สผ่าน Omise',
      levelLabel: 'ระดับ',
      seatsLeft: 'ที่นั่งเหลือ {left}/{capacity}',
      sessionsTitle: 'รอบเรียน / Sessions',
      sessionsSubtitle: 'ตารางเรียนปรับตามขนาดหน้าจอ รองรับ Onsite / Online / Hybrid',
    },
    filter: {
      searchLabel: 'ค้นหาชื่อคอร์สหรือคำสำคัญ',
      searchPlaceholder: 'ค้นหาเช่น Yin, Mobility, Meditation',
      branchLabel: 'สาขา / สถานที่',
      branchAll: 'ทั้งหมด',
      instructorLabel: 'ผู้สอน',
      instructorAll: 'ผู้สอนทั้งหมด',
    },
    card: {
      channelFallback: 'คอร์ส',
      seats: '{count} ที่นั่ง',
      seatsUnknown: 'ตรวจสอบที่ว่าง',
      instructorBioFallback: 'ผู้สอนจากสตูดิโอ',
      viewDetail: 'ดูรายละเอียด',
      register: 'ลงทะเบียน',
      buy: 'ซื้อคอร์ส',
    },
    session: {
      none: 'ยังไม่มีรอบเรียนสำหรับคอร์สนี้',
      available: 'เหลือ {count} ที่',
      open: 'เปิดจอง',
      topicFallback: 'Session',
    },
    footer: {
      tagline: 'Boutique LIFF Studio • Luxury movement and mindfulness experiences',
      about: 'About',
      contact: 'Contact',
      terms: 'Terms',
      privacy: 'Privacy',
      rights: '© 2024 Yoga Luxe LIFF. All rights reserved.',
    },
    price: {
      free: 'ใช้ฟรี',
    },
    access: {
      single: 'เข้าถึง 1 ครั้ง',
      unlimited: 'เข้าถึงไม่จำกัดครั้ง',
      multiple: 'เข้าถึง {count} ครั้ง',
    },
    fallback: {
      branch: 'ไม่ระบุสาขา',
      instructor: 'ไม่ระบุผู้สอน',
      courseLabel: 'คอร์ส',
    },
  },
  zh: {
    nav: {
      home: '首页',
      courses: '全部课程',
      premium: '精选课程',
      buyCourse: '购买课程',
      brandTagline: '精品 LIFF 瑜伽馆',
      language: '语言',
    },
    hero: {
      signature: 'SIGNATURE EXPERIENCE',
      fallbackSubtitle: '由工作室团队精心挑选的课程',
      secondaryCta: '寻找合适的课程',
    },
    home: {
      featuredTitle: '推荐课程',
      featuredSubtitle: '热门课程与实时席位',
      viewAll: '查看全部',
      loading: '正在载入课程…',
      error: '目前无法载入课程',
      empty: '暂时没有开放预约的课程',
      omisePill1: 'Omise 支付',
      omisePill2: '混合 / 线下 / 线上',
      omiseDescription: '使用 Omise 与共享 SchemaDB，支持 LINE LIFF 登录与实时课程权限。',
      ctaStart: '开始挑选课程',
      ctaPremium: '高级课程',
    },
    courses: {
      title: '全部课程',
      subtitle: '按分店与讲师搜索和筛选',
      loading: '正在载入全部课程…',
      error: '无法取得课程资料',
      empty: '没有符合条件的课程',
      featuredCtaFree: '免费报名',
      featuredCtaPaid: '预约此课程',
    },
    detail: {
      loading: '正在载入课程详情…',
      error: '找不到课程，请返回首页',
      back: '← 返回',
      channelFallback: '课程',
      priceAccess: '价格 / 访问次数',
      chooseOther: '浏览其他课程',
      registerNow: '立即报名',
      buyNow: '使用 Omise 付款',
      levelLabel: '等级',
      seatsLeft: '剩余 {left}/{capacity} 个名额',
      sessionsTitle: '课节 / Sessions',
      sessionsSubtitle: '自适应课表，支持线下 / 线上 / 混合',
    },
    filter: {
      searchLabel: '搜索课程名称或关键字',
      searchPlaceholder: '例如 Yin, Mobility, Meditation',
      branchLabel: '分店 / 地点',
      branchAll: '全部地点',
      instructorLabel: '讲师',
      instructorAll: '全部讲师',
    },
    card: {
      channelFallback: '课程',
      seats: '{count} 个名额',
      seatsUnknown: '查看名额',
      instructorBioFallback: '工作室讲师',
      viewDetail: '查看详情',
      register: '报名',
      buy: '购买课程',
    },
    session: {
      none: '尚无课节可预约',
      available: '剩余 {count} 名额',
      open: '开放预约',
      topicFallback: 'Session',
    },
    footer: {
      tagline: 'Boutique LIFF Studio • Luxury movement and mindfulness experiences',
      about: 'About',
      contact: 'Contact',
      terms: 'Terms',
      privacy: 'Privacy',
      rights: '© 2024 Yoga Luxe LIFF. All rights reserved.',
    },
    price: {
      free: '免费课程',
    },
    access: {
      single: '可使用 1 次',
      unlimited: '无限次使用',
      multiple: '可使用 {count} 次',
    },
    fallback: {
      branch: '未指定分店',
      instructor: '未指定讲师',
      courseLabel: '课程',
    },
  },
};

const languageOptions = [
  { code: 'en', label: 'English' },
  { code: 'zh', label: '中文' },
  { code: 'th', label: 'ไทย' },
];

const I18nContext = createContext({});

export function I18nProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    if (typeof window === 'undefined') return 'en';
    return localStorage.getItem('yl-liff-lang') || 'en';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('yl-liff-lang', language);
  }, [language]);

  const t = useCallback(
    (key, vars = {}) => {
      const resolve = (lang) => key.split('.').reduce((obj, part) => obj?.[part], translations[lang]);
      const text = resolve(language) ?? resolve('en') ?? key;

      if (typeof text !== 'string') return text || key;

      return Object.entries(vars).reduce((result, [varKey, value]) => {
        const regex = new RegExp(`{${varKey}}`, 'g');
        return result.replace(regex, value);
      }, text);
    },
    [language],
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      languageOptions,
      formatPrice: (priceCents, isFree) => formatPriceTHB(priceCents, isFree, { language, t }),
      formatAccessTimes: (accessTimes) => formatAccessTimes(accessTimes, { language, t }),
      formatDate: (dateString) => formatDateDisplay(dateString, language),
      formatTime: formatTimeDisplay,
    }),
    [language, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);

export { translations };
