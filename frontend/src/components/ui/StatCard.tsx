import type { ReactNode } from 'react';

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-surface-line bg-surface p-5 shadow-card dark:border-slate-600 dark:bg-slate-800">
      <div className="text-xs font-semibold uppercase tracking-wide text-ink-muted dark:text-slate-400">
        {label}
      </div>
      <div className="mt-1.5 text-2xl font-bold text-ink dark:text-slate-50">{value}</div>
      {hint ? <div className="mt-1 text-xs text-ink-muted dark:text-slate-400">{hint}</div> : null}
    </div>
  );
}
