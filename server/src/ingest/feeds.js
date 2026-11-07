// RSS feeds the ingester reads.
//
// Each feed fixes the `source` and `category` of its stories. When the same
// story appears in several feeds (e.g. Guardian "world" and "world/pakistan"),
// the FIRST feed in this list wins, because existing articles are never
// overwritten — so specific feeds are listed before general ones.
//
// `tags` are added to every story from that feed (used by "Pakistan Focus").
// Only feeds that are *about* Pakistan get the tag; for everything else
// (including Dawn's World/Sport/Business/Tech) normalize.js tags a story as
// Pakistan only if its title/summary mentions Pakistan.
//
// All URLs were checked on 2026-11-06. Not included:
//  - Al Jazeera: TLS handshake fails from our network (curl error 35)
//  - Reuters / AP / Bloomberg: no public RSS feeds
//  - DW per-topic feeds: unconfirmed URLs; DW's main feed is also often slow,
//    which the ingester tolerates (timeout → skipped, retried next run)

const PK = ['Pakistan'];

export const FEEDS = [
  // ── Pakistan first (most specific) ─────────────────────────
  { source: 'dawn',     category: 'politics',      tags: PK, url: 'https://www.dawn.com/feeds/pakistan' },
  { source: 'guardian', category: 'politics',      tags: PK, url: 'https://www.theguardian.com/world/pakistan/rss' },
  { source: 'dawn',     category: 'business',                url: 'https://www.dawn.com/feeds/business' },
  { source: 'dawn',     category: 'sports',                  url: 'https://www.dawn.com/feeds/sport' },
  { source: 'dawn',     category: 'technology',              url: 'https://www.dawn.com/feeds/tech' },
  { source: 'dawn',     category: 'world',                   url: 'https://www.dawn.com/feeds/world' },

  // ── BBC ───────────────────────────────────────────────────
  { source: 'bbc', category: 'world',         url: 'https://feeds.bbci.co.uk/news/world/asia/rss.xml' },
  { source: 'bbc', category: 'world',         url: 'https://feeds.bbci.co.uk/news/world/rss.xml' },
  { source: 'bbc', category: 'business',      url: 'https://feeds.bbci.co.uk/news/business/rss.xml' },
  { source: 'bbc', category: 'technology',    url: 'https://feeds.bbci.co.uk/news/technology/rss.xml' },
  { source: 'bbc', category: 'health',        url: 'https://feeds.bbci.co.uk/news/health/rss.xml' },
  { source: 'bbc', category: 'science',       url: 'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml' },
  { source: 'bbc', category: 'entertainment', url: 'https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml' },
  { source: 'bbc', category: 'sports',        url: 'https://feeds.bbci.co.uk/sport/rss.xml' },

  // ── The Guardian ──────────────────────────────────────────
  { source: 'guardian', category: 'world',         url: 'https://www.theguardian.com/world/rss' },
  { source: 'guardian', category: 'business',      url: 'https://www.theguardian.com/business/rss' },
  { source: 'guardian', category: 'technology',    url: 'https://www.theguardian.com/technology/rss' },
  { source: 'guardian', category: 'health',        url: 'https://www.theguardian.com/society/health/rss' },
  { source: 'guardian', category: 'science',       url: 'https://www.theguardian.com/science/rss' },
  { source: 'guardian', category: 'entertainment', url: 'https://www.theguardian.com/culture/rss' },
  { source: 'guardian', category: 'sports',        url: 'https://www.theguardian.com/sport/rss' },

  // ── DW (no images in feed; often slow) ────────────────────
  { source: 'dw', category: 'world', url: 'https://rss.dw.com/rdf/rss-en-all' },
];
