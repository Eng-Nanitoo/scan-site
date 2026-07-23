import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import en from './en';
import fr from './fr';
import ar from './ar';

const translations = { en, fr, ar };

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'en');

  useEffect(() => {
    localStorage.setItem('lang', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  const t = useCallback((key, params) => {
    let str = translations[lang]?.[key] || translations.en[key] || key;
    if (params) {
      Object.keys(params).forEach(k => {
        str = str.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), params[k]);
      });
    }
    return str;
  }, [lang]);

  const isRTL = lang === 'ar';

  return (
    <I18nContext.Provider value={{ lang, setLang, t, isRTL }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
