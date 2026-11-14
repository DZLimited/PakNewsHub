import { Link } from 'react-router-dom';
import { ArrowRight, Flag, TrendingUp } from 'lucide-react';
import ArticleCard from '../components/common/ArticleCard';
import SectionHeader from '../components/common/SectionHeader';
import NewsletterForm from '../components/common/NewsletterForm';
import { CardSkeleton } from '../components/common/Skeleton';
import { QueryBoundary } from '../components/common/States';
import { useArticles } from '../hooks/useNews';
import { useLanguage } from '../context/language';

function SidebarList({ items, ranked = false }) {
  return (
    <ul>
      {items.map((a, i) => (
        <li key={a.id} className="border-b border-line py-2.5 first:pt-0 last:border-0 last:pb-0">
          <ArticleCard article={a} variant="compact" rank={ranked ? i + 1 : undefined} />
        </li>
      ))}
    </ul>
  );
}

export default function HomePage() {
  const { t } = useLanguage();

  const featured = useArticles({ featured: true, limit: 3 });
  const world    = useArticles({ category: 'world', limit: 3 });
  const latest   = useArticles({ sort: 'latest', limit: 8 });
  const trending = useArticles({ sort: 'views', limit: 5 });          // top 5 by views
  const pakistan = useArticles({ tag: 'Pakistan', sort: 'latest', limit: 5 });

  return (
    <div className="wrap py-6">
      {/* ── HERO + SIDEBAR ─────────────────────────────── */}
      <div className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_300px]">
        <div className="flex flex-col gap-4">
          <QueryBoundary
            query={featured}
            fallback={<><CardSkeleton variant="hero" /><div className="grid gap-3.5 sm:grid-cols-2"><CardSkeleton variant="grid" count={2} /></div></>}
          >
            {({ items: [hero, ...pair] }) =>
              hero && (
                <>
                  <ArticleCard article={hero} variant="hero" size="lg" label={t('topStory')} />
                  <div className="grid gap-3.5 sm:grid-cols-2">
                    {pair.map(a => <ArticleCard key={a.id} article={a} variant="grid" />)}
                  </div>
                </>
              )
            }
          </QueryBoundary>

          {/* Latest stories sit in the main column so it is about as tall as
              the sidebar (no big empty gap). Stories already shown above are skipped. */}
          <section className="mt-2">
            <SectionHeader title={t('latestStories')} to="/search" linkLabel={t('viewAll')} />
            <div className="flex flex-col gap-2.5">
              <QueryBoundary query={latest} fallback={<CardSkeleton count={4} />}>
                {({ items }) => {
                  const shown = new Set(featured.data?.items.map(a => a.id));
                  return items
                    .filter(a => !shown.has(a.id))
                    .slice(0, 4)
                    .map(a => <ArticleCard key={a.id} article={a} variant="row" />);
                }}
              </QueryBoundary>
            </div>
          </section>
        </div>

        <aside className="flex flex-col gap-4">
          <section className="widget">
            <div className="mb-3.5 flex items-center justify-between">
              <h2 className="widget-title mb-0">
                <TrendingUp size={15} className="text-primary" /> {t('trending')}
              </h2>
              <Link to="/search" className="flex items-center gap-1 text-xs text-primary hover:underline">
                {t('viewAll')} <ArrowRight size={11} className="rtl:rotate-180" />
              </Link>
            </div>
            <QueryBoundary query={trending} fallback={<div className="space-y-4"><CardSkeleton variant="compact" count={5} /></div>}>
              {({ items }) => <SidebarList items={items} ranked />}
            </QueryBoundary>
          </section>

          <section className="widget">
            <h2 className="widget-title">
              <Flag size={15} className="text-primary" /> {t('pakistanFocus')}
            </h2>
            <QueryBoundary query={pakistan} fallback={<div className="space-y-4"><CardSkeleton variant="compact" count={4} /></div>}>
              {({ items }) => <SidebarList items={items} />}
            </QueryBoundary>
          </section>
        </aside>
      </div>

      {/* ── WORLD NEWS ─────────────────────────────────── */}
      <section className="mb-6">
        <SectionHeader title={t('worldNews')} to="/category/world" linkLabel={t('moreStories')} />
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          <QueryBoundary query={world} fallback={<CardSkeleton variant="grid" count={3} />}>
            {({ items }) => items.map(a => <ArticleCard key={a.id} article={a} variant="grid" />)}
          </QueryBoundary>
        </div>
      </section>

      <NewsletterForm variant="banner" />
    </div>
  );
}
