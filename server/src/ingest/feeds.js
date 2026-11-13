// RSS feeds the ingester reads (English edition).
//
// source    → id in src/data/sources.js
// category  → fixed category for every story, or 'auto' = decide per story
//             from the feed's own <category> labels (see normalize.js),
//             falling back to `fallback` when no label matches
// tags      → added to every story (only feeds that are *about* Pakistan get
//             'Pakistan'; others are tagged when the text mentions Pakistan)
// language  → 'en' for this edition (an Urdu edition will add Urdu feeds)
//
// ORDER MATTERS: when a story appears in several feeds, the FIRST feed wins
// (existing articles are never overwritten), so specific feeds come first.
//
// Every URL below was tested on 2026-11-08 (works, and the newest story was
// recent). Rejected: The News (feed ~1 year stale), CNN (stale since ~2023),
// WHO (stale); Al Jazeera, Times of India, The Hindu, CBC, Samaa, Al Arabiya,
// Gulf News, Pakistan Today, The Nation (blocked from our network, 404 or
// broken XML); Reuters / AP / Bloomberg (no public feeds).

const PK = ['Pakistan'];

const PAKISTAN_FEEDS = [
  // Section feeds first, so their category wins over the "latest" feeds below
  { source: 'dawn',     category: 'pakistan',   tags: PK, url: 'https://www.dawn.com/feeds/pakistan' },
  { source: 'guardian', category: 'pakistan',   tags: PK, url: 'https://www.theguardian.com/world/pakistan/rss' },
  { source: 'tribune',  category: 'pakistan',   tags: PK, url: 'https://tribune.com.pk/feed/pakistan' },
  { source: 'tribune',  category: 'business',             url: 'https://tribune.com.pk/feed/business' },
  { source: 'tribune',  category: 'sports',               url: 'https://tribune.com.pk/feed/sports' },
  { source: 'tribune',  category: 'technology',           url: 'https://tribune.com.pk/feed/technology' },
  { source: 'tribune',  category: 'world',                url: 'https://tribune.com.pk/feed/world' },
  { source: 'dawn',     category: 'business',             url: 'https://www.dawn.com/feeds/business' },
  { source: 'dawn',     category: 'sports',               url: 'https://www.dawn.com/feeds/sport' },
  { source: 'dawn',     category: 'technology',           url: 'https://www.dawn.com/feeds/tech' },
  { source: 'dawn',     category: 'world',                url: 'https://www.dawn.com/feeds/world' },
  // "Latest" feeds that mix all sections → categorised per story
  { source: 'tribune',    category: 'auto', fallback: 'pakistan', url: 'https://tribune.com.pk/feed/home' },
  { source: 'ary',        category: 'auto', fallback: 'pakistan', url: 'https://arynews.tv/feed/' },
  { source: 'brecorder',  category: 'auto', fallback: 'business', url: 'https://www.brecorder.com/feeds/latest-news' },
  { source: 'app',        category: 'auto', fallback: 'pakistan', url: 'https://www.app.com.pk/feed/' },
  { source: 'dailytimes', category: 'auto', fallback: 'pakistan', url: 'https://dailytimes.com.pk/feed/' },
  // Geo: section feeds (its "latest" feed /rss/1/0 has no labels and is mostly
  // celebrity news, so it's not used). /rss/1/7 "Amazing" is rarely updated.
  { source: 'geo', category: 'pakistan',      tags: PK, url: 'https://www.geo.tv/rss/1/1' },
  { source: 'geo', category: 'world',                   url: 'https://www.geo.tv/rss/1/2' },
  { source: 'geo', category: 'business',                url: 'https://www.geo.tv/rss/1/3' },
  { source: 'geo', category: 'sports',                  url: 'https://www.geo.tv/rss/1/4' },
  { source: 'geo', category: 'entertainment',           url: 'https://www.geo.tv/rss/1/5' },
  { source: 'geo', category: 'health',                  url: 'https://www.geo.tv/rss/1/6' },
];

