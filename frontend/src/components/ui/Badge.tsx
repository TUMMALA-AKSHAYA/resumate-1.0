import type { ReactNode } from 'react';

const tones: Record<string, string> = {
  default: 'bg-surface-subtle text-ink-secondary ring-1 ring-surface-line dark:bg-slate-700 dark:text-slate-200 dark:ring-slate-600',
  success:
    'bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-200 dark:ring-emerald-800',
  warning:
    'bg-amber-50 text-amber-950 ring-1 ring-amber-200 dark:bg-amber-950/50 dark:text-amber-100 dark:ring-amber-800',
  muted:
    'bg-slate-200 text-ink-secondary ring-1 ring-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:ring-slate-600',
};

export function Badge({
  tone = 'default',
  children,
}: {
  tone?: keyof typeof tones;
  children: ReactNode;
}) {
  return (
    <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${tones[tone]}`}>{children}</span>
  );
}
