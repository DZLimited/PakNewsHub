import { AlertTriangle, RotateCw } from 'lucide-react';
import { useLanguage } from '../../context/language';
import { cn } from '../../utils/cn';

export function EmptyState({ icon = '📰', title, body, children, className }) {
  return (
    <div className={cn('card p-10 text-center', className)}>
      <span aria-hidden className="mb-3 block text-5xl">{icon}</span>
      {title && <p className="mb-2 text-base font-semibold text-ink">{title}</p>}
      {body && <p className="text-[13px] text-muted">{body}</p>}
      {children && <div className="mt-5 flex justify-center gap-2">{children}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry, className }) {
  const { t } = useLanguage();
  return (
    <div role="alert" className={cn('card flex flex-col items-center gap-3 p-8 text-center', className)}>
      <AlertTriangle className="text-breaking" size={28} />
      <p className="font-semibold text-ink">{t('errorTitle')}</p>
      <p className="text-[13px] text-muted">{t('errorBody')}</p>
      {import.meta.env.DEV && error?.message && (
        <code className="rounded bg-soft px-2 py-1 text-[11px] text-muted">{error.message}</code>
      )}
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-ghost">
          <RotateCw size={13} /> {t('retry')}
        </button>
      )}
    </div>
  );
}

/**
 * Renders a React Query result: `fallback` while loading, an ErrorState with
 * retry on failure, otherwise `children(data)`.
 */
export function QueryBoundary({ query, fallback = null, children }) {
  if (query.isPending) return fallback;
  if (query.isError) return <ErrorState error={query.error} onRetry={() => query.refetch()} />;
  return children(query.data);
}
