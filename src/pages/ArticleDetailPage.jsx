import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronRight, Clock, Eye, ExternalLink, Share2 } from 'lucide-react';
import CategoryTag from '../components/common/CategoryTag';
import ArticleCard from '../components/common/ArticleCard';
import BookmarkButton from '../components/common/BookmarkButton';
import SourceLogo from '../components/common/SourceLogo';
import NewsletterForm from '../components/common/NewsletterForm';
import { Skeleton, CardSkeleton } from '../components/common/Skeleton';
import { ErrorState, QueryBoundary } from '../components/common/States';
import NotFoundPage from './NotFoundPage';
import { useArticle, useArticles } from '../hooks/useNews';
import { useLanguage } from '../context/language';
import { getCategory } from '../data/categories';
import { getSource } from '../data/sources';
import { categoryEmoji, formatCount } from '../utils/format';
import { cn } from '../utils/cn';

function ShareButtons({ article }) {
  const { t, title } = useLanguage();
  const [message, setMessage] = useState('');
  const url = window.location.href;

  const flash = text => {
    setMessage(text);
    setTimeout(() => setMessage(''), 2500);
  };

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: title(article), url });
      } else {
        await navigator.clipboard.writeText(url);
        flash(t('linkCopied'));
      }
    } catch (err) {
      if (err?.name !== 'AbortError') flash(t('shareFailed')); // AbortError = user closed the sheet
    }
  };

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(`${title(article)}\n${url}`)}`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <BookmarkButton article={article} withLabel />
      <button type="button" onClick={share} className="btn-ghost">
        <Share2 size={13} /> {t('share')}
      </button>
      <a href={whatsappHref} target="_blank" rel="noopener noreferrer"
         className="btn-ghost border-transparent bg-[#25D366] text-white hover:text-white">
        📱 {t('whatsapp')}
      </a>
      {message && <span role="status" className="text-xs text-primary">{message}</span>}
    </div>
  );
}

function ArticleSkeleton() {
  return (
    <div className="wrap py-6">
      <Skeleton className="mb-5 h-3 w-64" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-60 w-full rounded-2xl" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

export default function ArticleDetailPage() {
  const { id } = useParams();
  const articleQuery = useArticle(id);

  if (articleQuery.isPending) return <ArticleSkeleton />;
  if (articleQuery.isError) {
    return <div className="wrap py-10"><ErrorState error={articleQuery.error} onRetry={() => articleQuery.refetch()} /></div>;
  }
  if (!articleQuery.data) return <NotFoundPage titleKey="storyNotFound" bodyKey="storyNotFoundBody" />;

  return <ArticleView article={articleQuery.data} />;
}

function ArticleView({ article }) {
  const { t, isUrdu, title, categoryLabel, ago } = useLanguage();
  const category = getCategory(article.category);
  const source = getSource(article.source);

  const related = useArticles({ category: article.category, exclude: article.id, limit: 3 });
  const moreFromSource = useArticles({ source: article.source, exclude: article.id, limit: 3 });

  // Summary box shows the *other* language: Urdu summary for English readers
  // and the English excerpt for Urdu readers.
  const summary = isUrdu
    ? { label: t('englishSummary'), text: article.excerpt, dir: 'ltr', lang: 'en', className: '' }
    : { label: t('urduSummary'), text: article.urduSummary, dir: 'rtl', lang: 'ur', className: 'urdu text-[15px]' };

  const externalUrl = article.url ?? source?.url;
  const externalLabel = article.url ? t('readOn', { source: article.sourceName }) : t('visit', { name: article.sourceName });

  return (
    <div className="wrap py-6">
      {/* Breadcrumb — the last item is truncated by CSS, not by slicing the string */}
      <nav aria-label="Breadcrumb" className="mb-5 flex min-w-0 items-center gap-1.5 text-xs text-muted">
        <Link to="/" className="shrink-0 hover:text-primary">{t('home')}</Link>
        <ChevronRight size={12} className="shrink-0 rtl:rotate-180" />
        <Link to={`/category/${article.category}`} className="shrink-0 hover:text-primary">
          {categoryLabel(category)}
        </Link>
        <ChevronRight size={12} className="shrink-0 rtl:rotate-180" />
        <span aria-current="page" className="max-w-[320px] truncate text-ink">{title(article)}</span>
      </nav>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
        {/* ── ARTICLE ───────────────────────────────────── */}
        <article className="min-w-0">
          <div className="mb-3.5 flex items-center gap-2.5">
            <CategoryTag categoryId={article.category} />
            {article.isBreaking && (
              <span className="inline-flex items-center gap-1.5 rounded bg-red-100 px-2.5 py-0.5 text-[11px] font-bold text-breaking">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-breaking" />
                {t('breaking')}
              </span>
            )}
          </div>

          <h1 dir="auto" className={cn('mb-4.5 text-2xl font-extrabold leading-tight text-ink sm:text-[28px]', isUrdu && 'font-urdu leading-[1.8]')}>
            {title(article)}
          </h1>

          <div dir={summary.dir} lang={summary.lang} className="mb-5 rounded-e-xl border-s-[3px] border-primary bg-soft px-4.5 py-3.5">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-primary">{summary.label}</p>
            <p className={cn('text-sm leading-relaxed text-ink', summary.className)}>{summary.text}</p>
          </div>

          {/* Meta + actions */}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4.5">
            <div className="flex flex-wrap items-center gap-2.5 text-xs text-muted">
              <Link to={`/source/${article.source}`} className="btn-ghost rounded-full px-3 py-1">
                <ExternalLink size={12} /> {article.sourceName}
              </Link>
              <span className="flex items-center gap-1.5"><Clock size={13} /> {ago(article.publishedAt)}</span>
              <span className="flex items-center gap-1.5"><Eye size={13} /> {t('reads', { n: formatCount(article.views) })}</span>
              <span className="flex items-center gap-1.5"><Clock size={13} /> {t('minRead', { n: article.readMinutes })}</span>
            </div>
            <ShareButtons article={article} />
          </div>

          {/* Image placeholder (articles don't have images yet) */}
          <div aria-hidden className="mb-6 flex h-60 w-full items-center justify-center rounded-2xl border border-line bg-soft text-6xl">
            {categoryEmoji(article.category)}
          </div>

          {/* Body is English-only for now, so pin it LTR even in Urdu mode */}
          <div dir="ltr" lang="en" className="mb-6">
            {article.body?.map((para, i) => (
              <p key={i} className="mb-4 text-[15px] leading-[1.8] text-ink">{para}</p>
            ))}
            {article.quote && (
              <blockquote className="my-6 rounded-e-xl border-s-[3px] border-primary bg-soft px-5 py-4">
                <p className="mb-2 text-base italic leading-relaxed text-ink">“{article.quote.text}”</p>
                <span className="text-xs text-muted">— {article.quote.author}</span>
              </blockquote>
            )}
          </div>

          {/* Tags + source link */}
          <div className="mb-7 flex flex-wrap items-center justify-between gap-3 border-y border-line py-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted">{t('tags')}:</span>
              {article.tags?.map(tag => (
                <Link key={tag} to={`/search?q=${encodeURIComponent(tag)}`}
                      className="rounded border border-line bg-soft px-2.5 py-0.5 text-xs text-muted hover:border-primary hover:text-primary">
                  {tag}
                </Link>
              ))}
            </div>
            {externalUrl && (
              <a href={externalUrl} target="_blank" rel="noopener noreferrer" className="btn-primary">
                {externalLabel} <ExternalLink size={13} />
              </a>
            )}
          </div>

          {/* Related */}
          <section>
            <h2 className="sec-title mb-4 text-[15px]">{t('relatedStories')}</h2>
            <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
              <QueryBoundary query={related} fallback={<CardSkeleton variant="grid" count={3} />}>
                {({ items }) => items.map(a => <ArticleCard key={a.id} article={a} variant="grid" />)}
              </QueryBoundary>
            </div>
          </section>
        </article>

        {/* ── SIDEBAR ───────────────────────────────────── */}
        <aside className="flex flex-col gap-4">
          {source && (
            <section className="widget">
              <div className="mb-3 flex items-center gap-3">
                <SourceLogo source={source} />
                <div>
                  <p className="text-[13px] font-bold text-ink">{source.name}</p>
                  <p className="text-[11px] text-muted">{t('articlesCount', { n: source.articles.toLocaleString() })}</p>
                </div>
              </div>
              <Link to={`/source/${source.id}`} className="btn-ghost w-full bg-soft font-semibold">
                {t('viewAllFrom', { source: source.name })}
              </Link>
            </section>
          )}

          <section className="widget">
            <h2 className="widget-title">{t('moreFrom', { source: article.sourceName })}</h2>
            <div className="flex flex-col gap-3.5">
              <QueryBoundary query={moreFromSource} fallback={<CardSkeleton variant="compact" count={3} />}>
                {({ items }) => items.map(a => <ArticleCard key={a.id} article={a} variant="compact" />)}
              </QueryBoundary>
            </div>
          </section>

          <NewsletterForm variant="widget" />
        </aside>
      </div>
    </div>
  );
}
