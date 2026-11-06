import { Link } from 'react-router-dom';
import { categories } from '../../data/categories';
import { sources } from '../../data/sources';
import { useLanguage } from '../../context/language';
import NewsletterForm from '../common/NewsletterForm';

// Footer colours come from theme variables: white in light mode, navy in dark mode.
export default function Footer() {
  const { t, isUrdu } = useLanguage();

  const heading = 'mb-3.5 text-[11px] font-bold uppercase tracking-wider text-footer-heading';
  const link = 'text-[13px] text-footer-link transition-colors hover:text-primary';

  return (
    <footer className="mt-auto border-t border-footer-line bg-footer">
      <div className="wrap py-12">
        <div className="mb-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <div className="mb-3.5 flex items-center gap-2" dir="ltr">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-[15px] font-bold text-on-primary">P</span>
              <span className="text-[17px] font-bold text-footer-heading">PakNews<span className="text-primary">Hub</span></span>
            </div>
            <p className="mb-3 text-[13px] leading-relaxed text-footer-text">{t('brandTagline')}</p>
            {!isUrdu && (
              <p className="urdu text-[13px] text-footer-text" lang="ur">پاکستان کا پہلا بین الاقوامی خبروں کا پلیٹ فارم</p>
            )}
          </div>

          {/* Categories */}
          <div>
            <p className={heading}>{t('categories')}</p>
            <ul className="flex flex-col gap-2">
              {categories.map(cat => (
                <li key={cat.id}>
                  <Link to={`/category/${cat.id}`} className={link}>
                    {cat.label} — <span className="font-urdu text-xs" lang="ur">{cat.urdu}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Sources */}
          <div>
            <p className={heading}>{t('sources')}</p>
            <ul className="flex flex-col gap-2">
              {sources.map(src => (
                <li key={src.id}>
                  <Link to={`/source/${src.id}`} className={link}>
                    {src.country} {src.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <p className={heading}>{t('dailyDigest')}</p>
            <p className="mb-3.5 text-[13px] leading-relaxed text-footer-text">{t('newsletterBody')}</p>
            <NewsletterForm variant="footer" />
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-footer-line pt-5">
          <p className="text-xs text-footer-link">{t('rights', { year: new Date().getFullYear() })}</p>
          {/* These pages don't exist yet, so they're plain text rather than fake links */}
          <ul className="flex gap-5 text-xs text-footer-link">
            <li>{t('privacy')}</li>
            <li>{t('terms')}</li>
            <li>{t('contact')}</li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
