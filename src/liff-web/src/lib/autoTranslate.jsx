import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { formatAccessTimes, formatDateDisplay, formatPriceTHB, formatTimeDisplay } from './formatters';

const languageOptions = [
  { code: 'en', label: 'English' },
  { code: 'zh', label: '中文' },
  { code: 'th', label: 'ไทย' },
];

const TranslationContext = createContext({});
const translationCache = new Map();
const TRANSLATE_ENDPOINT =
  import.meta?.env?.VITE_TRANSLATE_ENDPOINT ?? 'https://libretranslate.de/translate';
let hasTranslationError = false;

async function translateText(text, targetLanguage) {
  if (!text) return '';
  if (targetLanguage === 'en') return text;

  const cacheKey = `${targetLanguage}:${text}`;
  if (translationCache.has(cacheKey)) return translationCache.get(cacheKey);

  if (!TRANSLATE_ENDPOINT) return text;

  try {
    const response = await fetch(TRANSLATE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: text, source: 'en', target: targetLanguage, format: 'text' }),
    });

    if (!response.ok) throw new Error(`Translation request failed: ${response.status}`);

    const data = await response.json();
    const translated = data?.translatedText || text;
    translationCache.set(cacheKey, translated);
    return translated;
  } catch (error) {
    if (!hasTranslationError) {
      console.warn('Translation unavailable, showing original text instead.', error);
      hasTranslationError = true;
    }
    translationCache.set(cacheKey, text);
    return text;
  }
}

async function translateMap(stringsMap = {}, targetLanguage = 'en') {
  const entries = await Promise.all(
    Object.entries(stringsMap).map(async ([key, value]) => {
      try {
        const translated = await translateText(value, targetLanguage);
        return [key, translated];
      } catch (error) {
        console.error('Translation error:', error);
        return [key, value];
      }
    }),
  );

  return Object.fromEntries(entries);
}

export function AutoTranslateProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    if (typeof window === 'undefined') return 'en';
    return localStorage.getItem('yl-liff-lang') || 'en';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('yl-liff-lang', language);
  }, [language]);

  const baseSystemText = useMemo(
    () => ({
      freeLabel: 'Free access',
      accessSingle: 'Access 1 time',
      accessUnlimited: 'Unlimited access',
      accessMultiple: 'Access {count} times',
    }),
    [],
  );

  const [systemText, setSystemText] = useState(baseSystemText);

  useEffect(() => {
    let active = true;

    translateMap(baseSystemText, language)
      .then((mapped) => {
        if (active) setSystemText(mapped);
      })
      .catch(() => {
        if (active) setSystemText(baseSystemText);
      });

    return () => {
      active = false;
    };
  }, [language, baseSystemText]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      languageOptions,
      translateInstant: (text) => translateText(text, language).catch(() => text),
      formatPrice: (priceCents, isFree) =>
        formatPriceTHB(priceCents, isFree, { language, freeLabel: systemText.freeLabel }),
      formatAccessTimes: (accessTimes) =>
        formatAccessTimes(accessTimes, {
          language,
          singleLabel: systemText.accessSingle,
          unlimitedLabel: systemText.accessUnlimited,
          multipleTemplate: systemText.accessMultiple,
        }),
      formatDate: (dateString) => formatDateDisplay(dateString, language),
      formatTime: formatTimeDisplay,
    }),
    [language, systemText],
  );

  return <TranslationContext.Provider value={value}>{children}</TranslationContext.Provider>;
}

export const useAutoTranslate = () => useContext(TranslationContext);

export function useTranslatedText(stringsMap) {
  const { language } = useAutoTranslate();
  const [translated, setTranslated] = useState(stringsMap);

  useEffect(() => {
    let active = true;
    translateMap(stringsMap, language)
      .then((mapped) => {
        if (active) setTranslated(mapped);
      })
      .catch(() => {
        if (active) setTranslated(stringsMap);
      });

    return () => {
      active = false;
    };
  }, [language, stringsMap]);

  return translated;
}

export { translateText };
