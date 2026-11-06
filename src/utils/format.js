import { getCategory } from '../data/categories';

const UNITS = {
  en: { now: 'just now', m: n => `${n}m ago`,       h: n => `${n}h ago`,         d: n => `${n}d ago` },
  ur: { now: 'ابھی',     m: n => `${n} منٹ پہلے`, h: n => `${n} گھنٹے پہلے`, d: n => `${n} دن پہلے` },
};

/** "12m ago" / "12 منٹ پہلے" — derived from the ISO date instead of stored text. */
export function timeAgo(iso, lang = 'en', now = Date.now()) {
  const u = UNITS[lang] ?? UNITS.en;
  const mins = Math.max(0, Math.floor((now - Date.parse(iso)) / 60000));
  if (mins < 1) return u.now;
  if (mins < 60) return u.m(mins);
  const hours = Math.floor(mins / 60);
  if (hours < 24) return u.h(hours);
  return u.d(Math.floor(hours / 24));
}

/** 4200 → "4.2K", 950 → "950" */
export function formatCount(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export const categoryEmoji = id => getCategory(id)?.emoji ?? '🌍';
