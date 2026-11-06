import { Bookmark } from 'lucide-react';
import { useBookmarks } from '../../store/bookmarks';
import { useLanguage } from '../../context/language';
import { cn } from '../../utils/cn';

export default function BookmarkButton({ article, withLabel = false, className }) {
  const { t } = useLanguage();
  const saved = useBookmarks(s => s.items.some(a => a.id === article.id));
  const toggle = useBookmarks(s => s.toggle);
  const label = saved ? t('removeBookmark') : t('bookmark');

  return (
    <button
      type="button"
      onClick={() => toggle(article)}
      aria-pressed={saved}
      aria-label={withLabel ? undefined : label}
      title={label}
      className={cn(
        'relative z-10', // sit above the card's stretched link
        withLabel ? 'btn-ghost' : 'leading-none text-muted transition-colors hover:text-primary',
        saved && 'text-primary',
        className
      )}
    >
      <Bookmark size={withLabel ? 13 : 14} fill={saved ? 'currentColor' : 'none'} />
      {withLabel && (saved ? t('saved') : t('save'))}
    </button>
  );
}
