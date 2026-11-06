import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { fetchArticle, fetchArticleCounts, fetchArticles } from '../api/news';

/** Paginated/filtered article list → { items, total } */
export function useArticles(params = {}, options = {}) {
  return useQuery({
    queryKey: ['articles', params],
    queryFn: () => fetchArticles(params),
    placeholderData: keepPreviousData, // keep old list visible while filters change
    ...options,
  });
}

/** Single article → Article | null */
export function useArticle(id) {
  return useQuery({
    queryKey: ['article', id],
    queryFn: () => fetchArticle(id),
    enabled: Boolean(id),
  });
}

/** Counts grouped by 'source' or 'category' → { [id]: n } */
export function useArticleCounts(groupBy, params = {}) {
  return useQuery({
    queryKey: ['articleCounts', groupBy, params],
    queryFn: () => fetchArticleCounts(groupBy, params),
    placeholderData: keepPreviousData,
  });
}
