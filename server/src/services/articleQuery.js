// MongoDB implementation of the article query API.
// Mirrors src/utils/articleQuery.js (the frontend's in-memory version) —
// same params, same relevance weights, same sort order. Keep them in sync.

import { Article } from '../models/Article.js';

export const RANGES = {
  any: null,
  '1h': 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
};
export const SORTS = ['relevance', 'latest', 'views', 'shares'];
export const GROUP_FIELDS = ['source', 'category'];
export const MAX_LIMIT = 100;
export const EDITIONS = ['en', 'ur'];

const escapeRegex = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const isTrue = v => v === true || v === 'true' || v === '1';

/** Parse + validate raw query-string params into a clean object. */
export function parseParams(raw = {}) {
  const list = v => (v ? String(v).split(',').map(s => s.trim()).filter(Boolean) : []);
  const limit = Number.parseInt(raw.limit, 10);
  const offset = Number.parseInt(raw.offset, 10);
  return {
    terms: String(raw.q ?? '').trim().toLowerCase().split(/\s+/).filter(Boolean).slice(0, 10),
    edition: EDITIONS.includes(raw.edition) ? raw.edition : undefined, // none = both
    category: raw.category ? String(raw.category) : undefined,
    sources: list(raw.source),
    tag: raw.tag ? String(raw.tag) : undefined,
    featured: isTrue(raw.featured),
    breaking: isTrue(raw.breaking),
    exclude: raw.exclude ? String(raw.exclude) : undefined,
    range: raw.range in RANGES ? raw.range : 'any',
    sort: SORTS.includes(raw.sort) ? raw.sort : 'latest',
    limit: Number.isFinite(limit) && limit > 0 ? Math.min(limit, MAX_LIMIT) : MAX_LIMIT,
    offset: Number.isFinite(offset) && offset > 0 ? offset : 0,
  };
}

/**
 * Which stories belong to an edition:
 *  - English: every story that isn't written in Urdu
 *  - Urdu:    stories written in Urdu, plus any story that has an Urdu
 *             headline (the bundled demo stories; translated ones if the
 *             optional translator is ever switched on)
 */
const EDITION_MATCH = {
  en: { language: { $ne: 'ur' } },
  ur: { $or: [{ language: 'ur' }, { urduTitle: { $nin: [null, ''] } }] },
};

function buildMatch(p, now = Date.now()) {
  const match = {};
  const and = []; // conditions that need their own $or
  if (p.edition) and.push(EDITION_MATCH[p.edition]);
  if (p.category) match.category = p.category;
  if (p.sources.length) match.source = { $in: p.sources };
  if (p.tag) match.tags = p.tag;
  if (p.featured) match.isFeatured = true;
  if (p.breaking) match.isBreaking = true;
  if (p.exclude) match.id = { $ne: p.exclude };
  const window = RANGES[p.range];
  if (window) match.publishedAt = { $gte: new Date(now - window) };
  if (p.terms.length) {
    // any term in any searchable field (same as relevance > 0)
    and.push({
      $or: p.terms.flatMap(term => {
        const re = new RegExp(escapeRegex(term), 'i');
        return [{ title: re }, { urduTitle: re }, { tags: re }, { excerpt: re }];
      }),
    });
  }
  if (and.length) match.$and = and;
  return match;
}

/** Aggregation expression: title 3, urduTitle 3, any tag 2, excerpt 1 — per term. */
function relevanceExpr(terms) {
  const hit = (input, regex, weight) => ({
    $cond: [{ $regexMatch: { input: { $ifNull: [input, ''] }, regex, options: 'i' } }, weight, 0],
  });
  return {
    $add: terms.flatMap(term => {
      const regex = escapeRegex(term);
      return [
        hit('$title', regex, 3),
        hit('$urduTitle', regex, 3),
        {
          $cond: [
            {
              $gt: [{
                $size: {
                  $filter: {
                    input: { $ifNull: ['$tags', []] },
                    cond: { $regexMatch: { input: '$$this', regex, options: 'i' } },
                  },
                },
              }, 0],
            },
            2,
            0,
          ],
        },
        hit('$excerpt', regex, 1),
      ];
    }),
  };
}

function sortStage(p) {
  switch (p.sort) {
    case 'views':  return { views: -1, publishedAt: -1, id: 1 };
    case 'shares': return { shares: -1, publishedAt: -1, id: 1 };
    case 'relevance':
      return p.terms.length ? { score: -1, publishedAt: -1, id: 1 } : { publishedAt: -1, id: 1 };
    default:       return { publishedAt: -1, id: 1 };
  }
}

/** → { items, total } */
export async function queryArticles(rawParams) {
  const p = parseParams(rawParams);
  const pipeline = [{ $match: buildMatch(p) }];
  if (p.sort === 'relevance' && p.terms.length) {
    pipeline.push({ $addFields: { score: relevanceExpr(p.terms) } });
  }
  pipeline.push({
    $facet: {
      items: [
        { $sort: sortStage(p) },
        { $skip: p.offset },
        { $limit: p.limit },
        { $project: { _id: 0, score: 0, photo: 0 } }, // photo = photo-finder bookkeeping
      ],
      total: [{ $count: 'n' }],
    },
  });

  const [result] = await Article.aggregate(pipeline);
  return { items: result.items, total: result.total[0]?.n ?? 0 };
}

/** → { [groupValue]: count } */
export async function countArticles(groupBy, rawParams) {
  const p = parseParams(rawParams);
  const rows = await Article.aggregate([
    { $match: buildMatch(p) },
    { $group: { _id: `$${groupBy}`, n: { $sum: 1 } } },
  ]);
  return Object.fromEntries(rows.map(r => [r._id, r.n]));
}
