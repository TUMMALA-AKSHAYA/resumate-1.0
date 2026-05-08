import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, LayoutDashboard } from 'lucide-react';
import { toast } from 'sonner';
import {
  useApplicationsForJobQuery,
  useCreateJobMutation,
  useMyJobsQuery,
  usePatchJobStatusMutation,
  useUpdateApplicationStatusMutation,
} from '../store/api';
import { downloadResume } from '../utils/download';
import { getApiErrorMessage } from '../utils/apiError';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { StatCard } from '../components/ui/StatCard';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { DashboardHeading } from '../components/DashboardHeading';

type JobRow = { _id: string; title: string; company?: string; status?: string };

const tabs = [
  { id: 'jobs', label: 'Posted jobs' },
  { id: 'applicants', label: 'Applicants' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'interviews', label: 'Interviews' },
] as const;

type TabId = (typeof tabs)[number]['id'];

function statusTone(s: string) {
  if (s === 'active') return 'success' as const;
  if (s === 'draft') return 'warning' as const;
  return 'muted' as const;
}

export function RecruiterDashboard() {
  const [tab, setTab] = useState<TabId>('jobs');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const { data, isFetching, refetch } = useMyJobsQuery(statusFilter ? { status: statusFilter } : undefined, {
    refetchOnMountOrArgChange: true,
  });
  const jobs = (data?.jobs || []) as JobRow[];
  const [selected, setSelected] = useState<string | null>(null);
  const { data: appsData, isFetching: appsLoading, refetch: refetchApps } = useApplicationsForJobQuery(selected!, {
    skip: !selected,
  });
  const [createJob, { isLoading: creating }] = useCreateJobMutation();
  const [patchStatus] = usePatchJobStatusMutation();
  const [updateStatus] = useUpdateApplicationStatusMutation();

  const [form, setForm] = useState({
    title: '',
    company: '',
    description: '',
    skills: '',
    createAs: 'draft' as 'draft' | 'active',
  });

  const statusCounts = useMemo(() => {
    const m: Record<string, number> = { draft: 0, active: 0, closed: 0 };
    for (const j of jobs) {
      const s = j.status || 'active';
      m[s] = (m[s] || 0) + 1;
    }
    return Object.entries(m).map(([name, count]) => ({ name, count }));
  }, [jobs]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createJob({
        title: form.title,
        company: form.company,
        description: form.description,
        skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
        status: form.createAs,
      }).unwrap();
      toast.success(form.createAs === 'active' ? 'Job published' : 'Draft saved');
      setForm({ title: '', company: '', description: '', skills: '', createAs: 'draft' });
      refetch();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  async function setJobStatus(id: string, status: string) {
    try {
      await patchStatus({ id, status }).unwrap();
      toast.success('Status updated');
      refetch();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <LayoutDashboard className="mt-1 h-8 w-8 shrink-0 text-brand-600 dark:text-brand-400" strokeWidth={1.75} />
          <DashboardHeading title="Recruiter dashboard" />
        </div>
        <Link
          className="text-sm font-semibold text-brand-800 hover:text-brand-900 dark:text-brand-300 dark:hover:text-brand-200"
          to="/jobs"
        >
          Browse job board →
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-surface-line pb-2 dark:border-slate-600">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === t.id
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-ink-secondary hover:bg-surface-subtle dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'jobs' && (
          <motion.div
            key="jobs"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="space-y-6"
          >
            <Card>
              <h2 className="mb-4 font-semibold text-ink dark:text-slate-50">Post a job</h2>
              <form onSubmit={onCreate} className="grid gap-3 md:grid-cols-2">
                <input
                  className="form-input"
                  placeholder="Title"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  required
                />
                <input
                  className="form-input"
                  placeholder="Company"
                  value={form.company}
                  onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                />
                <textarea
                  className="form-input md:col-span-2 min-h-[100px]"
                  placeholder="Description"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  required
                />
                <input
                  className="form-input md:col-span-2"
                  placeholder="Skills (comma separated)"
                  value={form.skills}
                  onChange={(e) => setForm((f) => ({ ...f, skills: e.target.value }))}
                />
                <label className="md:col-span-2 flex flex-wrap items-center gap-2 text-sm text-ink-secondary dark:text-slate-300">
                  Publish as
                  <select
                    className="form-input px-2 py-1 text-sm"
                    value={form.createAs}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, createAs: e.target.value as 'draft' | 'active' }))
                    }
                  >
                    <option value="draft">Draft (not on public board)</option>
                    <option value="active">Active (visible to candidates)</option>
                  </select>
                </label>
                <Button type="submit" disabled={creating} className="md:col-span-2 w-full sm:w-auto">
                  {creating ? 'Saving…' : 'Save job'}
                </Button>
              </form>
            </Card>

            <Card>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-semibold text-ink dark:text-slate-50">Your jobs</h2>
                <select
                  className="form-input py-1 text-sm"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All statuses</option>
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              {isFetching && !jobs.length ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : !jobs.length ? (
                <EmptyState
                  icon={Briefcase}
                  title="No jobs yet"
                  description="Create a draft or publish an active role to start receiving applications."
                />
              ) : (
                <ul className="divide-y divide-surface-line dark:divide-slate-700">
                  {jobs.map((j) => (
                    <li key={j._id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                      <div>
                        <button
                          type="button"
                          className="text-left font-medium text-brand-800 hover:underline dark:text-brand-300"
                          onClick={() => {
                            setSelected(j._id);
                            setTab('applicants');
                          }}
                        >
                          {j.title}
                        </button>
                        <div className="text-sm text-ink-muted dark:text-slate-400">{j.company}</div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={statusTone(j.status || 'active')}>{j.status || 'active'}</Badge>
                        <select
                          className="form-input py-1 text-xs"
                          value={j.status || 'active'}
                          onChange={(e) => setJobStatus(j._id, e.target.value)}
                        >
                          <option value="draft">draft</option>
                          <option value="active">active</option>
                          <option value="closed">closed</option>
                        </select>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </motion.div>
        )}

        {tab === 'applicants' && (
          <motion.div
            key="apps"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="grid gap-6 md:grid-cols-2"
          >
            <Card>
              <h2 className="mb-2 font-semibold text-ink dark:text-slate-50">Select a job</h2>
              <ul className="max-h-72 space-y-1 overflow-y-auto text-sm">
                {jobs.map((j) => (
                  <li key={j._id}>
                    <button
                      type="button"
                      className={`w-full rounded px-2 py-1.5 text-left text-ink dark:text-slate-100 ${
                        selected === j._id
                          ? 'bg-brand-50 dark:bg-brand-900/35'
                          : 'hover:bg-surface-subtle dark:hover:bg-slate-800'
                      }`}
                      onClick={() => setSelected(j._id)}
                    >
                      {j.title}{' '}
                      <span className="text-ink-muted dark:text-slate-400">{j.company}</span>
                    </button>
                  </li>
                ))}
                {!jobs.length && <p className="text-ink-muted dark:text-slate-400">No jobs.</p>}
              </ul>
            </Card>
            <Card>
              <h2 className="mb-2 font-semibold text-ink dark:text-slate-50">Applications</h2>
              {!selected ? (
                <p className="text-sm text-ink-muted dark:text-slate-400">Choose a job to view applicants.</p>
              ) : appsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : (
                <ul className="max-h-96 space-y-3 overflow-y-auto text-sm">
                  {(appsData?.applications || []).map((a: unknown) => {
                    const row = a as {
                      _id: string;
                      matchScore?: number;
                      status: string;
                      candidateId?: { email?: string; name?: string };
                      resumeDocumentId?: { originalName?: string; _id?: string };
                    };
                    return (
                      <li key={row._id} className="rounded-lg border border-surface-line bg-surface-subtle/50 p-3 dark:border-slate-600 dark:bg-slate-900/40">
                        <div className="flex justify-between gap-2">
                          <span className="font-medium text-ink dark:text-slate-100">{row.candidateId?.email}</span>
                          <span className="text-ink-muted dark:text-slate-400">
                            {row.matchScore != null ? `${row.matchScore}%` : '—'}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="text-ink-muted dark:text-slate-400">{row.status}</span>
                          {row.resumeDocumentId?._id && (
                            <button
                              type="button"
                              className="text-xs font-semibold text-brand-800 underline hover:text-brand-900 dark:text-brand-300"
                              onClick={() =>
                                downloadResume(
                                  row.resumeDocumentId!._id!,
                                  row.resumeDocumentId?.originalName || 'resume'
                                )
                              }
                            >
                              Download resume
                            </button>
                          )}
                          <select
                            className="form-input py-1 text-xs"
                            value={row.status}
                            onChange={(e) =>
                              updateStatus({ id: row._id, status: e.target.value }).then(() => refetchApps())
                            }
                          >
                            <option value="submitted">submitted</option>
                            <option value="shortlisted">shortlisted</option>
                            <option value="rejected">rejected</option>
                          </select>
                        </div>
                      </li>
                    );
                  })}
                  {selected && !appsData?.applications?.length && (
                    <li className="text-ink-muted dark:text-slate-400">No applications for this job.</li>
                  )}
                </ul>
              )}
            </Card>
          </motion.div>
        )}

        {tab === 'analytics' && (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid gap-6 md:grid-cols-2"
          >
            <StatCard label="Total postings" value={jobs.length} />
            <StatCard
              label="Active"
              value={jobs.filter((j) => j.status === 'active').length}
            />
            <Card className="md:col-span-2">
              <h3 className="mb-3 text-sm font-medium text-ink-secondary dark:text-slate-300">Jobs by status</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusCounts}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: 8,
                        color: '#0f172a',
                      }}
                    />
                    <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </motion.div>
        )}

        {tab === 'interviews' && (
          <motion.div key="interviews" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card>
              <h2 className="font-semibold text-ink dark:text-slate-50">Interviews</h2>
              <p className="mt-2 text-sm text-ink-secondary dark:text-slate-300">
                Scheduling and interview pipelines are planned for Phase 2. For now, track shortlisted candidates in
                the Applicants tab and follow up by email.
              </p>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
