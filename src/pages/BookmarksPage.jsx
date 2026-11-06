import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import ArticleCard from '../components/common/ArticleCard';
import { EmptyState } from '../components/common/States';
import { useBookmarks } from '../store/bookmarks';
import { useLanguage } from '../context/language';

export default function BookmarksPage() {
  const { t } = useLanguage();
  const items = useBookmarks(s => s.items);
  const clear = useBookmarks(s => s.clear);

  return (
    <div className="wrap max-w-3xl py-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h1 className="sec-title text-xl">
          {t('savedStories')}
          {items.length > 0 && <span className="text-sm font-normal text-muted">({items.length})</span>}
        </h1>
        {items.length > 0 && (
          <button type="button" onClick={clear} className="btn-ghost">
            <Trash2 size={13} /> {t('clearAll')}
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState icon="🔖" title={t('noBookmarks')}>
          <Link to="/" className="btn-primary">{t('browseLatest')}</Link>
        </EmptyState>
      ) : (
        <div className="flex flex-col gap-2.5">
          {items.map(a => <ArticleCard key={a.id} article={a} variant="row" showStats />)}
        </div>
      )}
    </div>
  );
}
