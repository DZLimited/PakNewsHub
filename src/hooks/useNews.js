import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { fetchArticle, fetchArticleCounts, fetchArticles } from '../api/news';
import { useLanguage } from '../context/language';

// Lists and counts always come from the edition the reader is in: the اردو
// button switches the whole site to the Urdu edition (Urdu-language sources).
// A single article (useArticle) opens in either edition.
function useEditionParams(params) {
  const { lang } = useLanguage();
  return { edition: lang, ...params };
}

/** Paginated/filtered article list → { items, total } */
export function useArticles(rawParams = {}, options = {}) {
  const params = useEditionParams(rawParams);
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
export function useArticleCounts(groupBy, rawParams = {}) {
  const params = useEditionParams(rawParams);
  return useQuery({
    queryKey: ['articleCounts', groupBy, params],
    queryFn: () => fetchArticleCounts(groupBy, params),
    placeholderData: keepPreviousData,
  });
}
