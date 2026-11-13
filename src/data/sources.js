// News sources (static config). Used synchronously by the navbar, footer and
// badges, and seeded into MongoDB by the server so both sides share one list.
// Story counts are NOT stored here — the site shows real counts from the API.
//
// Every source here has working RSS feeds (server/src/ingest/feeds.js),
// checked 2026-11-08. `region` groups them in the UI: 'pk' or 'intl'.

const s = (id, name, short, country, url, region, color, textColor) =>
  ({ id, name, short, country, url, region, color, textColor });

export const sources = [
  // ── Pakistan ────────────────────────────────────────────────────────────
  s('dawn',          'Dawn',                     'DN',  '🇵🇰', 'https://www.dawn.com',            'pk',   '#E8F4F8', '#0A4B6E'),
  s('geo',           'Geo News',                 'GEO', '🇵🇰', 'https://www.geo.tv',              'pk',   '#FDEDEE', '#8A1C24'),
  s('tribune',       'The Express Tribune',      'ET',  '🇵🇰', 'https://tribune.com.pk',          'pk',   '#EEF2FB', '#1E3A7B'),
  s('ary',           'ARY News',                 'ARY', '🇵🇰', 'https://arynews.tv',              'pk',   '#FFF1E6', '#8A3B00'),
  s('brecorder',     'Business Recorder',        'BR',  '🇵🇰', 'https://www.brecorder.com',       'pk',   '#EAF6EF', '#165B33'),
  s('app',           'APP',                      'APP', '🇵🇰', 'https://www.app.com.pk',          'pk',   '#E3F4E8', '#14532D'),
  s('dailytimes',    'Daily Times',              'DT',  '🇵🇰', 'https://dailytimes.com.pk',       'pk',   '#F2F2F4', '#3A3A44'),

  // ── International ───────────────────────────────────────────────────────
  s('bbc',           'BBC World',                'BBC', '🇬🇧', 'https://www.bbc.com/news',        'intl', '#E6F1FB', '#0C447C'),
  s('guardian',      'The Guardian',             'GD',  '🇬🇧', 'https://www.theguardian.com',     'intl', '#E1F5EE', '#085041'),
  s('nyt',           'The New York Times',       'NYT', '🇺🇸', 'https://www.nytimes.com',         'intl', '#F2F2F2', '#1A1A1A'),
  s('wapo',          'The Washington Post',      'WP',  '🇺🇸', 'https://www.washingtonpost.com',  'intl', '#EFEFF3', '#2A2A3A'),
  s('independent',   'The Independent',          'IND', '🇬🇧', 'https://www.independent.co.uk',   'intl', '#FCEBEB', '#7A1414'),
  s('sky',           'Sky News',                 'SKY', '🇬🇧', 'https://news.sky.com',            'intl', '#E8F0FD', '#123C8C'),
  s('france24',      'France 24',                'F24', '🇫🇷', 'https://www.france24.com/en',     'intl', '#EAF2FC', '#0B3F7A'),
  s('euronews',      'Euronews',                 'EN',  '🇪🇺', 'https://www.euronews.com',        'intl', '#EDF1FA', '#1D3266'),
  s('dw',            'DW News',                  'DW',  '🇩🇪', 'https://www.dw.com',              'intl', '#FFF3E0', '#7B4500'),
  s('npr',           'NPR',                      'NPR', '🇺🇸', 'https://www.npr.org',             'intl', '#FDEDEA', '#7E2410'),
  s('cnbc',          'CNBC',                     'CNB', '🇺🇸', 'https://www.cnbc.com',            'intl', '#EAF1FB', '#0F3A73'),
  s('arabnews',      'Arab News',                'AN',  '🇸🇦', 'https://www.arabnews.com',        'intl', '#E7F5EC', '#0F5132'),
  s('khaleej',       'Khaleej Times',            'KT',  '🇦🇪', 'https://www.khaleejtimes.com',    'intl', '#FBEFE7', '#7A3510'),
  s('trt',           'TRT World',                'TRT', '🇹🇷', 'https://www.trtworld.com',        'intl', '#FDECEC', '#8A1111'),
  s('mee',           'Middle East Eye',          'MEE', '🇬🇧', 'https://www.middleeasteye.net',   'intl', '#F3EFE6', '#5A4510'),
  s('scmp',          'South China Morning Post', 'SCM', '🇭🇰', 'https://www.scmp.com',            'intl', '#EAF3FB', '#11466E'),
  s('cna',           'CNA',                      'CNA', '🇸🇬', 'https://www.channelnewsasia.com', 'intl', '#FDEEEE', '#8B1A1A'),
  s('hindustantimes','Hindustan Times',          'HT',  '🇮🇳', 'https://www.hindustantimes.com',  'intl', '#EEF3FC', '#163A80'),
  s('abc',           'ABC News Australia',       'ABC', '🇦🇺', 'https://www.abc.net.au/news',     'intl', '#ECEFF3', '#253244'),
  // ── Topic specialists ──
  s('cricinfo',      'ESPNcricinfo',             'CI',  '🏏', 'https://www.espncricinfo.com',     'intl', '#E9F5FB', '#0A4D6E'),
  s('techcrunch',    'TechCrunch',               'TC',  '🇺🇸', 'https://techcrunch.com',          'intl', '#E9F7EC', '#0B6B2A'),
  s('verge',         'The Verge',                'VRG', '🇺🇸', 'https://www.theverge.com',        'intl', '#F1ECFB', '#4A1D7C'),
  s('ars',           'Ars Technica',             'ARS', '🇺🇸', 'https://arstechnica.com',         'intl', '#FDEFE6', '#8A3A0A'),
  s('sciencedaily',  'ScienceDaily',             'SD',  '🇺🇸', 'https://www.sciencedaily.com',    'intl', '#EDE8FC', '#3B1D8A'),
  s('variety',       'Variety',                  'VAR', '🇺🇸', 'https://variety.com',             'intl', '#FFF3E0', '#7B4500'),
];

export const getSource = id => sources.find(src => src.id === id);
