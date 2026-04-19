// src/i18n/index.js — i18n context provider + hooks
// NOTE: No JSX here — uses React.createElement so this .js file works with Vite/OXC
import { createElement, createContext, useContext, useState, useEffect, useCallback } from 'react';
import ar from './ar';
import en from './en';

const DICTIONARIES = { ar, en };
const DEFAULT_LANG = 'ar';
const STORAGE_KEY  = 'najah_lang';

export const I18nContext = createContext(null);

/* ── Deep-get helper: t('nav.dashboard') → 'لوحة التحكم' ── */
function deepGet(obj, path) {
  return path.split('.').reduce((acc, key) => acc?.[key], obj) ?? path;
}

/* ── Provider (no JSX — pure createElement) ───────────────── */
export function I18nProvider({ children }) {
  const [lang, setLang] = useState(
    () => (typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null) || DEFAULT_LANG
  );

  const dict = DICTIONARIES[lang] ?? DICTIONARIES[DEFAULT_LANG];

  useEffect(() => {
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', lang);
    localStorage.setItem(STORAGE_KEY, lang);
  }, [lang]);

  const t = useCallback(
    (key) => deepGet(dict, key),
    [dict]
  );

  const toggleLang = useCallback(() => {
    setLang(prev => (prev === 'ar' ? 'en' : 'ar'));
  }, []);

  const value = {
    lang,
    setLang,
    toggleLang,
    t,
    isRTL: lang === 'ar',
    dir:   lang === 'ar' ? 'rtl' : 'ltr',
  };

  // Use createElement instead of JSX so this file can stay .js
  return createElement(I18nContext.Provider, { value }, children);
}

/* ── Hook ─────────────────────────────────────────────────── */
export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useTranslation must be used within I18nProvider');
  return ctx;
}

export default { I18nProvider, useTranslation };
