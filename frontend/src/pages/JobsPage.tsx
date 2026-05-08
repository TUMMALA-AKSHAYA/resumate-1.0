import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, MapPin, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { useJobsQuery, useApplyMutation } from '../store/api';
import { useAppSelector } from '../hooks';
import { getApiErrorMessage } from '../utils/apiError';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { DashboardHeading } from '../components/DashboardHeading';

export function JobsPage() {
  const [q, setQ] = useState('');
  const arg = useMemo(() => (q.trim() ? { q: q.trim() } : undefined), [q]);
  const { data, isFetching, isLoading } = useJobsQuery(arg, { refetchOnMountOrArgChange: true });
  const [apply, { isLoading: applying }] = useApplyMutation();
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);
  const nav = useNavigate();
  const { user } = useAppSelector((s) => s.auth);

  const jobs = (data?.jobs || []) as {
    _id: string;
    title: string;
    company?: string;
    location?: string;
    skills?: string[];
  }[];
  const pagination = data?.pagination;

  const canApply = user?.role === 'candidate' || user?.role === 'admin';

  async function onApply(jobId: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!canApply) return;
    setApplyingJobId(jobId);
    try {
      await apply({ jobId }).unwrap();
      toast.success('Application submitted');
      nav('/candidate');
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setApplyingJobId(null);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <DashboardHeading title="Jobs" />
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <input
            className="w-full rounded-xl border border-surface-line bg-white py-2.5 pl-10 pr-3 text-sm text-ink shadow-sm transition placeholder:text-ink-muted focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-brand-800"
            placeholder="Search roles…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      {pagination ? (
        <p className="text-xs font-medium text-ink-muted dark:text-slate-400">
          Page {pagination.page} of {pagination.pages} · {pagination.total} open roles
        </p>
      ) : null}

      {isLoading || (isFetching && !jobs.length) ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-44 w-full rounded-2xl" />
          <Skeleton className="h-44 w-full rounded-2xl" />
          <Skeleton className="h-44 w-full rounded-2xl" />
        </div>
      ) : !jobs.length ? (
        <EmptyState title="No jobs found" description="Try another keyword or check back soon." />
      ) : (
        <motion.ul
          className="grid gap-4 sm:grid-cols-2"
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.05 } } }}
        >
          {jobs.map((j) => (
            <motion.li
              key={j._id}
              variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
            >
              <Card className="flex h-full flex-col justify-between transition hover:shadow-md hover:shadow-soft">
                <div className="space-y-3">
                  <div>
                    <Link
                      to={`/jobs/${j._id}`}
                      className="text-lg font-semibold text-ink transition hover:text-brand-700 dark:text-slate-50 dark:hover:text-brand-300"
                    >
                      {j.title}
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-ink-muted dark:text-slate-400">
                      {j.company ? (
                        <span className="inline-flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
                          {j.company}
                        </span>
                      ) : null}
                      {j.location ? (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
                          {j.location}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  {j.skills?.length ? (
                    <div className="flex flex-wrap gap-1.5">
                      {j.skills.slice(0, 4).map((s) => (
                        <span
                          key={s}
                          className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-900 dark:bg-brand-900/40 dark:text-brand-50"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="mt-5 flex flex-wrap gap-2 border-t border-surface-line pt-4 dark:border-slate-600">
                  {canApply ? (
                    <button
                      type="button"
                      disabled={applying && applyingJobId === j._id}
                      onClick={(e) => onApply(j._id, e)}
                      className="inline-flex flex-1 items-center justify-center rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand-600/20 transition hover:bg-brand-700 disabled:opacity-60 sm:flex-none"
                    >
                      {applying && applyingJobId === j._id ? 'Applying…' : 'Apply'}
                    </button>
                  ) : null}
                  <Link
                    to={`/jobs/${j._id}`}
                    className={`inline-flex flex-1 items-center justify-center rounded-xl border border-surface-line bg-surface-subtle px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-brand-200 hover:bg-white sm:flex-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 ${!canApply ? 'flex-1' : ''}`}
                  >
                    View role
                  </Link>
                </div>
              </Card>
            </motion.li>
          ))}
        </motion.ul>
      )}
    </div>
  );
}
