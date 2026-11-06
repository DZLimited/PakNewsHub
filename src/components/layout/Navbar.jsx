import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Bookmark, Menu, Moon, Search, Sun, X } from 'lucide-react';
import { categories } from '../../data/categories';
import { useTheme } from '../../context/theme';
import { useLanguage } from '../../context/language';
import { useBookmarks } from '../../store/bookmarks';
import { useArticles } from '../../hooks/useNews';
import { cn } from '../../utils/cn';

function BreakingTicker() {
  const { t, title } = useLanguage();
  // Latest headlines, derived from the articles instead of a separate list
  const { data } = useArticles({ sort: 'latest', limit: 8 });
  const items = data?.items ?? [];

  return (
    <div className="flex h-8 items-center overflow-hidden border-b border-line bg-card">
      <div className="flex h-full shrink-0 items-center gap-2 bg-breaking px-3.5">
        <span className="h-[7px] w-[7px] animate-pulse rounded-full bg-white" />
        <span className="whitespace-nowrap text-[11px] font-bold uppercase tracking-wider text-white">
          {t('breaking')}
        </span>
      </div>
      <div className="flex-1 overflow-hidden">
        {items.length > 0 && (
          <div className="marquee">
            {/* rendered twice for a seamless loop; the copy is hidden from screen readers */}
            {[0, 1].map(copy =>
              items.map(a => (
                <Link
                  key={`${copy}-${a.id}`}
                  to={`/article/${a.id}`}
                  aria-hidden={copy === 1}
                  tabIndex={copy === 1 ? -1 : undefined}
                  className="whitespace-nowrap px-9 text-xs text-ink hover:text-primary"
                >
                  {a.isBreaking && <span className="me-1.5 text-breaking">●</span>}
                  {title(a)}
                </Link>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Navbar() {
  const { isDark, toggleTheme } = useTheme();
  const { t, categoryLabel, toggleLanguage } = useLanguage();
  const savedCount = useBookmarks(s => s.items.length);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinkClass = ({ isActive }) =>
    cn(
      'whitespace-nowrap rounded-lg px-3 py-1.5 text-[13px] transition-colors',
      isActive ? 'bg-primary font-semibold text-on-primary' : 'text-muted hover:text-ink'
    );

  return (
    <>
      <BreakingTicker />

      <nav className="sticky top-0 z-50 border-b border-line bg-card shadow-[0_1px_6px_rgba(0,0,0,0.05)]">
        <div className="wrap flex h-[54px] items-center gap-4">
          {/* Logo */}
          <Link to="/" className="flex shrink-0 items-center gap-2" onClick={() => setMobileOpen(false)}>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-[15px] font-bold text-on-primary">
              P
            </span>
            <span className="text-[17px] font-bold text-ink" dir="ltr">
              PakNews<span className="text-primary">Hub</span>
            </span>
          </Link>

          {/* Category links — desktop only (lg+). Below that the hamburger takes over. */}
          <div className="hidden flex-1 items-center justify-center gap-0.5 lg:flex">
            {categories.slice(0, 7).map(cat => (
              <NavLink key={cat.id} to={`/category/${cat.id}`} className={navLinkClass}>
                {categoryLabel(cat)}
              </NavLink>
            ))}
          </div>

          {/* Right controls */}
          <div className="ms-auto flex shrink-0 items-center gap-2 lg:ms-0">
            <Link to="/search" className="icon-btn" aria-label={t('search')} title={t('search')}>
              <Search size={17} />
            </Link>
            <Link to="/saved" className="icon-btn relative" aria-label={t('savedStories')} title={t('savedStories')}>
              <Bookmark size={17} />
              {savedCount > 0 && (
                <span className="absolute -end-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-on-primary">
                  {savedCount}
                </span>
              )}
            </Link>
            <button
              type="button"
              onClick={toggleTheme}
              className="icon-btn"
              aria-label={isDark ? t('switchToLight') : t('switchToDark')}
              title={isDark ? t('switchToLight') : t('switchToDark')}
            >
              {isDark ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <button
              type="button"
              onClick={toggleLanguage}
              aria-label={t('switchLanguageLabel')}
              className="btn-primary hidden px-3.5 py-1.5 sm:inline-flex"
            >
              {t('switchLanguage')}
            </button>
            <button
              type="button"
              onClick={() => setMobileOpen(o => !o)}
              className="icon-btn lg:hidden"
              aria-label={mobileOpen ? t('closeMenu') : t('openMenu')}
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <div id="mobile-menu" className="border-t border-line px-4 py-3 lg:hidden">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {categories.map(cat => (
                <NavLink
                  key={cat.id}
                  to={`/category/${cat.id}`}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'rounded-lg border border-line p-2 text-center text-[13px]',
                      isActive ? 'bg-primary font-semibold text-on-primary' : 'bg-soft text-ink'
                    )
                  }
                >
                  {categoryLabel(cat)}
                </NavLink>
              ))}
            </div>
            {/* language toggle is hidden in the top bar on very small screens */}
            <button
              type="button"
              onClick={() => { toggleLanguage(); setMobileOpen(false); }}
              className="btn-primary mt-3 w-full sm:hidden"
            >
              {t('switchLanguage')}
            </button>
          </div>
        )}
      </nav>
    </>
  );
}
