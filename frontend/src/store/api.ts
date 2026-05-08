import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  pages: number;
};

function jobListTags(result: { jobs?: { _id: string }[] } | undefined) {
  if (!result?.jobs?.length) return [{ type: 'Jobs' as const, id: 'LIST' }];
  return [
    ...result.jobs.map((j) => ({ type: 'Jobs' as const, id: j._id })),
    { type: 'Jobs' as const, id: 'LIST' },
  ];
}

function myJobsTags(result: { jobs?: { _id: string }[] } | undefined) {
  if (!result?.jobs?.length) return [{ type: 'Jobs' as const, id: 'MINE' }];
  return [
    ...result.jobs.map((j) => ({ type: 'Jobs' as const, id: j._id })),
    { type: 'Jobs' as const, id: 'MINE' },
  ];
}

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('resumate_token');
      if (token) headers.set('authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Draft', 'Jobs', 'Applications', 'Resumes', 'Users', 'SavedJobs'],
  endpoints: (build) => ({
    login: build.mutation({
      query: (body: { email: string; password: string }) => ({
        url: '/auth/login',
        method: 'POST',
        body,
      }),
    }),
    register: build.mutation({
      query: (body: { email: string; password: string; role: string; name?: string }) => ({
        url: '/auth/register',
        method: 'POST',
        body,
      }),
    }),
    me: build.query<{ user: { id: string; email: string; role: string; name: string } }, void>({
      query: () => '/auth/me',
    }),
    jobs: build.query<{ jobs: unknown[]; pagination: Pagination }, { q?: string; page?: number } | void>({
      query: (arg) => {
        const params = new URLSearchParams();
        const a = arg || {};
        if (a.q?.trim()) params.set('q', a.q.trim());
        if (a.page != null && a.page > 1) params.set('page', String(a.page));
        const qs = params.toString();
        return qs ? `/jobs?${qs}` : '/jobs';
      },
      providesTags: (result) => jobListTags(result as { jobs?: { _id: string }[] }),
    }),
    myJobs: build.query<
      { jobs: unknown[]; pagination: Pagination },
      { status?: string; page?: number } | void
    >({
      query: (arg) => {
        const params = new URLSearchParams();
        const a = arg || {};
        if (a.status) params.set('status', a.status);
        if (a.page != null && a.page > 1) params.set('page', String(a.page));
        const qs = params.toString();
        return qs ? `/jobs/mine?${qs}` : '/jobs/mine';
      },
      providesTags: (result) => myJobsTags(result as { jobs?: { _id: string }[] }),
    }),
    job: build.query<{ job: unknown }, string>({
      query: (id) => `/jobs/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Jobs', id }],
    }),
    createJob: build.mutation({
      query: (body: Record<string, unknown>) => ({ url: '/jobs', method: 'POST', body }),
      invalidatesTags: [{ type: 'Jobs', id: 'LIST' }, { type: 'Jobs', id: 'MINE' }],
    }),
    updateJob: build.mutation({
      query: ({ id, body }: { id: string; body: Record<string, unknown> }) => ({
        url: `/jobs/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'Jobs', id: arg.id },
        { type: 'Jobs', id: 'LIST' },
        { type: 'Jobs', id: 'MINE' },
      ],
    }),
    patchJobStatus: build.mutation<{ job: unknown }, { id: string; status: string }>({
      query: ({ id, status }) => ({
        url: `/jobs/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'Jobs', id: arg.id },
        { type: 'Jobs', id: 'LIST' },
        { type: 'Jobs', id: 'MINE' },
      ],
    }),
    deleteJob: build.mutation<{ ok: boolean }, string>({
      query: (id) => ({ url: `/jobs/${id}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'Jobs', id },
        { type: 'Jobs', id: 'LIST' },
        { type: 'Jobs', id: 'MINE' },
      ],
    }),
    applicationsMine: build.query<{ applications: unknown[] }, void>({
      query: () => '/applications/me',
      providesTags: ['Applications'],
    }),
    applicationsForJob: build.query<{ applications: unknown[] }, string>({
      query: (jobId) => `/applications/job/${jobId}`,
      providesTags: (_r, _e, id) => [{ type: 'Applications', id }],
    }),
    apply: build.mutation({
      query: (body: { jobId: string; resumeDocumentId?: string }) => ({
        url: '/applications',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Applications'],
    }),
    updateApplicationStatus: build.mutation({
      query: ({ id, status }: { id: string; status: string }) => ({
        url: `/applications/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: ['Applications'],
    }),
    resumes: build.query<{ resumes: unknown[] }, void>({
      query: () => '/resumes',
      providesTags: ['Resumes'],
    }),
    parseResume: build.mutation({
      query: (id: string) => ({ url: `/resumes/${id}/parse`, method: 'POST' }),
      invalidatesTags: ['Resumes'],
    }),
    atsResume: build.mutation({
      query: ({ id, jobId }: { id: string; jobId?: string }) => ({
        url: `/resumes/${id}/ats`,
        method: 'POST',
        body: { jobId },
      }),
      invalidatesTags: ['Resumes'],
    }),
    analyzeResume: build.mutation({
      query: ({ id, jobId }: { id: string; jobId?: string }) => ({
        url: `/resumes/${id}/analyze`,
        method: 'POST',
        body: jobId ? { jobId } : {},
      }),
      invalidatesTags: ['Resumes'],
    }),
    patchResumeActive: build.mutation({
      query: ({ id, isActive }: { id: string; isActive: boolean }) => ({
        url: `/resumes/${id}/active`,
        method: 'PATCH',
        body: { isActive },
      }),
      invalidatesTags: ['Resumes'],
    }),
    hydrateDraft: build.mutation({
      query: (id: string) => ({ url: `/resumes/${id}/hydrate-draft`, method: 'POST' }),
      invalidatesTags: ['Draft', 'Resumes'],
    }),
    draft: build.query<{ draft: Record<string, unknown> }, void>({
      query: () => '/drafts',
      providesTags: ['Draft'],
    }),
    saveDraft: build.mutation({
      query: (body: Record<string, unknown>) => ({ url: '/drafts', method: 'PUT', body }),
      invalidatesTags: ['Draft'],
    }),
    assist: build.mutation({
      query: (body: { assist_type: string; text: string; job_description?: string }) => ({
        url: '/drafts/assist',
        method: 'POST',
        body,
      }),
    }),
    matchJobs: build.query<{ results: { job?: unknown; score?: number; id?: string }[] }, void>({
      query: () => '/match/jobs',
    }),
    savedJobs: build.query<{ savedJobs: unknown[]; pagination: Pagination }, { page?: number } | void>({
      query: (arg) => {
        const params = new URLSearchParams();
        if (arg && arg.page != null && arg.page > 1) params.set('page', String(arg.page));
        const qs = params.toString();
        return qs ? `/saved-jobs?${qs}` : '/saved-jobs';
      },
      providesTags: ['SavedJobs'],
    }),
    saveJob: build.mutation<{ savedJob: unknown }, string>({
      query: (jobId) => ({ url: '/saved-jobs', method: 'POST', body: { jobId } }),
      invalidatesTags: ['SavedJobs'],
    }),
    unsaveJob: build.mutation<{ ok: boolean }, string>({
      query: (jobId) => ({ url: `/saved-jobs/${jobId}`, method: 'DELETE' }),
      invalidatesTags: ['SavedJobs'],
    }),
    adminUsers: build.query<{ users: unknown[] }, void>({
      query: () => '/admin/users',
      providesTags: ['Users'],
    }),
    adminDisable: build.mutation({
      query: ({ id, disabled }: { id: string; disabled: boolean }) => ({
        url: `/admin/users/${id}/disable`,
        method: 'PATCH',
        body: { disabled },
      }),
      invalidatesTags: ['Users'],
    }),
    adminStats: build.query<
      {
        usersByRole: { _id: string; count: number }[];
        jobsByStatus: { _id: string; count: number }[];
        totalUsers: number;
        totalJobs: number;
      },
      void
    >({
      query: () => '/admin/stats',
    }),
    adminJobs: build.query<
      { jobs: unknown[]; pagination: Pagination },
      { status?: string; page?: number } | void
    >({
      query: (arg) => {
        const params = new URLSearchParams();
        const a = arg || {};
        if (a.status) params.set('status', a.status);
        if (a.page != null && a.page > 1) params.set('page', String(a.page));
        const qs = params.toString();
        return qs ? `/admin/jobs?${qs}` : '/admin/jobs';
      },
    }),
    adminResumes: build.query<{ resumes: unknown[]; pagination: Pagination }, { page?: number } | void>({
      query: (arg) => {
        const params = new URLSearchParams();
        if (arg && arg.page != null && arg.page > 1) params.set('page', String(arg.page));
        const qs = params.toString();
        return qs ? `/admin/resumes?${qs}` : '/admin/resumes';
      },
    }),
    adminDeleteJob: build.mutation<{ ok: boolean }, string>({
      query: (id) => ({ url: `/admin/jobs/${id}`, method: 'DELETE' }),
      invalidatesTags: [
        { type: 'Jobs', id: 'LIST' },
        { type: 'Jobs', id: 'MINE' },
        'SavedJobs',
      ],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useMeQuery,
  useJobsQuery,
  useMyJobsQuery,
  useJobQuery,
  useCreateJobMutation,
  useUpdateJobMutation,
  usePatchJobStatusMutation,
  useDeleteJobMutation,
  useApplicationsMineQuery,
  useApplicationsForJobQuery,
  useApplyMutation,
  useUpdateApplicationStatusMutation,
  useResumesQuery,
  useParseResumeMutation,
  useAtsResumeMutation,
  useAnalyzeResumeMutation,
  usePatchResumeActiveMutation,
  useHydrateDraftMutation,
  useDraftQuery,
  useSaveDraftMutation,
  useAssistMutation,
  useMatchJobsQuery,
  useSavedJobsQuery,
  useSaveJobMutation,
  useUnsaveJobMutation,
  useAdminUsersQuery,
  useAdminDisableMutation,
  useAdminStatsQuery,
  useAdminJobsQuery,
  useAdminResumesQuery,
  useAdminDeleteJobMutation,
} = api;
