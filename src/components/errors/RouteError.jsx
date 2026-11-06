import { useRouteError } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { useLanguage } from '../../context/language';

/**
 * Router errorElement. Catches anything thrown while rendering a route so a
 * single broken component shows a friendly message instead of a blank page.
 * `fullPage` is used when the layout itself failed (no navbar available).
 */
export default function RouteError({ fullPage = false }) {
  const error = useRouteError();
  const { t } = useLanguage();

  if (import.meta.env.DEV) console.error(error);

  return (
    <div className={fullPage ? 'flex min-h-screen items-center justify-center bg-page p-6' : 'wrap py-16'}>
      <div role="alert" className="card mx-auto flex max-w-md flex-col items-center gap-3 p-10 text-center">
        <AlertTriangle className="text-breaking" size={32} />
        <h1 className="text-lg font-bold text-ink">{t('errorTitle')}</h1>
        <p className="text-[13px] text-muted">{t('errorBody')}</p>
        {import.meta.env.DEV && error?.message && (
          <code className="max-w-full overflow-x-auto rounded bg-soft px-2 py-1 text-[11px] text-muted">
            {error.message}
          </code>
        )}
        <div className="mt-2 flex gap-2">
          <button type="button" onClick={() => window.location.reload()} className="btn-ghost">
            {t('retry')}
          </button>
          {/* plain <a> so it works even if the router itself is broken */}
          <a href="/" className="btn-primary">{t('backHome')}</a>
        </div>
      </div>
    </div>
  );
}
