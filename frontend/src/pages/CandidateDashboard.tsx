import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bookmark, FileText, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import {
  useApplicationsMineQuery,
  useMatchJobsQuery,
  useResumesQuery,
  useSavedJobsQuery,
  useUnsaveJobMutation,
} from '../store/api';
import { getApiErrorMessage } from '../utils/apiError';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { DashboardHeading } from '../components/DashboardHeading';

type ResumeRow = {
  _id: string;
  originalName: string;
  atsScore?: number;
  isActive?: boolean;
  lastAnalysis?: {
    ats?: { score?: number; missing_keywords?: string[]; suggestions?: string[] };
    skill_match_score?: number;
  };
};

type SavedRow = {
  _id: string;
  jobId?: { _id?: string; title?: string; company?: string } | null;
};

export function CandidateDashboard() {
  const { data: apps, isFetching: appsLoading } = useApplicationsMineQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const { data: resumes, isFetching: resLoading } = useResumesQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const { data: rec, isFetching: recLoading } = useMatchJobsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const { data: savedData, isFetching: savedLoading } = useSavedJobsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const [unsave] = useUnsaveJobMutation();

  const resumeList = (resumes?.resumes || []) as ResumeRow[];
  const chartData = resumeList
    .filter((r) => typeof r.atsScore === 'number')
    .map((r) => ({ name: r.originalName.slice(0, 14), score: r.atsScore }));

  const latestWithAnalysis = resumeList.find((r) => r.lastAnalysis);
  const latestAnalysis = latestWithAnalysis?.lastAnalysis;
  const ats = latestAnalysis?.ats;
  const skillMatch = latestAnalysis?.skill_match_score;

  async function handleUnsave(jobId: string) {
    try {
      await unsave(jobId).unwrap();
      toast.success('Removed from saved');
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  }

  const savedJobs = (savedData?.savedJobs || []) as SavedRow[];

  return (
    <div className="space-y-8">
      <motion.div
        className="flex flex-wrap items-start justify-between gap-4"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <DashboardHeading title="Candidate dashboard" />
        <div className="flex flex-wrap gap-2">
          <Link
            to="/builder"
            className="inline-flex items-center justify-center rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-brand-600/20 transition hover:bg-brand-700"
          >
            Resume builder
          </Link>
          <Link
            to="/resumes/upload"
            className="inline-flex items-center justify-center rounded-xl border border-surface-line bg-surface px-4 py-2 text-sm font-semibold text-ink shadow-sm transition hover:border-brand-200 hover:bg-surface-tint dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          >
            Upload resume
          </Link>
        </div>
      </motion.div>

      <section className="grid gap-6 md:grid-cols-2">
        <Card>
          <h2 className="mb-3 flex items-center gap-2 font-semibold text-ink dark:text-slate-50">
            <Sparkles className="h-4 w-4 text-amber-500" />
            Resume match score
          </h2>
          {resLoading ? (
            <Skeleton className="h-40 w-full rounded-xl" />
          ) : ats || skillMatch != null ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 text-sm">
              {skillMatch != null ? (
                <div className="flex items-center gap-2">
                  <span className="text-ink-secondary dark:text-slate-300">Skill match (latest run)</span>
                  <Badge tone="success">{`${Math.round(Number(skillMatch))}%`}</Badge>
                </div>
              ) : null}
              <div className="flex items-center gap-2">
                <span className="text-ink-secondary dark:text-slate-300">ATS score</span>
                <Badge tone="success">{ats?.score != null ? `${ats.score}/100` : '—'}</Badge>
              </div>
              {ats && Array.isArray(ats.missing_keywords) && ats.missing_keywords.length ? (
                <div>
                  <div className="text-xs font-medium uppercase text-ink-muted dark:text-slate-400">Missing keywords</div>
                  <p className="mt-1 text-ink-secondary dark:text-slate-300">{ats.missing_keywords.slice(0, 12).join(', ')}</p>
                </div>
              ) : null}
              {ats && Array.isArray(ats.suggestions) && ats.suggestions.length ? (
                <div>
                  <div className="text-xs font-medium uppercase text-ink-muted dark:text-slate-400">Suggestions</div>
                  <ul className="mt-1 list-disc pl-4 text-ink-secondary dark:text-slate-300">
                    {ats.suggestions.slice(0, 5).map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <Link
                className="inline-block text-sm font-semibold text-brand-800 hover:text-brand-900 dark:text-brand-300 dark:hover:text-brand-200"
                to="/resumes/upload"
              >
                Run full analysis on uploads →
              </Link>
            </motion.div>
          ) : (
            <EmptyState
              icon={FileText}
              title="No analysis yet"
              description="Upload a resume and run AI analysis to see ATS score, keywords, and suggestions."
            />
          )}
        </Card>

        <Card>
          <h2 className="mb-3 font-semibold text-ink dark:text-slate-100">ATS scores by file</h2>
          {resLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : chartData.length ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="currentColor" className="text-xs" tick={{ fontSize: 10 }} />
                  <YAxis stroke="currentColor" domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      background: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: 8,
                      color: '#0f172a',
                    }}
                  />
                  <Bar dataKey="score" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-ink-muted dark:text-slate-400">Upload and run ATS on a resume to see scores here.</p>
          )}
        </Card>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-semibold text-ink dark:text-slate-100">Recommended jobs</h2>
          {recLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            <ul className="space-y-2 text-sm">
              {(rec?.results || []).slice(0, 8).map((r) => (
                <li key={String(r.id)} className="flex justify-between gap-2">
                  <Link
                    className="font-semibold text-brand-800 hover:text-brand-900 dark:text-brand-300 dark:hover:text-brand-200"
                    to={`/jobs/${r.id}`}
                  >
                    {(r.job as { title?: string })?.title || 'Job'}
                  </Link>
                  <span className="text-ink-muted dark:text-slate-400">{r.score != null ? `${r.score}%` : ''}</span>
                </li>
              ))}
              {!rec?.results?.length && (
                <li className="text-ink-muted dark:text-slate-400">Complete your builder or parse a resume for matches.</li>
              )}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="mb-3 flex items-center gap-2 font-semibold text-ink dark:text-slate-100">
            <Bookmark className="h-4 w-4 text-brand-600 dark:text-brand-400" />
            Saved jobs
          </h2>
          {savedLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : (
            <ul className="space-y-2 text-sm">
              {savedJobs.map((s) => {
                const j = s.jobId;
                const jid = j && typeof j === 'object' && '_id' in j ? String((j as { _id?: string })._id) : '';
                if (!jid || !j) return null;
                return (
                  <li key={s._id} className="flex items-center justify-between gap-2">
                    <Link
                      className="font-semibold text-brand-800 hover:text-brand-900 dark:text-brand-300 dark:hover:text-brand-200"
                      to={`/jobs/${jid}`}
                    >
                      {(j as { title?: string }).title}
                    </Link>
                    <button
                      type="button"
                      className="rounded-lg px-2 py-1 text-xs font-medium text-ink-secondary transition hover:bg-surface-subtle dark:text-slate-300 dark:hover:bg-slate-700"
                      onClick={() => handleUnsave(jid)}
                    >
                      Remove
                    </button>
                  </li>
                );
              })}
              {!savedJobs.length && (
                <li className="text-ink-muted dark:text-slate-400">Save roles from the job board to track them here.</li>
              )}
            </ul>
          )}
        </Card>
      </section>

      <section className="rounded-2xl border border-surface-line bg-surface/95 p-5 shadow-card ring-1 ring-brand-100/40 dark:border-slate-600 dark:bg-slate-800/95 dark:ring-slate-600/40">
        <h2 className="mb-3 font-semibold text-ink dark:text-slate-50">Applied jobs</h2>
        {appsLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : (
          <ul className="divide-y divide-surface-line text-sm dark:divide-slate-600">
            {(apps?.applications || []).map((a: unknown) => {
              const app = a as {
                _id: string;
                status: string;
                matchScore?: number;
                jobId?: { title?: string; company?: string; _id?: string };
              };
              return (
                <li key={app._id} className="flex justify-between gap-2 py-2">
                  <Link
                    className="font-semibold text-brand-800 hover:text-brand-900 dark:text-brand-300 dark:hover:text-brand-200"
                    to={app.jobId?._id ? `/jobs/${app.jobId._id}` : '/jobs'}
                  >
                    {app.jobId?.title}{' '}
                    <span className="font-normal text-ink-muted dark:text-slate-400">{app.jobId?.company}</span>
                  </Link>
                  <span className="text-ink-muted dark:text-slate-400">
                    {app.status}
                    {app.matchScore != null ? ` · ${app.matchScore}%` : ''}
                  </span>
                </li>
              );
            })}
            {!apps?.applications?.length && (
              <li className="py-2 text-ink-muted dark:text-slate-400">No applications yet.</li>
            )}
          </ul>
        )}
      </section>
    </div>
  );
}
