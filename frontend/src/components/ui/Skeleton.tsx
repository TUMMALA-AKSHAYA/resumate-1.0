export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-surface-strong/50 dark:bg-slate-700 ${className}`}
      aria-hidden
    />
  );
}
