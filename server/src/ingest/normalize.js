// Turns one raw RSS item (as produced by rss-parser) into an Article document.
//
// Every feed formats things differently; each helper below exists because of
// something seen in the real feeds (see comments). normalizeItem() returns
// null for items we should skip (no title, bad link, no/old date).

import crypto from 'node:crypto';
import { getSource } from '../../../src/data/sources.js';

export const EXCERPT_MAX = 280;      // ~2 sentences: summary only, never the full article
export const MAX_AGE_DAYS = 14;      // feeds sometimes re-list old stories

// ── URLs ────────────────────────────────────────────────────────────────
// BBC adds ?at_medium=RSS&at_campaign=rss, DW adds ?maca=en-rss-…, others
// use utm_*. Without removing them the same story could get two URLs (and
// be saved twice), so the cleaned URL is our unique key.
const TRACKING_PARAM = /^(utm_|at_|ns_)|^(maca|cmp|CMP|ito)$/;

export function cleanUrl(raw) {
  if (!raw) return null;
  try {
    const u = new URL(String(raw).trim());
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
    for (const key of [...u.searchParams.keys()]) {
      if (TRACKING_PARAM.test(key)) u.searchParams.delete(key);
    }
    u.hash = '';
    return u.toString();
  } catch {
    return null;
  }
}

/** Stable short id from the URL → same story always gets the same /article/:id */
export const articleId = url => crypto.createHash('sha1').update(url).digest('hex').slice(0, 12);

// ── Text ────────────────────────────────────────────────────────────────
// Guardian and Dawn descriptions contain HTML (<p>, <a>…) and entities.
const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', hellip: '…', ndash: '–', mdash: '—' };

export function decodeEntities(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code) => {
    if (code[0] === '#') {
      const n = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : match;
    }
    return ENTITIES[code.toLowerCase()] ?? match;
  });
}

export function stripHtml(s) {
  return decodeEntities(String(s ?? '').replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
}

/**
 * Short summary. Dawn's feed contains the WHOLE article, so we always cut:
 * whole sentences up to EXCERPT_MAX characters, or a word-boundary cut with "…"
 * if even the first sentence is too long.
 */
export function toExcerpt(text, max = EXCERPT_MAX) {
  if (text.length <= max) return text;
  let out = '';
  for (const sentence of text.split(/(?<=[.!?])\s+/)) {
    if ((out + ' ' + sentence).trim().length > max) break;
    out = (out + ' ' + sentence).trim();
  }
  if (out) return out;
  const cut = text.slice(0, max);
  return cut.slice(0, cut.lastIndexOf(' ') > 0 ? cut.lastIndexOf(' ') : max).replace(/[,;:\s]+$/, '') + '…';
}

// ── Images ──────────────────────────────────────────────────────────────
// BBC: one <media:thumbnail> (240px) · Guardian: several <media:content>
// sizes · Dawn: one <media:content> · DW: none. rss-parser gives attributes
// under `$`. We pick the widest image.
const asArray = v => (v == null ? [] : Array.isArray(v) ? v : [v]);

export function pickImage(item) {
  const candidates = [
    ...asArray(item.mediaContent),
    ...asArray(item.mediaThumbnail),
  ]
    .map(m => m?.$ ?? {})
    .filter(a => a.url && (!a.medium || a.medium === 'image') && (!a.type || a.type.startsWith('image/')));

  if (item.enclosure?.url && (!item.enclosure.type || item.enclosure.type.startsWith('image/'))) {
    candidates.push({ url: item.enclosure.url });
  }
  if (!candidates.length) return null;

  const best = candidates.sort((a, b) => (Number(b.width) || 0) - (Number(a.width) || 0))[0];
  const url = cleanUrl(best.url);
  if (!url) return null;
  // BBC's image server serves the same picture at other widths; the feed only
  // links 240px, which is blurry in large cards. (Verified: 800 → 200 OK.)
  return url.replace(/(ichef\.bbci\.co\.uk\/ace\/standard\/)\d+\//, '$1800/');
}

// ── Tags ────────────────────────────────────────────────────────────────
// Guardian categories are objects ({ _: "Kenya" }), Dawn's are strings.
// Feed "categories" that just repeat a section name (Dawn adds "Business",
// "Sport", "Tech"; Guardian adds "World news") carry no information.
export const GENERIC_TAGS = /^(news|world news|world|uk news|us news|australia news|latest|top stories|sports?|business|tech|technology|politics|health|science|culture|entertainment)$/i;
export const PAKISTAN = /\b(pakistan\w*|islamabad|karachi|lahore|peshawar|quetta|rawalpindi|balochistan|khyber pakhtunkhwa)\b/i;

export function extractTags(item, feed, text) {
  const raw = [
    ...(feed.tags ?? []),
    ...asArray(item.categories).map(c => (typeof c === 'string' ? c : c?._)),
    ...(PAKISTAN.test(text) ? ['Pakistan'] : []), // powers "Pakistan Focus" for BBC/Guardian stories too
  ];
  const seen = new Set();
  const tags = [];
  for (const t of raw) {
    const tag = stripHtml(t ?? '');
    const key = tag.toLowerCase();
    if (!tag || tag.length > 40 || GENERIC_TAGS.test(tag) || seen.has(key)) continue;
    seen.add(key);
    tags.push(tag);
  }
  return tags.slice(0, 6);
}

// ── The whole item ──────────────────────────────────────────────────────
export function normalizeItem(item, feed, now = Date.now()) {
  const title = stripHtml(item.title);
  const url = cleanUrl(item.link || item.guid);
  if (!title || !url) return null;

  // isoDate is filled by rss-parser from pubDate (RSS 2.0) or dc:date (DW's RSS 1.0)
  let published = Date.parse(item.isoDate || item.pubDate || item.dcDate || '');
  if (!Number.isFinite(published)) return null;
  if (now - published > MAX_AGE_DAYS * 86_400_000) return null;
  if (published > now) published = now; // bad timezone in a feed → don't show "in the future"

  const excerpt = toExcerpt(stripHtml(item.contentSnippet || item.content || item.summary || ''));
  const imageUrl = pickImage(item);

  return {
    id: articleId(url),
    url,
    origin: 'rss',
    title,
    excerpt,
    imageUrl,
    category: feed.category,
    source: feed.source,
    sourceName: getSource(feed.source)?.name ?? feed.source,
    publishedAt: new Date(published),
    tags: extractTags(item, feed, `${title} ${excerpt}`),
    isFeatured: Boolean(imageUrl), // stories with a picture can lead the home page
    isBreaking: false,
    views: 0,
    shares: 0,
    urdu: { status: 'pending', attempts: 0 }, // picked up by the translator (Milestone 2)
  };
}
