import { createContext, useContext } from 'react';

export const LanguageContext = createContext(null);

/**
 * Returns { lang, isUrdu, toggleLanguage, t, title, categoryLabel, ago }.
 *  - t(key, vars)        → translated UI string
 *  - title(article)      → headline in the current language
 *  - altTitle(article)   → headline in the other language (shown as subtitle)
 *  - categoryLabel(cat)  → category name in the current language
 *  - ago(iso)            → localized relative time
 */
export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside <LanguageProvider>');
  return ctx;
}
