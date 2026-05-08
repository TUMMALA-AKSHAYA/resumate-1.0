import { Link, NavLink } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../hooks';
import { setCredentials } from '../store/slices/authSlice';
import { useTheme } from './ThemeProvider';
import { Footer } from './Footer';
import { BRAND_NAME, BRAND_TAGLINE } from '../brand';

export function Layout({ children }: { children: React.ReactNode }) {
  const { token, user } = useAppSelector((s) => s.auth);
  const dispatch = useAppDispatch();
  const { theme, toggle } = useTheme();

  return (
    <div className="flex min-h-screen flex-col bg-gradient-page">
      <header className="sticky top-0 z-20 border-b border-surface-line bg-white/95 shadow-sm backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/95">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="group flex flex-col leading-tight">
            <span className="text-lg font-bold tracking-tight text-ink transition group-hover:text-brand-700 dark:text-slate-100 dark:group-hover:text-brand-300">
              {BRAND_NAME}
            </span>
            <span className="text-xs font-medium text-brand-700 dark:text-brand-300">{BRAND_TAGLINE}</span>
          </Link>
          <nav className="flex flex-wrap items-center gap-2 text-sm md:gap-4">
            {!token && (
              <NavLink className={navCls} to="/">
                Home
              </NavLink>
            )}
            {token && (
              <>
                {(user?.role === 'candidate' || user?.role === 'admin') && (
                  <>
                    <NavLink className={navCls} to="/candidate">
                      Dashboard
                    </NavLink>
                    <NavLink className={navCls} to="/builder">
                      Builder
                    </NavLink>
                    <NavLink className={navCls} to="/resumes/upload">
                      Upload
                    </NavLink>
                  </>
                )}
                {(user?.role === 'recruiter' || user?.role === 'admin') && (
                  <NavLink className={navCls} to="/recruiter">
                    Recruiter
                  </NavLink>
                )}
                {user?.role === 'admin' && (
                  <NavLink className={navCls} to="/admin">
                    Admin
                  </NavLink>
                )}
                <NavLink className={navCls} to="/jobs">
                  Jobs
                </NavLink>
              </>
            )}
          </nav>
          <div className="flex items-center gap-2 text-sm">
            <button
              type="button"
              className="rounded-lg p-2 text-ink-muted transition hover:bg-surface-subtle hover:text-ink dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              onClick={toggle}
              aria-label={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            {!token ? (
              <>
                <Link
                  className="rounded-lg px-3 py-1.5 font-medium text-ink-secondary transition hover:bg-surface-subtle hover:text-ink dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                  to="/login"
                >
                  Login
                </Link>
                <Link
                  className="rounded-lg bg-brand-600 px-3 py-1.5 font-semibold text-white shadow-sm shadow-brand-600/25 transition hover:bg-brand-700"
                  to="/register"
                >
                  Register
                </Link>
              </>
            ) : (
              <>
                <span className="hidden max-w-[200px] truncate text-ink-muted sm:inline dark:text-slate-400">
                  {user?.email}
                </span>
                <button
                  type="button"
                  className="rounded-lg px-2 py-1 font-medium text-ink-secondary hover:bg-surface-subtle hover:text-ink dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                  onClick={() => dispatch(setCredentials(null))}
                >
                  Log out
                </button>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
      <Footer />
    </div>
  );
}

const navCls = ({ isActive }: { isActive: boolean }) =>
  isActive
    ? 'rounded-lg bg-brand-50 px-2 py-1 font-semibold text-brand-900 dark:bg-brand-900/40 dark:text-brand-50'
    : 'rounded-lg px-2 py-1 font-medium text-ink-secondary hover:bg-surface-subtle hover:text-ink dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white';
