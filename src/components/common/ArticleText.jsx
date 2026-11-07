import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/language';
import { cn } from '../../utils/cn';

/** Headline in the current language. With `link`, the whole parent card
 *  (which must be `relative`) becomes clickable via .stretched-link. */
export function Headline({ article, as: Tag = 'h3', link = true, className }) {
  const { title, showsUrdu } = useLanguage();
  const text = title(article);
  return (
    // Urdu font only when the text really is Urdu (an untranslated story in
    // Urdu mode shows its English title in the normal font).
    <Tag dir="auto" className={cn(className, showsUrdu(article) && 'font-urdu leading-[2.1]')}>
      {link ? (
        <Link to={`/article/${article.id}`} className="stretched-link">
          {text}
        </Link>
      ) : (
        text
      )}
    </Tag>
  );
}

/** One-line headline in the *other* language, shown under the main one.
 *  Renders nothing when there is no other-language title yet. */
export function Subline({ article, className }) {
  const { isUrdu, altTitle } = useLanguage();
  const text = altTitle(article);
  if (!text) return null;
  const textIsUrdu = !isUrdu; // English page → Urdu subline, and vice versa
  return (
    <p
      dir={textIsUrdu ? 'rtl' : 'ltr'}
      lang={textIsUrdu ? 'ur' : 'en'}
      // Urdu line-height goes LAST: Tailwind size classes like `text-xs` also
      // set a line-height, which would otherwise win and clip the Nastaliq
      // script (truncate = overflow hidden).
      className={cn('truncate text-muted', !textIsUrdu && 'text-end', className, textIsUrdu && 'font-urdu leading-[2.1]')}
    >
      {text}
    </p>
  );
}

/** "BBC World · 12m ago". Each part is wrapped in <bdi> so an English source
 *  name next to Urdu "1 گھنٹے پہلے" doesn't get reordered by the bidi algorithm. */
export function Meta({ article, className }) {
  const { ago } = useLanguage();
  return (
    <span className={cn('text-[11px] text-muted', className)}>
      <bdi>{article.sourceName}</bdi> · <bdi>{ago(article.publishedAt)}</bdi>
    </span>
  );
}
