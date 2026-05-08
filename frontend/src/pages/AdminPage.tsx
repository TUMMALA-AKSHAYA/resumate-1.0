import {
  useAdminDisableMutation,
  useAdminUsersQuery,
  useAdminStatsQuery,
  useAdminJobsQuery,
  useAdminResumesQuery,
  useAdminDeleteJobMutation,
} from '../store/api';
import { toast } from 'sonner';
import { getApiErrorMessage } from '../utils/apiError';
import { Badge } from '../components/ui/Badge';
import { StatCard } from '../components/ui/StatCard';
import { BRAND_TAGLINE } from '../brand';

export function AdminPage() {
  const { data: userData } = useAdminUsersQuery();
  const { data: stats } = useAdminStatsQuery();
  const { data: jobsData, refetch: refetchAdminJobs } = useAdminJobsQuery();
  const { data: resumesData } = useAdminResumesQuery();
  const [toggle] = useAdminDisableMutation();
  const [deleteJob] = useAdminDeleteJobMutation();

  const users = (userData?.users || []) as {
    _id: string;
    email: string;
    role: string;
    disabled?: boolean;
    name?: string;
  }[];

  const jobs = (jobsData?.jobs || []) as {
    _id: string;
    title: string;
    status?: string;
    recruiterId?: { email?: string; name?: string };
  }[];

  const resumes = (resumesData?.resumes || []) as {
    _id: string;
    isActive?: boolean;
    atsScore?: number;
    originalName?: string;
    userId?: { email?: string; name?: string };
  }[];

  async function removeJob(id: string) {
    if (!confirm('Delete this job?')) return;
    try {
      await deleteJob(id).unwrap();
      toast.success('Job deleted');
      refetchAdminJobs();
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  }

  const tableWrap =
    'rounded-2xl border border-surface-line bg-surface shadow-card dark:border-slate-600 dark:bg-slate-800';

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-ink dark:text-slate-50">Admin</h1>
        <p className="mt-1 text-sm font-medium text-brand-800 dark:text-brand-300">{BRAND_TAGLINE}</p>
      </div>

      {stats ? (
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label="Total users" value={stats.totalUsers} />
          <StatCard label="Total jobs" value={stats.totalJobs} />
          {stats.jobsByStatus?.map((r) => (
            <StatCard key={String(r._id)} label={`Jobs (${String(r._id)})`} value={r.count} />
          ))}
        </section>
      ) : null}

      <section className={tableWrap}>
        <h2 className="border-b border-surface-line px-4 py-3 text-lg font-semibold text-ink dark:border-slate-600 dark:text-slate-50">
          Jobs
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-ink-secondary dark:text-slate-200">
            <thead>
              <tr className="border-b border-surface-line text-left text-ink-muted dark:border-slate-600 dark:text-slate-400">
                <th className="p-3">Title</th>
                <th className="p-3">Recruiter</th>
                <th className="p-3">Status</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => (
                <tr key={j._id} className="border-b border-surface-line/80 dark:border-slate-700">
                  <td className="p-3 font-medium text-ink dark:text-slate-100">{j.title}</td>
                  <td className="p-3 text-ink-muted dark:text-slate-400">{j.recruiterId?.email}</td>
                  <td className="p-3">
                    <Badge tone={j.status === 'active' ? 'success' : 'muted'}>{j.status}</Badge>
                  </td>
                  <td className="p-3">
                    <button
                      type="button"
                      className="text-red-600 hover:underline dark:text-red-400"
                      onClick={() => removeJob(j._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!jobs.length && <p className="p-4 text-ink-muted dark:text-slate-400">No jobs.</p>}
        </div>

      </section>

      <section className={tableWrap}>
        <h2 className="border-b border-surface-line px-4 py-3 text-lg font-semibold text-ink dark:border-slate-600 dark:text-slate-50">
          Resumes
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-ink-secondary dark:text-slate-200">
            <thead>
              <tr className="border-b border-surface-line text-left text-ink-muted dark:border-slate-600 dark:text-slate-400">
                <th className="p-3">File</th>
                <th className="p-3">Owner</th>
                <th className="p-3">Active</th>
                <th className="p-3">ATS</th>
              </tr>
            </thead>
            <tbody>
              {resumes.map((r) => (
                <tr key={r._id} className="border-b border-surface-line/80 dark:border-slate-700">
                  <td className="p-3 font-medium text-ink dark:text-slate-100">{r.originalName}</td>
                  <td className="p-3 text-ink-muted dark:text-slate-400">{r.userId?.email}</td>
                  <td className="p-3">{r.isActive === false ? 'no' : 'yes'}</td>
                  <td className="p-3">{r.atsScore ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!resumes.length && <p className="p-4 text-ink-muted dark:text-slate-400">No resumes.</p>}
        </div>
      </section>

      <section className={tableWrap}>
        <h2 className="border-b border-surface-line px-4 py-3 text-lg font-semibold text-ink dark:border-slate-600 dark:text-slate-50">
          Users
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-ink-secondary dark:text-slate-200">
            <thead>
              <tr className="border-b border-surface-line text-left text-ink-muted dark:border-slate-600 dark:text-slate-400">
                <th className="p-3">Email</th>
                <th className="p-3">Role</th>
                <th className="p-3">Status</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="border-b border-surface-line/80 dark:border-slate-700">
                  <td className="p-3 font-medium text-ink dark:text-slate-100">{u.email}</td>
                  <td className="p-3">{u.role}</td>
                  <td className="p-3">{u.disabled ? 'disabled' : 'active'}</td>
                  <td className="p-3">
                    <button
                      type="button"
                      className="font-medium text-brand-700 hover:underline dark:text-brand-400"
                      onClick={() => toggle({ id: u._id, disabled: !u.disabled })}
                    >
                      {u.disabled ? 'Enable' : 'Disable'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
