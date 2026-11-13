import { useState } from 'react';
import { Clock, Eye } from 'lucide-react';
import CategoryTag from './CategoryTag';
import ArticleImage from './ArticleImage';
import BookmarkButton from './BookmarkButton';
import { Headline, Meta, Subline } from './ArticleText';
import { useLanguage } from '../../context/language';
import { categoryEmoji, formatCount } from '../../utils/format';
import { cn } from '../../utils/cn';

/**
 * The one article card used across the site.
 *
 * variant:
 *  - "grid"    vertical card (home pairs, related stories)
 *  - "row"     horizontal card with photo/emoji thumbnail (lists, search results)
 *  - "hero"    top story: the WHOLE photo beside the headline + summary
 *              (stacked on phones), or the themed surface when there is no photo.
 *              `label` sets the badge text, `size` = "lg" | "md"
 *  - "compact" small sidebar item; pass `rank` for a numbered list
 *
 * `badge` (row): extra element next to the category tag, e.g. "Top result".
 * `showStats` (row): show views + read time.
 */
export default function ArticleCard({
  article, variant = 'row', label, size = 'md', rank, badge, showStats = false, className,
}) {
  const { t, isUrdu } = useLanguage();
  const [photoFailed, setPhotoFailed] = useState(false);

  if (variant === 'hero' && article.imageUrl && !photoFailed) {
    // Top story WITH a photo. Desktop: photo LEFT, headline + summary RIGHT,
    // so the whole card fits on screen (~270px tall) and the headline is
    // readable without scrolling. Phone: photo on top, text below.
    // The photo is never cropped (mode="full": blurred fill for other shapes).
    const summaryIsUrdu = isUrdu && Boolean(article.urduSummary);
    const summary = summaryIsUrdu ? article.urduSummary : article.excerpt;
    return (
      <article
        className={cn(
          'card card-link group relative grid overflow-hidden rounded-2xl md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]',
          className
        )}
      >
        <ArticleImage
          article={article}
          mode="full"
          // phone: 16:9 box; desktop: fills the row height next to the text
          className="aspect-video w-full md:aspect-auto md:h-full md:min-h-[270px]"
          onFail={() => setPhotoFailed(true)}
        />
        <div className={cn('flex flex-col justify-center gap-2.5', size === 'lg' ? 'p-5 sm:p-6' : 'p-4 sm:p-5')}>
          <div className="flex flex-wrap items-center gap-2">
            {label && <span className="badge bg-primary text-on-primary">{label}</span>}
            <CategoryTag categoryId={article.category} />
          </div>
          <Headline
            article={article}
            as="h2"
            className={cn(
              'line-clamp-4 font-bold leading-snug text-ink transition-colors group-hover:text-primary',
              size === 'lg' ? 'text-xl sm:text-[22px]' : 'text-lg sm:text-xl'
            )}
          />
          {summary && (
            <p
              dir={summaryIsUrdu ? 'rtl' : 'auto'}
              className={cn('line-clamp-3 text-[13px] leading-relaxed text-muted', summaryIsUrdu && 'urdu')}
            >
              {summary}
            </p>
          )}
          <Meta article={article} className="text-xs" />
        </div>
      </article>
    );
  }

  if (variant === 'hero') {
    // Top story WITHOUT a photo: themed surface with a large category emoji.
    return (
      <article
        className={cn(
          // `isolate` + negative z-index keeps the decorations behind the text
          // without making the text box `relative` — so the stretched title
          // link still covers the whole card.
          'hero-surface card-link group relative isolate flex flex-col justify-end overflow-hidden rounded-2xl shadow-card',
          size === 'lg' ? 'min-h-[340px]' : 'min-h-[200px]',
          className
        )}
      >
        <span
          aria-hidden
          className={cn(
            'absolute end-6 top-5 -z-10 opacity-25 select-none dark:opacity-15',
            size === 'lg' ? 'text-[110px]' : 'text-7xl'
          )}
        >
          {categoryEmoji(article.category)}
        </span>
        <div aria-hidden className="hero-overlay absolute inset-0 -z-10" />
        <div className={size === 'lg' ? 'p-6' : 'p-5'}>
          <div className="mb-2.5 flex flex-wrap items-center gap-2.5">
            {label && <span className="badge bg-primary text-on-primary">{label}</span>}
            <Meta article={article} className="text-xs text-hero-meta" />
          </div>
          <Headline
            article={article}
            as="h2"
            className={cn(
              'mb-2 font-bold leading-snug text-hero-title transition-colors group-hover:text-hero-hover',
              size === 'lg' ? 'text-[22px] sm:text-2xl' : 'text-lg'
            )}
          />
          <Subline article={article} className="text-[13px] text-hero-sub" />
        </div>
      </article>
    );
  }

  if (variant === 'grid') {
    return (
      <article className={cn('card card-link relative flex flex-col gap-2.5 rounded-xl p-4', className)}>
        <div className="flex items-center justify-between gap-2">
          <CategoryTag categoryId={article.category} />
          <BookmarkButton article={article} />
        </div>
        <Headline article={article} className="line-clamp-2 text-sm font-semibold leading-snug text-ink" />
        <Subline article={article} className="text-xs" />
        <div className="mt-auto flex items-center justify-between gap-2">
          <Meta article={article} />
          {/* read counts start at 0 for new stories — show them once there are some */}
          {article.views > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-muted">
              <Eye size={11} /> {formatCount(article.views)}
            </span>
          )}
        </div>
      </article>
    );
  }

  if (variant === 'compact') {
    return (
      <article className={cn('group relative flex items-start gap-3', className)}>
        {rank ? (
          <span className="min-w-[22px] text-lg font-bold leading-tight text-primary">{rank}</span>
        ) : (
          <ArticleImage article={article} className="aspect-video w-[72px] shrink-0 rounded-lg" emojiClassName="text-lg" />
        )}
        <div className="min-w-0">
          <Headline
            article={article}
            as="h4"
            className="mb-0.5 line-clamp-2 text-[13px] font-medium leading-snug text-ink transition-colors group-hover:text-primary"
          />
          <span className="text-[11px] text-muted">
            <Meta article={article} />
            {rank && article.views > 0 && ` · ${t('reads', { n: formatCount(article.views) })}`}
          </span>
        </div>
      </article>
    );
  }

  // row (default)
  return (
    <article className={cn('card card-link relative flex items-start gap-3.5 rounded-xl px-4 py-3.5', className)}>
      <ArticleImage article={article} className="aspect-video w-[104px] shrink-0 rounded-lg" emojiClassName="text-[22px]" />
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex flex-wrap items-center gap-2">
          <CategoryTag categoryId={article.category} />
          <Meta article={article} />
          {badge}
        </div>
        <Headline article={article} className="mb-1 line-clamp-2 text-[13px] font-semibold leading-snug text-ink" />
        <Subline article={article} className="text-[11px]" />
        {showStats && (
          <div className="mt-1 flex items-center gap-3 text-[11px] text-muted">
            {article.views > 0 && (
              <span className="flex items-center gap-1"><Eye size={11} /> {formatCount(article.views)}</span>
            )}
            {article.readMinutes && (
              <span className="flex items-center gap-1"><Clock size={11} /> {t('minRead', { n: article.readMinutes })}</span>
            )}
          </div>
        )}
      </div>
      <BookmarkButton article={article} className="shrink-0 self-start" />
    </article>
  );
}
