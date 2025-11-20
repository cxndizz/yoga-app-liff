import React, { createContext, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { languageOptions, localeMap } from '../i18n';
import { formatAccessTimes, formatDateDisplay, formatPriceTHB, formatTimeDisplay } from './formatters';

const TranslationContext = createContext({});

export function AutoTranslateProvider({ children }) {
  const { t, i18n } = useTranslation();

  const language = i18n.language || 'en';

  const setLanguage = (lang) => {
    i18n.changeLanguage(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('yl-liff-lang', lang);
    }
  };

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      languageOptions,
      t, // Direct access to i18next translate function
      formatPrice: (priceCents, isFree) =>
        formatPriceTHB(priceCents, isFree, {
          language,
          freeLabel: t('access.free'),
        }),
      formatAccessTimes: (accessTimes) =>
        formatAccessTimes(accessTimes, {
          language,
          singleLabel: t('access.single'),
          unlimitedLabel: t('access.unlimited'),
          multipleTemplate: t('access.multiple', { count: '{count}' }),
        }),
      formatDate: (dateString) => formatDateDisplay(dateString, language),
      formatTime: formatTimeDisplay,
      getLocale: () => localeMap[language] || localeMap.en,
    }),
    [language, t],
  );

  return <TranslationContext.Provider value={value}>{children}</TranslationContext.Provider>;
}

export const useAutoTranslate = () => useContext(TranslationContext);

// Re-export useTranslation for direct usage
export { useTranslation };
