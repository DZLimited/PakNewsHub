// Photo finder: some feeds (Express, ARY Urdu, Euronews, CNBC, Daily Times…)
// send stories without a photo, but each story's own web page names its main
// photo in a <meta property="og:image"> tag — the picture social media shows
// when the link is shared. After each feed run, this opens the pages of new
// photo-less stories (only their <head>) and saves that photo.
//
// Rules:
//  • Polite: a few pages at a time, a limited number per run, and only the
//    <head> of each page is downloaded.
//  • Each story is checked until it's settled: 'found', 'none' (the page has
//    no real photo), or MAX_TRIES failed downloads. Settled stories are never
//    fetched again.
//  • A site that blocks us (403, timeouts) is skipped for the rest of the run
//    after HOST_FAILURE_LIMIT failures, and those stories use up a try, so
//    they can't fill every batch.
//  • Only recent stories (RECENT_DAYS) — old ones are rarely read.
//  • A photo shared by SHARED_PHOTO_LIMIT or more stories is a cover picture,
//    not the story's own (e.g. Middle East Eye live-blog updates all carry the
//    live blog's cover), so it's treated as "no photo". A wrong photo is
//    worse than none.

import { Article } from '../models/Article.js';
import { fetchText, settledWithLimit } from './ingest.js';
import { cleanUrl, decodeEntities, fixImageUrl } from './normalize.js';

const PER_RUN = 120;
const CONCURRENCY = 4;
const PAGE_TIMEOUT_MS = 12_000;
const MAX_PAGE_BYTES = 3 * 1024 * 1024; // CNBC's <head> alone is ~600 KB
const MAX_TRIES = 3;
const HOST_FAILURE_LIMIT = 2;
const RECENT_DAYS = 7;
const SHARED_PHOTO_LIMIT = 3;

// Tags that name the page's photo, best first.
const PHOTO_TAGS = ['og:image:secure_url', 'og:image', 'og:image:url', 'twitter:image', 'twitter:image:src'];

// The site's logo or a stock "no photo" picture, not the story's photo
// (NPR: facebook-default-wide….jpg, NYT: defaultPromoCrop.png). Only the file
// name is checked: Middle East Eye's real photos live under /sites/default/.
const GENERIC_PHOTO = /default|placeholder|fallback|no[-_]?image|blank|logo|favicon|sprite/i;
const fileName = url => {
  try {
    return decodeURIComponent(new URL(url).pathname.split('/').pop() ?? '');
  } catch {
    return url;
  }
};

/**
 * The story's photo from a page's HTML, or null.
 * Exported for tests.
 */
export function findPagePhoto(html, pageUrl) {
  const head = html.slice(0, html.search(/<\/head>/i) + 1 || undefined);
  const found = {};
  for (const [tag] of head.matchAll(/<meta\b[^>]*>/gi)) {
    const key = /\b(?:property|name)\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1]?.toLowerCase();
    const content = /\bcontent\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(tag);
    if (key && content && PHOTO_TAGS.includes(key)) found[key] ??= content[1] ?? content[2];
  }
  for (const key of PHOTO_TAGS) {
    const url = cleanUrl(decodeEntities(found[key] ?? '').trim(), pageUrl);
    if (url && !GENERIC_PHOTO.test(fileName(url))) return fixImageUrl(url);
  }
  return null;
}

const hostOf = url => {
  try {
    return new URL(url).host;
  } catch {
    return '';
  }
};

/**
 * One photo-finding pass. → { checked, found, none, failed, skipped, ms }
 * `fetchPage` is injectable for tests.
 */
export async function findPhotos({
  limit = PER_RUN,
  now = Date.now(),
  fetchPage = url => fetchText(url, {
    accept: 'text/html,application/xhtml+xml',
    maxBytes: MAX_PAGE_BYTES,
    stopAt: '</head>',
    timeoutMs: PAGE_TIMEOUT_MS,
  }),
} = {}) {
  const started = Date.now();
  const stories = await Article.find(
    {
      origin: 'rss',
      url: { $type: 'string' },
      imageUrl: { $in: [null, ''] },
      'photo.done': { $ne: true },
      publishedAt: { $gte: new Date(now - RECENT_DAYS * 86_400_000) },
    },
    { url: 1, photo: 1 }
  )
    .sort({ publishedAt: -1 })
    .limit(limit)
    .lean();

  const stats = { checked: stories.length, found: 0, none: 0, failed: 0, skipped: 0, ms: 0 };
  const hostFailures = new Map();

  // 1. Read each page's photo → outcome: { imageUrl } | { none } | { error }
  const outcomes = await settledWithLimit(stories, CONCURRENCY, async story => {
    const host = hostOf(story.url);
    if ((hostFailures.get(host) ?? 0) >= HOST_FAILURE_LIMIT) return { error: true, skipped: true };
    try {
      const imageUrl = findPagePhoto(await fetchPage(story.url), story.url);
      return imageUrl ? { imageUrl } : { none: true };
    } catch {
      hostFailures.set(host, (hostFailures.get(host) ?? 0) + 1);
      return { error: true };
    }
  });

  // 2. Photos used by several stories (in this run + already saved) are covers.
  const uses = new Map();
  for (const o of outcomes) if (o.value?.imageUrl) uses.set(o.value.imageUrl, (uses.get(o.value.imageUrl) ?? 0) + 1);
  if (uses.size) {
    const saved = await Article.aggregate([
      { $match: { imageUrl: { $in: [...uses.keys()] } } },
      { $group: { _id: '$imageUrl', n: { $sum: 1 } } },
    ]);
    for (const { _id, n } of saved) uses.set(_id, uses.get(_id) + n);
  }

  // 3. Save. Only fills an empty imageUrl — never replaces a photo set another way.
  await Promise.all(stories.map((story, i) => {
    const o = outcomes[i].value ?? { error: true };
    const tries = (story.photo?.tries ?? 0) + 1;
    const base = { 'photo.tries': tries, 'photo.checkedAt': new Date(now) };
    let update;
    if (o.imageUrl && uses.get(o.imageUrl) < SHARED_PHOTO_LIMIT) {
      stats.found++;
      // isFeatured: stories with a picture can lead the home page (as in normalize.js)
      update = { ...base, imageUrl: o.imageUrl, isFeatured: true, 'photo.result': 'found', 'photo.done': true };
    } else if (o.imageUrl || o.none) {
      stats.none++;
      update = { ...base, 'photo.result': 'none', 'photo.done': true };
    } else {
      stats[o.skipped ? 'skipped' : 'failed']++;
      update = { ...base, 'photo.result': 'error', 'photo.done': tries >= MAX_TRIES };
    }
    return Article.updateOne({ _id: story._id, imageUrl: { $in: [null, ''] } }, { $set: update });
  }));

  // 4. A cover photo saved by an earlier run (before it reached the limit) is
  //    taken back off those stories too — only photos this finder added.
  const covers = [...uses].filter(([, n]) => n >= SHARED_PHOTO_LIMIT).map(([url]) => url);
  if (covers.length) {
    await Article.updateMany(
      { imageUrl: { $in: covers }, 'photo.result': 'found' },
      { $unset: { imageUrl: 1 }, $set: { isFeatured: false, 'photo.result': 'none' } }
    );
  }

  stats.ms = Date.now() - started;
  return stats;
}

export function formatPhotoStats(s) {
  return `photos: checked ${s.checked} · found ${s.found} · no photo ${s.none} · failed ${s.failed}` +
    (s.skipped ? ` · skipped ${s.skipped} (site blocking us)` : '') +
    ` · ${(s.ms / 1000).toFixed(1)}s`;
}
