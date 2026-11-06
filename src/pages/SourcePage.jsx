import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, Bell, ExternalLink } from 'lucide-react';
import ArticleCard from '../components/common/ArticleCard';
import SourceLogo from '../components/common/SourceLogo';
import { CardSkeleton } from '../components/common/Skeleton';
import { EmptyState, QueryBoundary } from '../components/common/States';
import NotFoundPage from './NotFoundPage';
import { useArticleCounts, useArticles } from '../hooks/useNews';
import { useLanguage } from '../context/language';
import { categories } from '../data/categories';
import { getSource, sources } from '../data/sources';

const SORTS = ['latest', 'views'];
const PAGE_SIZE = 6;

// Rendered with key={id} (see AppRouter), so state resets per source.
export default function SourcePage() {
  const { id } = useParams();
  const { t, categoryLabel } = useLanguage();
  const source = getSource(id);

  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('latest');
  const [limit, setLimit] = useState(PAGE_SIZE);

  const list = useArticles(
    { source: id, category: category === 'all' ? undefined : category, sort, limit },
    { enabled: Boolean(source) }
  );
  const counts = useArticleCounts('category', { source: id }); // unfiltered, for tabs + breakdown

  if (!source) return <NotFoundPage />;

  const totalHere = Object.values(counts.data ?? {}).reduce((sum, n) => sum + n, 0);
  const breakdown = categories
    .map(c => ({ ...c, count: counts.data?.[c.id] ?? 0 }))
    .filter(c => c.count > 0)
    .sort((a, b) => b.count - a.count)
    .map(c => ({ ...c, pct: Math.round((c.count / Math.max(totalHere, 1)) * 100) }));

  const otherSources = sources.filter(s => s.id !== source.id).slice(0, 4);
  const pickCategory = c => { setCategory(c); setLimit(PAGE_SIZE); };

  const stats = [
    { value: source.articles.toLocaleString(), label: t('stat_articles') },
    { value: totalHere, label: t('stat_onSite') },
    { value: breakdown.length, label: t('stat_categories') },
  ];

  return (
    <div>
      {/* Source header — warm light banner in light mode, navy in dark mode */}
      <div className="hero-surface relative isolate border-x-0 border-t-0">
        <div aria-hidden className="hero-overlay absolute inset-0 -z-10 opacity-60" />
        <div className="wrap flex flex-wrap items-start gap-6 py-6">
          <SourceLogo source={source} size="lg" />

          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-hero-title">{source.name}</h1>
              <span className="rounded bg-[#EAF3DE] px-2 py-0.5 text-[11px] font-semibold text-[#27500A]">
                ✓ {t('verified')}
              </span>
            </div>
            <p className="mb-4 text-[13px] text-hero-meta">{source.country} {t('newsSource')}</p>
            <div className="grid max-w-sm grid-cols-3 gap-3">
              {stats.map(s => (
                <div key={s.label} className="rounded-xl border border-line/60 bg-hero-chip p-3 text-center dark:border-transparent">
                  <p className="text-lg font-bold text-primary">{s.value}</p>
                  <p className="mt-0.5 text-[11px] text-hero-meta">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-2">
            <button type="button" disabled title={t('comingSoon')} className="btn-primary rounded-xl px-4 py-2">
              <Bell size={14} /> {t('followSource')}
            </button>
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost rounded-xl px-4 py-2 text-[13px]"
            >
              <ExternalLink size={14} /> {t('visit', { name: source.name })}
            </a>
          </div>
        </div>
      </div>

      <div className="wrap py-5">
        {/* Category tabs + sort */}
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <button type="button" className="pill" aria-pressed={category === 'all'} onClick={() => pickCategory('all')}>
            {t('all')}
          </button>
          {breakdown.map(c => (
            <button key={c.id} type="button" className="pill" aria-pressed={category === c.id} onClick={() => pickCategory(c.id)}>
              {categoryLabel(c)}
            </button>
          ))}
          <label className="ms-auto flex items-center gap-2 text-[13px] text-muted">
            {t('sort')}:
            <select value={sort} onChange={e => { setSort(e.target.value); setLimit(PAGE_SIZE); }} className="field">
              {SORTS.map(s => <option key={s} value={s}>{t(`sort_${s}`)}</option>)}
            </select>
          </label>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_280px]">
          {/* Articles */}
          <div className="min-w-0">
            <QueryBoundary
              query={list}
              fallback={<div className="flex flex-col gap-3"><CardSkeleton variant="hero" /><CardSkeleton count={3} /></div>}
            >
              {({ items, total }) => {
                if (items.length === 0) return <EmptyState title={t('noCategoryArticles')} />;
                const [top, ...rest] = items;
                return (
                  <>
                    <ArticleCard article={top} variant="hero" label={t('latest')} className="mb-5" />
                    <div className="flex flex-col gap-3">
                      {rest.map(a => <ArticleCard key={a.id} article={a} variant="row" />)}
                    </div>
                    {items.length < total && (
                      <div className="mt-5 text-center">
                        <button
                          type="button"
                          onClick={() => setLimit(l => l + PAGE_SIZE)}
                          disabled={list.isFetching}
                          className="btn-ghost rounded-xl px-8 py-2.5 text-[13px]"
                        >
                          {t('loadMoreFrom', { source: source.name })}
                        </button>
                      </div>
                    )}
                  </>
                );
              }}
            </QueryBoundary>
          </div>

          {/* Sidebar */}
          <aside className="flex flex-col gap-4">
            <section className="widget">
              <h2 className="widget-title text-[13px]">{t('coverage')}</h2>
              <div className="flex flex-col gap-3">
                {breakdown.map(c => (
                  <div key={c.id}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-muted">{categoryLabel(c)}</span>
                      <span className="text-ink">{c.pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-soft">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${c.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="widget">
              <h2 className="widget-title text-[13px]">{t('otherSources')}</h2>
              <div className="flex flex-col gap-3">
                {otherSources.map(src => (
                  <Link key={src.id} to={`/source/${src.id}`} className="flex items-center gap-3 transition-opacity hover:opacity-80">
                    <SourceLogo source={src} size="sm" />
                    <div>
                      <p className="text-[13px] font-medium text-ink">{src.name}</p>
                      <p className="text-[11px] text-muted">{t('articlesCount', { n: src.articles.toLocaleString() })}</p>
                    </div>
                  </Link>
                ))}
                <Link to="/search" className="mt-1 flex items-center gap-1 text-xs text-primary hover:underline">
                  {t('browseAll')} <ArrowRight size={11} className="rtl:rotate-180" />
                </Link>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
