import { useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { toast } from 'sonner';
import {
  useJobQuery,
  useApplyMutation,
  useSavedJobsQuery,
  useSaveJobMutation,
  useUnsaveJobMutation,
} from '../store/api';
import { useAppSelector } from '../hooks';
import { getApiErrorMessage } from '../utils/apiError';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';

export function JobDetailPage() {
  const { id = '' } = useParams();
  const { data, isLoading } = useJobQuery(id, { skip: !id });
  const [apply, { isLoading: applying }] = useApplyMutation();
  const [saveJob, { isLoading: saving }] = useSaveJobMutation();
  const [unsaveJob, { isLoading: unsaving }] = useUnsaveJobMutation();
  const nav = useNavigate();
  const { user } = useAppSelector((s) => s.auth);
  const canSave = user?.role === 'candidate' || user?.role === 'admin';
  const { data: savedData } = useSavedJobsQuery(undefined, { skip: !id || !canSave });

  const job = data?.job as
    | {
        _id: string;
        title: string;
        company?: string;
        description?: string;
        skills?: string[];
        status?: string;
        recruiterId?: { _id?: string } | string;
      }
    | undefined;

  const savedIds = useMemo(() => {
    const set = new Set<string>();
    for (const row of savedData?.savedJobs || []) {
      const j = (row as { jobId?: { _id?: string } | string }).jobId;
      if (j && typeof j === 'object' && '_id' in j && j._id) set.add(String(j._id));
      else if (typeof j === 'string') set.add(j);
    }
    return set;
  }, [savedData]);

  const isSaved = id ? savedIds.has(id) : false;

  const recruiterIdStr =
    job?.recruiterId && typeof job.recruiterId === 'object'
      ? job.recruiterId._id?.toString()
      : job?.recruiterId?.toString?.();
  const isOwner = user?.id && recruiterIdStr === user.id;

  async function onApply() {
    if (!id) return;
    try {
      await apply({ jobId: id }).unwrap();
      toast.success('Application submitted');
      nav('/candidate');
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  }

  async function toggleSave() {
    if (!id) return;
    try {
      if (isSaved) {
        await unsaveJob(id).unwrap();
        toast.success('Removed from saved');
      } else {
        await saveJob(id).unwrap();
        toast.success('Job saved');
      }
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  }

  if (isLoading && !job)
    return (
      <div className="max-w-3xl space-y-3">
        <Skeleton className="h-8 w-2/3 rounded-xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );

  if (!job) return <p className="text-ink-muted dark:text-slate-400">Job not found.</p>;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        className="inline-flex text-sm font-semibold text-brand-800 hover:text-brand-900 dark:text-brand-300 dark:hover:text-brand-200"
        to="/jobs"
      >
        ← Back to jobs
      </Link>
      <div className="rounded-3xl border border-surface-line bg-surface/95 p-6 shadow-card ring-1 ring-brand-100/50 dark:border-slate-600 dark:bg-slate-800/95 dark:ring-slate-600/50">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-ink dark:text-slate-50">{job.title}</h1>
            <p className="text-ink-secondary dark:text-slate-300">{job.company}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isOwner || user?.role === 'admin' ? (
              <Badge tone={job.status === 'active' ? 'success' : 'warning'}>{job.status || 'active'}</Badge>
            ) : null}
            {canSave ? (
              <Button
                variant="secondary"
                className="gap-2 shadow-sm"
                onClick={toggleSave}
                disabled={saving || unsaving}
              >
                {isSaved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                {isSaved ? 'Saved' : 'Save job'}
              </Button>
            ) : null}
          </div>
        </div>
        {job.skills?.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {job.skills.map((s) => (
              <span
                key={s}
                className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-900 dark:bg-brand-900/40 dark:text-brand-50"
              >
                {s}
              </span>
            ))}
          </div>
        ) : null}
        <div className="mt-6 border-t border-surface-line pt-6 text-sm leading-relaxed text-ink-secondary whitespace-pre-wrap dark:border-slate-600 dark:text-slate-200">
          {job.description}
        </div>
      </div>
      {(user?.role === 'candidate' || user?.role === 'admin') && job.status === 'active' ? (
        <div className="rounded-3xl border border-brand-100 bg-gradient-to-r from-brand-50/90 via-surface-tint to-white p-6 shadow-card dark:border-brand-800/50 dark:from-brand-900/50 dark:via-slate-800 dark:to-slate-900">
          <h2 className="font-semibold text-ink dark:text-slate-50">Interested in this role?</h2>
          <p className="mt-1 text-sm text-ink-secondary dark:text-slate-300">
            Submit your application using your profile and resume builder—we&apos;ll attach what you&apos;ve saved in
            the builder when no file resume is selected.
          </p>
          <Button className="mt-4 shadow-md shadow-brand-600/20" disabled={applying} onClick={onApply}>
            {applying ? 'Applying…' : 'Apply'}
          </Button>
        </div>
      ) : user?.role === 'recruiter' && !isOwner ? (
        <p className="text-sm text-ink-muted dark:text-slate-400">This view is read-only for recruiters who aren&apos;t the job owner.</p>
      ) : null}
    </div>
  );
}
