import { createContext, useContext } from 'react';

export const LanguageContext = createContext(null);

/**
 * Returns { lang, isUrdu, toggleLanguage, t, title, categoryLabel, ago }.
 *  - t(key, vars)        → translated UI string
 *  - title(article)      → headline in the current language (English if no
 *                          Urdu translation exists yet)
 *  - altTitle(article)   → headline in the other language, or null
 *  - showsUrdu(article)  → true when title(article) is Urdu text
 *  - summary(article)    → { text, urdu } short summary in the best language
 *  - categoryLabel(cat)  → category name in the current language
 *  - ago(iso)            → localized relative time
 */
export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside <LanguageProvider>');
  return ctx;
}
