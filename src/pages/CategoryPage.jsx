import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Bell } from 'lucide-react';
import ArticleCard from '../components/common/ArticleCard';
import { CardSkeleton } from '../components/common/Skeleton';
import { EmptyState, QueryBoundary } from '../components/common/States';
import NotFoundPage from './NotFoundPage';
import { useArticleCounts, useArticles } from '../hooks/useNews';
import { useLanguage } from '../context/language';
import { getCategory } from '../data/categories';
import { sourcesFor } from '../data/sources';

const SORTS = ['latest', 'views', 'shares'];
const RANGES = ['any', '1h', '24h', '7d', '30d'];
const FIRST_PAGE = 7;   // 1 top story + 2 grid + 4 rows
const PAGE_SIZE = 8;

// Rendered with key={slug} (see AppRouter), so all state below starts fresh
// for every category.
export default function CategoryPage() {
  const { slug } = useParams();
  const { t, categoryLabel, lang } = useLanguage();
  const category = getCategory(slug);

  const [source, setSource] = useState(null);
  const [range, setRange] = useState('any');
  const [sort, setSort] = useState('latest');
  const [limit, setLimit] = useState(FIRST_PAGE);

  // Any filter change goes back to the first page
  const update = setter => value => { setter(value); setLimit(FIRST_PAGE); };

  const list = useArticles(
    { category: slug, source, range, sort, limit },
    { enabled: Boolean(category) }
  );
  const counts = useArticleCounts('source', { category: slug, range });

  if (!category) return <NotFoundPage />;

  const label = categoryLabel(category);
  const sources = sourcesFor(lang);
  const sourceCounts = sources
    .map(s => ({ ...s, count: counts.data?.[s.id] ?? 0 }))
    .filter(s => s.count > 0)
    .sort((a, b) => b.count - a.count);

  const clearFilters = () => { setSource(null); setRange('any'); setLimit(FIRST_PAGE); };

  return (
    <div className="wrap py-6">
      {/* Header */}
      <div className="mb-4.5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2.5">
            <span className="block h-6 w-[3px] rounded-sm bg-primary" />
            <h1 className="text-xl font-extrabold text-ink">{t('categoryNews', { category: label })}</h1>
            {list.data && (
              <span className="rounded border border-line bg-soft px-2.5 py-0.5 text-xs text-muted">
                {t('storiesCount', { n: list.data.total })}
              </span>
            )}
          </div>
          <p className="ps-3.5 text-[13px] text-muted">{t('fromSources', { n: sources.length })}</p>
        </div>
        <label className="flex items-center gap-2 text-[13px] text-muted">
          {t('sort')}:
          <select value={sort} onChange={e => update(setSort)(e.target.value)} className="field">
            {SORTS.map(s => <option key={s} value={s}>{t(`sort_${s}`)}</option>)}
          </select>
        </label>
      </div>

      {/* Source pills */}
      <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label={t('sources')}>
        <button type="button" className="pill" aria-pressed={!source} onClick={() => update(setSource)(null)}>
          {t('allSources')}
        </button>
        {sourceCounts.slice(0, 6).map(s => (
          <button
            key={s.id}
            type="button"
            className="pill"
            aria-pressed={source === s.id}
            onClick={() => update(setSource)(source === s.id ? null : s.id)}
          >
            {s.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_270px]">
        {/* Feed */}
        <div className="min-w-0">
          <QueryBoundary
            query={list}
            fallback={<div className="flex flex-col gap-3.5"><CardSkeleton variant="hero" /><CardSkeleton count={4} /></div>}
          >
            {({ items, total }) => {
              if (items.length === 0) {
                return (
                  <EmptyState title={t('noStories')}>
                    <button type="button" className="btn-primary" onClick={clearFilters}>{t('clearFilters')}</button>
                  </EmptyState>
                );
              }
              const [top, ...rest] = items;
              const grid = rest.slice(0, 2);
              const rows = rest.slice(2);
              return (
                <>
                  <ArticleCard article={top} variant="hero" label={t(sort === 'latest' ? 'latest' : `sort_${sort}`)} className="mb-4" />
                  {grid.length > 0 && (
                    <div className="mb-3.5 grid gap-3.5 sm:grid-cols-2">
                      {grid.map(a => <ArticleCard key={a.id} article={a} variant="grid" />)}
                    </div>
                  )}
                  <div className="flex flex-col gap-2.5">
                    {rows.map(a => <ArticleCard key={a.id} article={a} variant="row" />)}
                  </div>
                  {items.length < total && (
                    <div className="mt-5 text-center">
                      <button
                        type="button"
                        onClick={() => setLimit(l => l + PAGE_SIZE)}
                        disabled={list.isFetching}
                        className="btn-ghost rounded-[10px] px-8 py-2.5 text-[13px]"
                      >
                        {t('loadMore')}
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
            <h2 className="widget-title">{t('filterByDate')}</h2>
            <div className="flex flex-col gap-2.5">
              {RANGES.map(r => (
                <label key={r} className="flex cursor-pointer items-center gap-2 text-[13px] text-muted">
                  <input
                    type="radio"
                    name="date-range"
                    checked={range === r}
                    onChange={() => update(setRange)(r)}
                    className="accent-primary"
                  />
                  {t(`range_${r}`)}
                </label>
              ))}
            </div>
          </section>

          <section className="widget">
            <h2 className="widget-title">{t('topSources')}</h2>
            <ul className="flex flex-col gap-2.5">
              {sourceCounts.slice(0, 5).map(s => (
                <li key={s.id} className="flex items-center justify-between">
                  <span className="text-[13px] text-ink">{s.name}</span>
                  <span className="rounded px-2 py-0.5 text-[11px]" style={{ background: s.color, color: s.textColor }}>
                    {s.count}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="panel p-4">
            <p className="mb-1 text-[13px] font-bold text-panel-title">{t('getAlerts', { category: label })}</p>
            <p className="mb-3 text-xs text-panel-text">{t('alertsBody')}</p>
            <button type="button" disabled title={t('comingSoon')} className="btn-primary w-full">
              <Bell size={13} /> {t('enableNotifications')}
            </button>
            <p className="mt-2 text-[11px] text-panel-text">{t('comingSoon')}</p>
          </section>
        </aside>
      </div>
    </div>
  );
}
