import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslation from '../locales/en/translation.json';
import thTranslation from '../locales/th/translation.json';
import zhTranslation from '../locales/zh/translation.json';

const resources = {
  en: { translation: enTranslation },
  th: { translation: thTranslation },
  zh: { translation: zhTranslation },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: ['en', 'th', 'zh'],

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: 'yl-liff-lang',
      caches: ['localStorage'],
    },

    interpolation: {
      escapeValue: false, // React already escapes values
    },

    react: {
      useSuspense: false, // Disable suspense for better UX
    },
  });

export default i18n;

// Language options for UI
export const languageOptions = [
  { code: 'en', label: 'English', nativeName: 'English' },
  { code: 'zh', label: '中文', nativeName: '中文' },
  { code: 'th', label: 'ไทย', nativeName: 'ไทย' },
];

// Locale mapping for Intl APIs
export const localeMap = {
  en: 'en-US',
  th: 'th-TH',
  zh: 'zh-CN',
};
