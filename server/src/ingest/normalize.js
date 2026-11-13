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

// `base` resolves relative links: TRT World's feed links are "/article/…".
export function cleanUrl(raw, base) {
  if (!raw) return null;
  try {
    const u = new URL(String(raw).trim(), base);
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

export function stripHtml(s, depth = 0) {
  const text = decodeEntities(
    String(s ?? '')
      // The Verge (and others) start the body with a <figure> whose caption
      // would otherwise become the first words of our summary.
      .replace(/<(figure|figcaption|script|style)\b[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<[^>]*>/g, ' ')
  ).replace(/\s+/g, ' ').trim();
  // Khaleej Times encodes its HTML twice ("&lt;p&gt;"), so tags only appear
  // after decoding — strip once more.
  return depth === 0 && /<\/?[a-z][^>]*>/i.test(text) ? stripHtml(text, 1) : text;
}

// Boilerplate that feeds append to their summaries.
const SUMMARY_JUNK = [
  /\s*The post .{0,300}? appeared first on .{0,120}$/i, // WordPress (ARY, APP, Daily Times…)
  /\s*Continue reading\.{0,3}$/i,                       // The Guardian
  /\s*\[(…|\.\.\.|&hellip;)\]$/,                       // "[…]"
  /\s*(Read more|Read More|\(more…\))\.{0,3}$/,
];

export function cleanSummary(text, title = '') {
  let out = text;
  for (const re of SUMMARY_JUNK) out = out.replace(re, '');
  out = out.trim();
  return out.toLowerCase() === title.toLowerCase() ? '' : out; // some feeds repeat the title
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

export function pickImage(item, base) {
  const candidates = [
    ...asArray(item.mediaContent),
    ...asArray(item.mediaThumbnail),
  ]
    .map(m => m?.$ ?? {})
    .filter(a => a.url && (!a.medium || a.medium === 'image') && (!a.type || a.type.startsWith('image/')));

  if (item.enclosure?.url && (!item.enclosure.type || item.enclosure.type.startsWith('image/'))) {
    candidates.push({ url: item.enclosure.url });
  }
  const best = candidates.sort((a, b) => (Number(b.width) || 0) - (Number(a.width) || 0))[0];
  // Geo, APP, Middle East Eye and The Verge only have the image inside the
  // summary/body HTML.
  const url = cleanUrl(best?.url ?? htmlImage(item, base), base);
  if (!url) return null;
  return fixImageUrl(url);
}

/** Publisher-specific image URL corrections (each verified against the live site). */
export function fixImageUrl(url) {
  return url
    // BBC serves the same picture at other widths; the feed only links 240px,
    // which is blurry in large cards. (800 → 200 OK.)
    .replace(/(ichef\.bbci\.co\.uk\/ace\/standard\/)\d+\//, '$1800/')
    // Geo's feed drops "/updates/" from image paths; the URLs it gives
    // redirect to the homepage. The article pages' og:image has the real path.
    .replace(/^(https:\/\/www\.geo\.tv\/assets\/uploads\/)(\d{4}-\d{2}-\d{2}\/)/, '$1updates/$2')
    // ESPNcricinfo links images over plain http://, which browsers block on an
    // https site. Its image server supports https (verified).
    .replace(/^http:\/\/p\.imgci\.com\//, 'https://p.imgci.com/');
}

/** First real <img> in the item's HTML (skips tracking pixels and icons). */
function htmlImage(item, base) {
  const html = [item['content:encoded'], item.content, item.description, item.summary].filter(Boolean).join(' ');
  for (const [tag] of html.matchAll(/<img\b[^>]*>/gi)) {
    const src = /\bsrc=["']([^"']+)["']/i.exec(tag)?.[1];
    if (!src || src.startsWith('data:')) continue;
    const width = Number(/\bwidth=["']?(\d+)/i.exec(tag)?.[1]);
    if (width && width < 100) continue;
    if (/pixel|feedburner|doubleclick|\/stats?\?|\.gif(\?|$)/i.test(src)) continue;
    try {
      return new URL(decodeEntities(src), base).toString(); // resolve relative paths
    } catch {
      continue;
    }
  }
  return null;
}

// ── Labels: category, skipping, tags ───────────────────────────────────
// A feed item's own <category> labels (Guardian: { _: "Kenya" }; others: strings).
export const itemLabels = item =>
  asArray(item.categories).map(c => stripHtml(typeof c === 'string' ? c : c?._)).filter(Boolean);

// Not news: opinion pieces, sponsored content, photo/video-only posts.
const SKIP_LABELS = /^(opinions?|editorials?|op-?eds?|columns?|columnists?|blogs?|letters?|sponsored|corporate and sponsored content|advertorials?|partner content|photos?|national photos|photo feature|photo gallery|general coverage photos|videos?|podcasts?|in pictures)$/i;
// Also readers' letters pages ("… | Letters", The Guardian).
const SKIP_TITLES = /(^(watch|video|listen|in pictures)\s*:)|(\s[–-]\s(video|in pictures|podcast|photo essay)$)|(\|\s*letters?$)/i;

// For category: 'auto' feeds. Checked in this order, so a story labelled
// "Pakistan" + "Sports" lands in Sports; Pakistan/World are the catch-alls.
const CATEGORY_RULES = [
  ['sports',        /^(sports?|cricket|football|soccer|tennis|hockey|olympics|f1|formula 1|athletics)$/i],
  ['business',      /^(business|markets?|economy|finance|money|stocks?|companies|banking|energy)$/i],
  ['technology',    /^(tech|technology|science and technology|sci-tech|ai|gadgets|hardware|internet)$/i],
  ['health',        /^(health|healthcare|medicine)$/i],
  ['science',       /^(science|space|environment|climate|climate change)$/i],
  ['entertainment', /^(entertainment|showbiz|culture|life & style|lifestyle|arts?|movies|film|music|tv|television)$/i],
  ['world',         /^(world|international|middle east|mena|asia|americas|europe|africa|gulf|saudi arabia|uae)$/i],
  ['pakistan',      /^(pakistan|national|domestic)$/i],
];

export function resolveCategory(feed, labels) {
  if (feed.category !== 'auto') return feed.category;
  for (const [category, re] of CATEGORY_RULES) {
    if (labels.some(label => re.test(label))) return category;
  }
  return feed.fallback ?? 'world';
}

// ── Tags ────────────────────────────────────────────────────────────────
// Guardian categories are objects ({ _: "Kenya" }), Dawn's are strings.
// Feed "categories" that just repeat a section name (Dawn adds "Business",
// "Sport", "Tech"; Guardian adds "World news") carry no information.
export const GENERIC_TAGS = /^(news|world news|world|uk news|us news|australia news|latest|lifestyle-latest|top stories|top news|top\d*|must read|editor's choice|in brief|international|national|domestic|sports?|business|tech|technology|science and technology|politics|health|science|culture|entertainment|life & style|lifestyle|t-magazine)$/i;
// Words that clearly mark a story as Pakistani. Deliberately NOT included
// because they're ambiguous: "PTI" (also Press Trust of India, credited in
// Indian stories), "Punjab"/"Hyderabad" (also in India), "PCB" (circuit board).
const PAKISTAN_TERMS = [
  'pakistan\\w*', 'islamabad', 'karachi', 'lahore', 'peshawar', 'quetta', 'rawalpindi', 'faisalabad',
  'multan', 'sialkot', 'gujranwala', 'jhelum', 'bahawalpur', 'abbottabad', 'gwadar', 'murree',
  'balochistan', 'sindh', 'khyber pakhtunkhwa', 'k-p', 'kp', 'waziristan', 'gilgit', 'azad kashmir', 'ajk',
  'ispr', 'pml-n', 'imran khan', 'shehbaz', 'nawaz sharif', 'maryam nawaz', 'bilawal', 'zardari',
  'asim munir', 'state bank of pakistan', 'psx', 'nadra', 'wapda', 'nepra',
];
export const PAKISTAN = new RegExp(`\\b(${PAKISTAN_TERMS.join('|')})\\b`, 'i');

export function extractTags(labels, feed, text, category) {
  const raw = [
    ...(feed.tags ?? []),
    ...labels,
    // powers "Pakistan Focus": the Pakistan category, or any story that mentions Pakistan
    ...(category === 'pakistan' || PAKISTAN.test(text) ? ['Pakistan'] : []),
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
  const url = cleanUrl(item.link || item.guid, feed.url);
  if (!title || !url) return null;

  const labels = itemLabels(item);
  if (labels.some(label => SKIP_LABELS.test(label)) || SKIP_TITLES.test(title)) return null;

  // isoDate is filled by rss-parser from pubDate (RSS 2.0) or dc:date (DW's RSS 1.0)
  let published = Date.parse(item.isoDate || item.pubDate || item.dcDate || '');
  if (!Number.isFinite(published)) return null;
  if (now - published > MAX_AGE_DAYS * 86_400_000) return null;
  if (published > now) published = now; // bad timezone in a feed → don't show "in the future"

  // Raw HTML (not rss-parser's contentSnippet) so stripHtml can drop <figure>
  // captions; Atom feeds put the short version in `summary`.
  const excerpt = toExcerpt(cleanSummary(stripHtml(item.summary || item.content || item.contentSnippet || ''), title));
  const imageUrl = pickImage(item, url);
  const category = resolveCategory(feed, labels);

  return {
    id: articleId(url),
    url,
    origin: 'rss',
    language: feed.language ?? 'en',
    title,
    excerpt,
    imageUrl,
    category,
    source: feed.source,
    sourceName: getSource(feed.source)?.name ?? feed.source,
    publishedAt: new Date(published),
    tags: extractTags(labels, feed, `${title} ${excerpt}`, category),
    isFeatured: Boolean(imageUrl), // stories with a picture can lead the home page
    isBreaking: false,
    views: 0,
    shares: 0,
    urdu: { status: 'pending', attempts: 0 }, // picked up by the translator (Milestone 2)
  };
}
