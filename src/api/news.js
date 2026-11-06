// Single entry point for news data.
//
// - If VITE_API_URL is set (e.g. "/api" with the Vite proxy), data comes
//   from the Express + MongoDB server in /server.
// - Otherwise the bundled demo articles are queried in-memory, so the
//   frontend still runs on its own with `npm run dev`.
//
// Both paths accept the same params and return the same shapes.

import { articles as demoArticles, rebaseToNow } from '../data/articles';
import { queryArticles, countArticles } from '../utils/articleQuery';

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '');
export const isMockMode = !API_URL;

const mockArticles = isMockMode ? rebaseToNow(demoArticles) : [];

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

function toQueryString(params = {}) {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '' || value === false) continue;
    qs.set(key, Array.isArray(value) ? value.join(',') : String(value));
  }
  const s = qs.toString();
  return s ? `?${s}` : '';
}

async function get(path, params) {
  const res = await fetch(`${API_URL}${path}${toQueryString(params)}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.message ?? `Request failed (${res.status})`, res.status);
  }
  return res.json();
}

/** → { items: Article[], total: number } */
export function fetchArticles(params = {}) {
  if (isMockMode) return Promise.resolve(queryArticles(mockArticles, params));
  return get('/articles', params);
}

/** → Article, or null if it doesn't exist */
export async function fetchArticle(id) {
  if (isMockMode) return mockArticles.find(a => a.id === id) ?? null;
  try {
    return await get(`/articles/${encodeURIComponent(id)}`);
  } catch (err) {
    if (err.status === 404) return null;
    throw err;
  }
}

/** Newsletter signup. Only available when the API server is connected. */
export async function subscribe(email) {
  if (isMockMode) throw new ApiError('Newsletter signup needs the API server', 503);
  const res = await fetch(`${API_URL}/subscribers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.message ?? `Request failed (${res.status})`, res.status);
  }
  return res.json();
}

/** → { [sourceId|categoryId]: count } for articles matching params */
export function fetchArticleCounts(groupBy, params = {}) {
  if (isMockMode) return Promise.resolve(countArticles(mockArticles, groupBy, params));
  return get('/articles/counts', { ...params, groupBy });
}
