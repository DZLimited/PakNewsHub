# PakNewsHub

International news for Pakistani readers, in **English and Urdu**. Stories
from BBC, Reuters, Al Jazeera, Dawn and others, each with an English headline,
an Urdu headline and an Urdu summary.

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
| `npm run seed` | Seed MongoDB |
