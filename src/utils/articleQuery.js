// Pure, in-memory implementation of the article query API.
// The Express server implements the same parameters with MongoDB
// (server/src/services/articleQuery.js) — keep the two in sync.
//
// params: { edition, q, category, source, tag, featured, breaking, exclude,
//           range, sort, limit, offset }

export const RANGES = {
  any: null,
  '1h': 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
};

export const SORTS = ['relevance', 'latest', 'views', 'shares'];

function relevance(article, terms) {
  let score = 0;
  const title = article.title.toLowerCase();
  const excerpt = (article.excerpt ?? '').toLowerCase();
  const tags = (article.tags ?? []).map(t => t.toLowerCase());
  for (const term of terms) {
    if (title.includes(term)) score += 3;
    if (article.urduTitle?.includes(term)) score += 3;
    if (tags.some(t => t.includes(term))) score += 2;
    if (excerpt.includes(term)) score += 1;
  }
  return score;
}

/** Same edition rule as the server (see EDITION_MATCH there). */
function inEdition(article, edition) {
  if (edition === 'en') return article.language !== 'ur';
  if (edition === 'ur') return article.language === 'ur' || Boolean(article.urduTitle);
  return true; // no edition = both
}

function matches(article, p, terms, now) {
  if (!inEdition(article, p.edition)) return false;
  if (p.category && article.category !== p.category) return false;
  if (p.source) {
    const list = Array.isArray(p.source) ? p.source : String(p.source).split(',');
    if (list.length && !list.includes(article.source)) return false;
  }
  if (p.tag && !article.tags?.includes(p.tag)) return false;
  if (p.featured && !article.isFeatured) return false;
  if (p.breaking && !article.isBreaking) return false;
  if (p.exclude && article.id === p.exclude) return false;
  const window = RANGES[p.range];
  if (window && now - Date.parse(article.publishedAt) > window) return false;
  if (terms.length && relevance(article, terms) === 0) return false;
  return true;
}

const parseTerms = q =>
  (q ?? '').trim().toLowerCase().split(/\s+/).filter(Boolean);

export function filterArticles(list, params = {}, now = Date.now()) {
  const terms = parseTerms(params.q);
  return list.filter(a => matches(a, params, terms, now));
}

export function queryArticles(list, params = {}, now = Date.now()) {
  const terms = parseTerms(params.q);
  const filtered = filterArticles(list, params, now);

  const byDate = (a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt);
  const sort = params.sort ?? 'latest';
  const sorters = {
    latest: byDate,
    views: (a, b) => b.views - a.views || byDate(a, b),
    shares: (a, b) => b.shares - a.shares || byDate(a, b),
    relevance: terms.length
      ? (a, b) => relevance(b, terms) - relevance(a, terms) || byDate(a, b)
      : byDate,
  };
  const sorted = [...filtered].sort(sorters[sort] ?? byDate);

  const offset = Number(params.offset) || 0;
  const limit = params.limit ? Number(params.limit) : undefined;
  return {
    items: sorted.slice(offset, limit ? offset + limit : undefined),
    total: sorted.length,
  };
}

/** Count matching articles grouped by `field` ('source' | 'category'). */
export function countArticles(list, field, params = {}, now = Date.now()) {
  const counts = {};
  for (const a of filterArticles(list, params, now)) {
    counts[a[field]] = (counts[a[field]] ?? 0) + 1;
  }
  return counts;
}
