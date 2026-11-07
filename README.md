# PakNewsHub

International news for Pakistani readers, in **English and Urdu**. Real
stories are fetched from the RSS feeds of BBC, The Guardian, Dawn and DW every
15 minutes, and Claude translates each headline and summary into Urdu.

**Stack:** React 19 · Vite · Tailwind CSS 4 · React Router 7 · TanStack Query ·
Zustand. The backend is Express 5 · MongoDB (Mongoose).

## Features

- Home, category, source, article, search and saved-stories pages
- **Urdu mode**: switches the whole UI to Urdu with right-to-left layout (saved per browser)
- **Dark mode**: follows the OS by default, saved per browser
- Search with relevance ranking, category, source and date filters, and sorting
- Bookmarks saved in the browser
- Share (native share sheet or copy link) and WhatsApp share
- Newsletter signup (needs the API server)
- **Real news** from RSS feeds, refreshed every 15 minutes, with photos
- **Automatic Urdu translation** of headlines and summaries (Claude, opt-in)
- Responsive layout, loading skeletons, error states with retry, 404 pages

## Quick start (frontend only)

The frontend runs on its own using the bundled demo articles. You don't need a database for this.

```bash
npm install
npm run dev          # http://localhost:5173
```

## Full stack (with the Express + MongoDB API)

You need MongoDB, either installed locally or a free
[MongoDB Atlas](https://www.mongodb.com/atlas) cluster.

```bash
# 1. API server
cd server
npm install
cp .env.example .env         # set MONGODB_URI if not using local MongoDB
npm run seed                 # loads the demo articles into MongoDB
npm run dev                  # http://localhost:5000/api

# 2. Frontend (in another terminal, project root)
cp .env.example .env.local   # contains VITE_API_URL=/api
npm run dev
```

The Vite dev server proxies `/api` to `localhost:5000`, so you don't need any
CORS setup in development.

> Set `VITE_API_URL` in `.env.local` rather than on the command line. In
> Git Bash on Windows, `VITE_API_URL=/api npm run dev` gets rewritten to a
> Windows path (`C:/Program Files/Git/api`).

## Real news and Urdu translation

The **worker** is a separate process that keeps the database filled:

```bash
cd server
npm run seed:real-only       # sources & categories only (removes the demo stories)
npm run ingest               # fetch all feeds once (≈25 s), then exit
npm run worker               # keep running: feeds every 15 min, translation every minute
```

How ingestion works (`server/src/ingest/`):

1. **Fetch** every feed in `feeds.js`, 6 at a time, 20 s timeout each. A feed
   that fails is reported and retried on the next run; it never stops the others.
2. **Clean** each item (`normalize.js`): strip tracking parameters from links,
   strip HTML, cut the summary to about 280 characters, pick the largest image,
   and tag stories that mention Pakistan (this powers "Pakistan Focus").
3. **Save** only new stories, keyed by URL (`$setOnInsert`). Re-fetching is free,
   and existing articles, including their translations, are never overwritten.
4. MongoDB **deletes** real articles automatically after 60 days.

> We store only the headline, a short summary, the image link and the source
> link, never the full article. The article page links to the original
> ("Read on BBC World").

### Urdu translation (opt-in, paid)

Every translation is a Claude API call, so translation is **off** until you turn it on:

```bash
# server/.env
ANTHROPIC_API_KEY=sk-ant-...
URDU_MODEL=claude-opus-5-5     # or claude-haiku-5-5: much cheaper
```

```bash
npm run translate -- --limit 5   # try 5 stories and check the quality and tokens used
# then in server/.env:  URDU_TRANSLATION=on   and restart the worker
```

Translation works as a queue (`server/src/translate/`). The newest stories are
translated first, and a story is "claimed" so two workers never translate it
twice. A bad answer is retried up to 3 times. A rate limit or a missing key
puts the story back without using an attempt. Until a story is translated, the
site shows its English headline in Urdu mode.

### Production

```bash
npm run build                          # builds the frontend into dist/
cd server && NODE_ENV=production npm start
```

With `NODE_ENV=production`, Express also serves `dist/` and falls back to
`index.html`, so client-side routes like `/article/12` work when the page is refreshed.

## Project structure

```
src/
  api/news.js            data access: calls the API, or queries demo data when VITE_API_URL is unset
  hooks/useNews.js       React Query hooks: useArticles, useArticle, useArticleCounts
  utils/articleQuery.js  in-memory filter/sort/search (the same rules as the server)
  data/                  demo articles, plus source & category config
  context/               theme + language providers (useTheme, useLanguage)
  i18n/strings.js        English and Urdu UI text
  store/bookmarks.js     Zustand store for saved stories (stored in localStorage)
  components/common/     ArticleCard (hero/grid/row/compact), states, skeletons…
  pages/                 one file per route
  routes/AppRouter.jsx   routes + error boundaries
  styles/globals.css     design tokens (CSS variables) + Tailwind theme

server/src/
  app.js                 Express app (routes, CORS, errors, static hosting)
  worker.js              background jobs: feeds every 15 min, translation every minute
  ingest/                feeds.js (feed list) · normalize.js (cleaning) · ingest.js (fetch + save)
  translate/             Urdu translation queue (Claude API)
  models/                Article, Source, Category, Subscriber
  services/articleQuery.js  MongoDB version of the query rules
  routes/                articles, sources/categories, subscribers
  seed.js                loads src/data into MongoDB
```

## API

| Method | Path | Description |
|---|---|---|
| GET | `/api/articles` | List articles → `{ items, total }` |
| GET | `/api/articles/:id` | Single article (404 if missing) |
| GET | `/api/articles/counts?groupBy=source\|category` | Counts per source/category → `{ id: n }` |
| GET | `/api/sources` | All sources |
| GET | `/api/categories` | All categories |
| POST | `/api/articles/:id/view` | Count a read (powers "Trending") |
| POST | `/api/subscribers` | `{ email }` → newsletter signup |
| GET | `/api/health` | Server + DB status |

Parameters for `/api/articles` and `/counts`: `q`, `category`, `source`
(comma-separated), `tag`, `featured`, `breaking`, `exclude`,
`range` (`any|1h|24h|7d|30d`), `sort` (`latest|views|shares|relevance`),
`limit` (max 100), `offset`.

The frontend's mock mode (`src/utils/articleQuery.js`) and the server
(`server/src/services/articleQuery.js`) implement the same rules. If you change
one, change the other too.

## Scripts

| Root | |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` / `preview` | Production build / preview it |
| `npm run lint` | ESLint (frontend + server) |
| `npm run server` | Start the API in watch mode (runs `server/`) |
| `npm run seed` | Seed MongoDB (sources, categories, demo stories) |
| `npm run ingest` | Fetch all RSS feeds once |
| `npm run worker` | Background worker (feeds + translation) |
| `npm run translate -- --limit 5` | Translate a few queued stories now |

In `server/`, `npm run seed:real-only` loads sources and categories and
removes the demo stories.
