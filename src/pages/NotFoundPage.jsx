import { Link } from 'react-router-dom';
import { EmptyState } from '../components/common/States';
import { useLanguage } from '../context/language';

/** 404 page. Also used for unknown article / category / source ids. */
export default function NotFoundPage({ titleKey = 'pageNotFound', bodyKey = 'pageNotFoundBody' }) {
  const { t } = useLanguage();
  return (
    <div className="wrap py-16">
      <EmptyState icon="🧭" title={t(titleKey)} body={t(bodyKey)} className="mx-auto max-w-md">
        <Link to="/" className="btn-primary">{t('backHome')}</Link>
        <Link to="/search" className="btn-ghost">{t('search')}</Link>
      </EmptyState>
    </div>
  );
}
