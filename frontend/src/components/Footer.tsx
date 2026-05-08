import { BRAND_NAME, BRAND_TAGLINE } from '../brand';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-surface-line bg-white/90 py-8 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/90">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 text-center sm:flex-row sm:justify-between sm:text-left">
        <div>
          <div className="font-semibold text-ink dark:text-slate-100">{BRAND_NAME}</div>
          <div className="text-sm font-medium text-brand-800 dark:text-brand-300">{BRAND_TAGLINE}</div>
        </div>
        <p className="max-w-md text-xs text-ink-muted dark:text-slate-400">
          Build, analyze, and connect—without losing momentum in your hiring or job search.
        </p>
      </div>
    </footer>
  );
}
