// Fetch all feeds → normalize items → save new ones.
//
// Design rules:
//  1. One broken/slow feed never stops the others (each result is settled
//     separately; failures are reported, then retried on the next run).
//  2. Existing articles are never modified: we upsert with $setOnInsert keyed
//     on the cleaned URL, so a re-fetched story is a no-op and an Urdu
//     translation we already paid for is never overwritten.
//  3. Feeds are saved in FEEDS order, so when a story is in two feeds the
//     first (more specific) feed decides its category.

import http from 'node:http';
import https from 'node:https';
import zlib from 'node:zlib';
import Parser from 'rss-parser';
import { Article } from '../models/Article.js';
import { FEEDS } from './feeds.js';
import { normalizeItem } from './normalize.js';

const FETCH_CONCURRENCY = 6;            // be polite to the news sites
const FETCH_TIMEOUT_MS = 20_000;
const MAX_REDIRECTS = 5;
const MAX_FEED_BYTES = 5 * 1024 * 1024; // a real feed is < 500 KB
const USER_AGENT = 'PakNewsHub/1.0 (news aggregator; +https://github.com/DZLimited/PakNewsHub)';

const DECOMPRESS = { gzip: zlib.createGunzip, deflate: zlib.createInflate, br: zlib.createBrotliDecompress };

/**
 * Download a feed's XML, with a hard timeout that really closes the socket.
 *
 * Why not rss-parser's parseURL() or fetch()? DW's server sometimes accepts a
 * connection and then never answers. rss-parser's timeout only stops
 * *waiting* (the socket stayed open forever, so `npm run ingest` never
 * exited), and fetch()'s abort left sockets open for 5+ s. With node:http we
 * call req.destroy() on timeout, which closes the connection immediately.
 * `agent: false` = no keep-alive pool, so nothing lingers between runs.
 */
export function fetchFeedXml(url, redirectsLeft = MAX_REDIRECTS) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https:') ? https : http;
    const req = lib.get(url, {
      agent: false,
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/rss+xml, application/rdf+xml, application/xml, text/xml;q=0.9, */*;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
      },
    }, res => {
      const status = res.statusCode ?? 0;

      if (status >= 300 && status < 400 && res.headers.location) {
        res.resume(); // discard body
        if (redirectsLeft <= 0) return reject(new Error('too many redirects'));
        return resolve(fetchFeedXml(new URL(res.headers.location, url).toString(), redirectsLeft - 1));
      }
      if (status !== 200) {
        res.resume();
        return reject(new Error(`HTTP ${status}`));
      }

      const decompress = DECOMPRESS[(res.headers['content-encoding'] ?? '').toLowerCase()];
      const body = decompress ? res.pipe(decompress()) : res;
      const chunks = [];
      let size = 0;
      body.on('data', chunk => {
        size += chunk.length;
        if (size > MAX_FEED_BYTES) req.destroy(new Error('feed too large'));
        else chunks.push(chunk);
      });
      body.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      body.on('error', reject);
    });

    const timer = setTimeout(
      () => req.destroy(new Error(`timed out after ${FETCH_TIMEOUT_MS / 1000}s`)),
      FETCH_TIMEOUT_MS
    );
    req.on('error', reject);
    req.on('close', () => clearTimeout(timer));
  });
}

/** rss-parser is only used to *parse* XML we downloaded ourselves. */
export function createParser() {
  return new Parser({
    customFields: {
      item: [
        ['media:thumbnail', 'mediaThumbnail', { keepArray: true }],
        ['media:content', 'mediaContent', { keepArray: true }],
        ['dc:date', 'dcDate'],
      ],
    },
  });
}

/** Like Promise.allSettled, but runs at most `limit` tasks at a time. */
async function settledWithLimit(items, limit, task) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      try {
        results[i] = { status: 'fulfilled', value: await task(items[i]) };
      } catch (reason) {
        results[i] = { status: 'rejected', reason };
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

/** Insert docs that don't exist yet. Returns how many were new. */
async function insertNew(docs) {
  if (!docs.length) return 0;
  const ops = docs.map(doc => ({
    updateOne: { filter: { url: doc.url }, update: { $setOnInsert: doc }, upsert: true },
  }));
  try {
    const res = await Article.bulkWrite(ops, { ordered: false });
    return res.upsertedCount;
  } catch (err) {
    // A duplicate-key race (e.g. two runs overlapping) is harmless: the story
    // already exists. Anything else is a real error.
    const writeErrors = err.writeErrors ?? [];
    if (writeErrors.length && writeErrors.every(e => e.code === 11000)) {
      return err.result?.upsertedCount ?? err.result?.nUpserted ?? 0;
    }
    throw err;
  }
}

/**
 * Run one ingestion pass.
 * → { feedsOk, feedsFailed: [{url, error}], seen, skipped, inserted, ms }
 */
export async function ingestAll({
  feeds = FEEDS,
  fetchXml = fetchFeedXml, // injectable for tests
  parser = createParser(),
  now = Date.now(),
} = {}) {
  const started = Date.now();
  const fetched = await settledWithLimit(feeds, FETCH_CONCURRENCY, async feed =>
    parser.parseString(await fetchXml(feed.url))
  );

  const stats = { feedsOk: 0, feedsFailed: [], seen: 0, skipped: 0, inserted: 0, ms: 0 };

  for (const [i, result] of fetched.entries()) {
    const feed = feeds[i];
    if (result.status === 'rejected') {
      stats.feedsFailed.push({ url: feed.url, error: String(result.reason?.message ?? result.reason).slice(0, 120) });
      continue;
    }
    stats.feedsOk++;

    const byUrl = new Map(); // de-duplicate within this feed
    for (const item of result.value.items ?? []) {
      const doc = normalizeItem(item, feed, now);
      if (doc) byUrl.set(doc.url, doc);
      else stats.skipped++;
    }
    stats.seen += byUrl.size;
    stats.inserted += await insertNew([...byUrl.values()]);
  }

  stats.ms = Date.now() - started;
  return stats;
}

export function formatStats(s) {
  const lines = [
    `feeds ok ${s.feedsOk}/${s.feedsOk + s.feedsFailed.length} · items ${s.seen} · new ${s.inserted} · skipped ${s.skipped} · ${(s.ms / 1000).toFixed(1)}s`,
    ...s.feedsFailed.map(f => `  ✗ ${f.url} — ${f.error}`),
  ];
  return lines.join('\n');
}
