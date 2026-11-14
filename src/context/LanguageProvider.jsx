import { useCallback, useEffect, useMemo, useState } from 'react';
import { LanguageContext } from './language';
import { translate } from '../i18n/strings';
import { timeAgo } from '../utils/format';
import { getSource } from '../data/sources';

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
    // Urdu-edition stories (Urdu sources) are written in Urdu: title and
    // excerpt are already Urdu, and there is no English version.
    const isNativeUrdu = a => a?.language === 'ur';
    // English stories may carry an Urdu translation (demo stories; RSS ones
    // only if the optional translator is on). Otherwise: English everywhere.
    const hasUrdu = a => Boolean(a?.urduTitle);
    return {
      lang,
      isUrdu,
      toggleLanguage,
      t: (key, vars) => translate(lang, key, vars),
      title: a => (!isNativeUrdu(a) && isUrdu && hasUrdu(a) ? a.urduTitle : a.title),
      altTitle: a => {
        if (isNativeUrdu(a)) return null;
        return isUrdu ? (hasUrdu(a) ? a.title : null) : (a.urduTitle ?? null);
      },
      showsUrdu: a => isNativeUrdu(a) || (isUrdu && hasUrdu(a)),
      // Short summary in the best language → { text, urdu }
      summary: a => {
        if (isNativeUrdu(a)) return { text: a.excerpt, urdu: true };
        if (isUrdu && a.urduSummary) return { text: a.urduSummary, urdu: true };
        return { text: a.excerpt, urdu: false };
      },
      categoryLabel: c => (c ? (isUrdu ? c.urdu : c.label) : ''),
      // Source name in the UI language: pass an article or a source. Urdu
      // sources have an English name for the English site.
      sourceName: x => {
        const src = x?.sourceName !== undefined ? getSource(x.source) : x;
        if (!isUrdu && src?.nameEn) return src.nameEn;
        return x?.sourceName ?? x?.name ?? '';
      },
      ago: iso => timeAgo(iso, lang),
    };
  }, [lang, toggleLanguage]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
