import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import ArticleCard from '../components/common/ArticleCard';
import { CardSkeleton } from '../components/common/Skeleton';
import { EmptyState, QueryBoundary } from '../components/common/States';
import { useArticleCounts, useArticles } from '../hooks/useNews';
import { useLanguage } from '../context/language';
import { categories } from '../data/categories';
import { sourcesFor } from '../data/sources';
import { cn } from '../utils/cn';

const RANGES = ['any', '1h', '24h', '7d', '30d'];
const PAGE_SIZE = 8;

export default function SearchPage() {
  const { t, lang, categoryLabel, summary } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();

  // The URL is the single source of truth for the query; `draft` is only what
  // is currently typed in the box.
  const q = searchParams.get('q') ?? '';
  const [draft, setDraft] = useState(q);
  const [lastQ, setLastQ] = useState(q);

  const [category, setCategory] = useState('all');
  const [range, setRange] = useState('any');
  const [sort, setSort] = useState(null);           // null = automatic
  const [checkedSources, setCheckedSources] = useState([]); // empty = all sources
  const [limit, setLimit] = useState(PAGE_SIZE);

  // When the URL query changes (submit, back button, related-search click),
  // sync the input and go back to page one. Done during render, as React
  // recommends, rather than in an effect.
  if (q !== lastQ) {
    setLastQ(q);
    setDraft(q);
    setLimit(PAGE_SIZE);
  }

  const effectiveSort = sort ?? (q ? 'relevance' : 'latest');
  const sortOptions = q ? ['relevance', 'latest', 'views'] : ['latest', 'views'];

  const filters = { q, category: category === 'all' ? undefined : category, range };
  const results = useArticles({ ...filters, source: checkedSources, sort: effectiveSort, limit });
  const sourceCounts = useArticleCounts('source', filters);

  const runSearch = text => setSearchParams(text ? { q: text } : {});
  const onSubmit = e => { e.preventDefault(); runSearch(draft.trim()); };
  const clearSearch = () => { setDraft(''); runSearch(''); };

  const withReset = setter => value => { setter(value); setLimit(PAGE_SIZE); };
  const toggleSource = id => {
    setCheckedSources(prev => (prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]));
    setLimit(PAGE_SIZE);
  };

  // Related searches: most common tags among the current results
  const relatedSearches = (() => {
    const counts = {};
    for (const a of results.data?.items ?? []) {
      for (const tag of a.tags ?? []) {
        if (tag.toLowerCase() !== q.toLowerCase()) counts[tag] = (counts[tag] ?? 0) + 1;
      }
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([tag]) => tag);
  })();

  return (
    <div>
      {/* Search bar + filter chips */}
      <div className="border-b border-line bg-card">
        <div className="wrap py-4.5">
          <form onSubmit={onSubmit} role="search" className="mb-3 flex items-center gap-2.5">
            <div className="flex flex-1 items-center gap-2.5 rounded-xl border border-line bg-soft px-3.5 py-2.5 focus-within:border-primary">
              <Search size={18} className="shrink-0 text-muted" />
              <input
                value={draft}
                onChange={e => setDraft(e.target.value)}
                placeholder={t('searchPlaceholder')}
                aria-label={t('search')}
                dir="auto"
                className="flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-faint"
              />
              {draft && (
                <button type="button" onClick={clearSearch} aria-label={t('clearSearch')} className="text-muted hover:text-ink">
                  <X size={16} />
                </button>
              )}
            </div>
            <button type="submit" className="btn-primary px-5 py-2.5">{t('search')}</button>
          </form>

          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="w-16 shrink-0 text-xs text-muted">{t('category')}:</span>
            <button type="button" className="pill" aria-pressed={category === 'all'} onClick={() => withReset(setCategory)('all')}>
              {t('all')}
            </button>
            {categories.map(cat => (
              <button key={cat.id} type="button" className="pill" aria-pressed={category === cat.id}
                      onClick={() => withReset(setCategory)(cat.id)}>
                {categoryLabel(cat)}
              </button>
            ))}
          </div>
          {/* Date filters on their own row so they don't wrap awkwardly after the categories */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-16 shrink-0 text-xs text-muted">{t('date')}:</span>
            {RANGES.map(r => (
              <button key={r} type="button" className="pill" aria-pressed={range === r} onClick={() => withReset(setRange)(r)}>
                {t(`range_${r}`)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="wrap py-6">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_270px]">
          {/* Results */}
          <div className="min-w-0">
            <div className="mb-4.5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-[15px] font-semibold text-ink">
                {results.data && (q
                  ? <>{t('resultsFor', { n: results.data.total })} <span className="text-primary">“{q}”</span></>
                  : t('results', { n: results.data.total }))}
              </p>
              <label className="flex items-center gap-2 text-[13px] text-muted">
                {t('sort')}:
                <select value={effectiveSort} onChange={e => withReset(setSort)(e.target.value)} className="field">
                  {sortOptions.map(s => <option key={s} value={s}>{t(`sort_${s}`)}</option>)}
                </select>
              </label>
            </div>

            <QueryBoundary query={results} fallback={<div className="flex flex-col gap-2.5"><CardSkeleton count={5} /></div>}>
              {({ items, total }) => {
                if (items.length === 0) {
                  return <EmptyState icon="🔍" title={t('noResults')} body={t('noResultsBody')} />;
                }
                const top = items[0];
                return (
                  <>
                    {/* Summary of the best match (real data, not a canned blurb) */}
                    {q && (
                      <div className="panel mb-4.5 flex items-start gap-3 rounded-xl p-4">
                        <span aria-hidden className="shrink-0 text-xl">✨</span>
                        <div>
                          <p className="mb-1.5 text-[13px] font-semibold text-panel-title">{t('topStorySummary')}</p>
                          <p
                            dir={summary(top).urdu ? 'rtl' : 'ltr'}
                            className={cn('text-xs leading-relaxed text-panel-text', summary(top).urdu && 'urdu text-[13px]')}
                          >
                            {summary(top).text}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col gap-2.5">
                      {items.map((a, i) => (
                        <ArticleCard
                          key={a.id}
                          article={a}
                          variant="row"
                          showStats
                          badge={i === 0 && q && effectiveSort === 'relevance'
                            ? <span className="badge bg-[#EAF3DE] text-[#27500A]">{t('topResult')}</span>
                            : null}
                        />
                      ))}
                    </div>

                    {items.length < total && (
                      <div className="mt-5 text-center">
                        <button
                          type="button"
                          onClick={() => setLimit(l => l + PAGE_SIZE)}
                          disabled={results.isFetching}
                          className="btn-ghost rounded-[10px] px-8 py-2.5 text-[13px]"
                        >
                          {t('showMore', { n: total - items.length })}
                        </button>
                      </div>
                    )}
                  </>
                );
              }}
            </QueryBoundary>
          </div>

          {/* Sidebar */}
          <aside className="flex flex-col gap-3.5">
            <section className="widget">
              <h2 className="widget-title">{t('sourceFilter')}</h2>
              <div className="flex flex-col gap-2.5">
                {/* Only sources with matching stories (busiest first), plus any already ticked */}
                {sourcesFor(lang)
                  .map(src => ({ ...src, count: sourceCounts.data?.[src.id] ?? 0 }))
                  .filter(src => src.count > 0 || checkedSources.includes(src.id))
                  .sort((a, b) => b.count - a.count)
                  .map(src => (
                  <label key={src.id} className="flex cursor-pointer items-center gap-2 text-[13px] text-muted">
                    <input
                      type="checkbox"
                      checked={checkedSources.includes(src.id)}
                      onChange={() => toggleSource(src.id)}
                      className="accent-primary"
                    />
                    <span className="flex-1">{src.name}</span>
                    <span className="text-[11px]">{src.count}</span>
                  </label>
                ))}
              </div>
            </section>

            {relatedSearches.length > 0 && (
              <section className="widget">
                <h2 className="widget-title">{t('relatedSearches')}</h2>
                <div className="flex flex-col gap-2.5">
                  {relatedSearches.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => runSearch(tag)}
                      className="flex items-center gap-2 text-start text-[13px] text-primary hover:underline"
                    >
                      <Search size={12} /> {tag}
                    </button>
                  ))}
                </div>
              </section>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