const INTERNATIONAL_FEEDS = [
  // ── BBC ──
  { source: 'bbc', category: 'world',         url: 'https://feeds.bbci.co.uk/news/world/asia/rss.xml' },
  { source: 'bbc', category: 'world',         url: 'https://feeds.bbci.co.uk/news/world/rss.xml' },
  { source: 'bbc', category: 'business',      url: 'https://feeds.bbci.co.uk/news/business/rss.xml' },
  { source: 'bbc', category: 'technology',    url: 'https://feeds.bbci.co.uk/news/technology/rss.xml' },
  { source: 'bbc', category: 'health',        url: 'https://feeds.bbci.co.uk/news/health/rss.xml' },
  { source: 'bbc', category: 'science',       url: 'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml' },
  { source: 'bbc', category: 'entertainment', url: 'https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml' },
  { source: 'bbc', category: 'sports',        url: 'https://feeds.bbci.co.uk/sport/rss.xml' },
  // ── The Guardian ──
  { source: 'guardian', category: 'world',         url: 'https://www.theguardian.com/world/rss' },
  { source: 'guardian', category: 'business',      url: 'https://www.theguardian.com/business/rss' },
  { source: 'guardian', category: 'technology',    url: 'https://www.theguardian.com/technology/rss' },
  { source: 'guardian', category: 'health',        url: 'https://www.theguardian.com/society/health/rss' },
  { source: 'guardian', category: 'science',       url: 'https://www.theguardian.com/science/rss' },
  { source: 'guardian', category: 'entertainment', url: 'https://www.theguardian.com/culture/rss' },
  { source: 'guardian', category: 'sports',        url: 'https://www.theguardian.com/sport/rss' },
  // ── US ──
  { source: 'nyt',  category: 'world',      url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml' },
  { source: 'nyt',  category: 'business',   url: 'https://rss.nytimes.com/services/xml/rss/nyt/Business.xml' },
  { source: 'nyt',  category: 'technology', url: 'https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml' },
  { source: 'wapo', category: 'world',      url: 'https://feeds.washingtonpost.com/rss/world' },
  { source: 'npr',  category: 'world',      url: 'https://feeds.npr.org/1004/rss.xml' },
  { source: 'cnbc', category: 'business',   url: 'https://www.cnbc.com/id/100727362/device/rss/rss.html' },
  { source: 'cnbc', category: 'business',   url: 'https://www.cnbc.com/id/10001147/device/rss/rss.html' },
  // ── Europe ──
  { source: 'independent', category: 'world', url: 'https://www.independent.co.uk/news/world/rss' },
  { source: 'sky',         category: 'world', url: 'https://feeds.skynews.com/feeds/rss/world.xml' },
  { source: 'france24',    category: 'world', url: 'https://www.france24.com/en/rss' },
  { source: 'euronews',    category: 'world', url: 'https://www.euronews.com/rss' },
  { source: 'dw',          category: 'world', url: 'https://rss.dw.com/rdf/rss-en-all' }, // often slow
  // ── Middle East ──
  { source: 'arabnews', category: 'auto', fallback: 'world', url: 'https://www.arabnews.com/rss.xml' },
  { source: 'khaleej',  category: 'world', url: 'https://www.khaleejtimes.com/api/v1/collections/world.rss' },
  { source: 'trt',      category: 'world', url: 'https://www.trtworld.com/feed/rss.xml' },
  { source: 'mee',      category: 'world', url: 'https://www.middleeasteye.net/rss' },
  // ── Asia-Pacific ──
  { source: 'scmp',           category: 'world', url: 'https://www.scmp.com/rss/91/feed' },
  { source: 'cna',            category: 'world', url: 'https://www.channelnewsasia.com/rssfeeds/8395884' },
  { source: 'hindustantimes', category: 'world', url: 'https://www.hindustantimes.com/feeds/rss/world-news/rssfeed.xml' },
  { source: 'abc',            category: 'world', url: 'https://www.abc.net.au/news/feed/51120/rss.xml' },
  // ── Topic specialists ──
  { source: 'cricinfo',     category: 'sports',        url: 'https://www.espncricinfo.com/rss/content/story/feeds/0.xml' },
  { source: 'techcrunch',   category: 'technology',    url: 'https://techcrunch.com/feed/' },
  { source: 'verge',        category: 'technology',    url: 'https://www.theverge.com/rss/index.xml' },
  { source: 'ars',          category: 'technology',    url: 'https://feeds.arstechnica.com/arstechnica/index' },
  { source: 'sciencedaily', category: 'science',       url: 'https://www.sciencedaily.com/rss/top/science.xml' },
  { source: 'variety',      category: 'entertainment', url: 'https://variety.com/feed/' },
];

export const FEEDS = [...PAKISTAN_FEEDS, ...INTERNATIONAL_FEEDS].map(feed => ({ language: 'en', ...feed }));
