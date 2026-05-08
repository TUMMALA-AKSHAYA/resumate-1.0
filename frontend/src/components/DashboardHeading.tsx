import { BRAND_TAGLINE } from '../brand';

export function DashboardHeading({ title }: { title: string }) {
  return (
    <div className="space-y-1">
      <h1 className="text-2xl font-bold tracking-tight text-ink dark:text-slate-50">{title}</h1>
      <p className="text-sm font-medium text-brand-800 dark:text-brand-300">{BRAND_TAGLINE}</p>
    </div>
  );
}
