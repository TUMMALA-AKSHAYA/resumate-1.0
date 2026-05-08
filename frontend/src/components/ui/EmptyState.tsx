import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export function EmptyState({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-surface-strong bg-surface-subtle/80 py-12 text-center dark:border-slate-600 dark:bg-slate-800/50">
      {Icon ? <Icon className="h-10 w-10 text-ink-muted" strokeWidth={1.25} aria-hidden /> : null}
      <p className="font-semibold text-ink dark:text-slate-100">{title}</p>
      {description ? <p className="max-w-sm px-2 text-sm leading-relaxed text-ink-secondary dark:text-slate-300">{description}</p> : null}
      {children}
    </div>
  );
}
