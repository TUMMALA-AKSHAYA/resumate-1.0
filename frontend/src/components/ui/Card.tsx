import type { ReactNode } from 'react';

export function Card({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-surface-line bg-surface p-5 shadow-card dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 ${className}`}
    >
      {children}
    </div>
  );
}
