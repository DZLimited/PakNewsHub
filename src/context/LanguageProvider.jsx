import { useCallback, useEffect, useMemo, useState } from 'react';
import { LanguageContext } from './language';
import { translate } from '../i18n/strings';
import { timeAgo } from '../utils/format';

const STORAGE_KEY = 'lang';

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() =>
    localStorage.getItem(STORAGE_KEY) === 'ur' ? 'ur' : 'en'
  );

  useEffect(() => {
    const root = document.documentElement;
    root.lang = lang;
    root.dir = lang === 'ur' ? 'rtl' : 'ltr';
    localStorage.setItem(STORAGE_KEY, lang);
  }, [lang]);

  const toggleLanguage = useCallback(() => setLang(l => (l === 'en' ? 'ur' : 'en')), []);

  const value = useMemo(() => {
    const isUrdu = lang === 'ur';
    return {
      lang,
      isUrdu,
      toggleLanguage,
      t: (key, vars) => translate(lang, key, vars),
      title: a => (isUrdu ? a.urduTitle : a.title),
      altTitle: a => (isUrdu ? a.title : a.urduTitle),
      categoryLabel: c => (c ? (isUrdu ? c.urdu : c.label) : ''),
      ago: iso => timeAgo(iso, lang),
    };
  }, [lang, toggleLanguage]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
