import { useState } from 'react';
import { isMockMode, subscribe } from '../../api/news';
import { useLanguage } from '../../context/language';
import { cn } from '../../utils/cn';

/**
 * Newsletter signup used by the home banner, sidebars and footer.
 * Posts to the API's /subscribers endpoint; disabled in mock mode
 * (no server to store the address).
 *
 * variant: "banner" (wide, home page) | "widget" (sidebar card) | "footer"
 * Colours come from theme variables (.panel / .panel-input), so it is a soft
 * amber panel in light mode and navy in dark mode.
 */
export default function NewsletterForm({ variant = 'widget' }) {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | done | error

  const onSubmit = async e => {
    e.preventDefault();
    setStatus('loading');
    try {
      await subscribe(email.trim());
      setStatus('done');
      setEmail('');
    } catch {
      setStatus('error');
    }
  };

  const disabled = isMockMode || status === 'loading';
  const isBanner = variant === 'banner';
  const noteColor = variant === 'footer' ? 'text-footer-link' : 'text-panel-text';

  const form = (
    <form onSubmit={onSubmit} className={cn('flex gap-2', !isBanner && 'flex-col')}>
      <input
        type="email"
        required
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="your@email.com"
        aria-label="Email"
        dir="ltr"
        className={cn('panel-input', isBanner ? 'w-full sm:w-56' : 'w-full')}
      />
      <button
        type="submit"
        disabled={disabled}
        title={isMockMode ? t('comingSoon') : undefined}
        className={cn('btn-primary', !isBanner && 'w-full')}
      >
        {t('subscribe')}
      </button>
    </form>
  );

  const message =
    (isMockMode && t('comingSoon')) ||
    (status === 'done' && t('subscribed')) ||
    (status === 'error' && t('subscribeFailed'));

  const note = message && (
    <p role="status" className={cn('mt-2 text-[11px]', status === 'error' ? 'text-breaking' : noteColor)}>
      {message}
    </p>
  );

  if (variant === 'footer') return <>{form}{note}</>;

  if (isBanner) {
    return (
      <section className="panel flex flex-wrap items-center justify-between gap-4 px-6 py-6 sm:px-8">
        <div>
          <p className="mb-1 text-base font-bold text-panel-title">{t('newsletterTitle')} 📩</p>
          <p className="text-[13px] text-panel-text">{t('newsletterBody')}</p>
        </div>
        <div className="w-full sm:w-auto">{form}{note}</div>
      </section>
    );
  }

  return (
    <section className="panel p-4">
      <p className="mb-1 text-[13px] font-bold text-panel-title">{t('dailyDigest')}</p>
      <p className="mb-3 text-xs text-panel-text">{t('dailyDigestBody')}</p>
      {form}
      {note}
    </section>
  );
}
