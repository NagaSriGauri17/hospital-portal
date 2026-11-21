'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { translations, locales } from '../lib/i18n';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState('en');

  useEffect(() => {
    const saved = localStorage.getItem('appLanguage');
    if (saved && translations[saved]) setLanguageState(saved);
  }, []);

  const setLanguage = (lang) => {
    setLanguageState(lang);
    localStorage.setItem('appLanguage', lang);
  };

  // t('key') or t('key', { name: 'Ravi' }) — {name} in the text is replaced by the value
  const t = (key, vars) => {
    let str = translations[language]?.[key] || translations.en[key] || key;
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => { str = str.split(`{${k}}`).join(String(v)); });
    }
    return str;
  };
  const locale = locales[language] || 'en-IN';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, locale }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}