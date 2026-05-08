import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  useResumesQuery,
  useParseResumeMutation,
  useHydrateDraftMutation,
  useAnalyzeResumeMutation,
  usePatchResumeActiveMutation,
} from '../store/api';
import { getApiErrorMessage } from '../utils/apiError';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

type ResumeRow = {
  _id: string;
  originalName: string;
  atsScore?: number;
  isActive?: boolean;
  parsedData?: unknown;
  lastAnalysis?: { ats?: { score?: number }; parsed?: unknown };
};

export function ResumeUploadPage() {
  const nav = useNavigate();
  const { data, refetch, isFetching } = useResumesQuery();
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [parse] = useParseResumeMutation();
  const [hydrate] = useHydrateDraftMutation();
  const [analyze] = useAnalyzeResumeMutation();
  const [patchActive] = usePatchResumeActiveMutation();
  const resumes = (data?.resumes || []) as ResumeRow[];

  async function upload() {
    if (!file) return;
    setBusy(true);
    try {
      const token = localStorage.getItem('resumate_token');
      const fd = new FormData();
      fd.append('file', file);
      const r = await fetch(`${API}/resumes/upload`, {
        method: 'POST',
        headers: token ? { authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      if (!r.ok) {
        const j = (await r.json().catch(() => ({}))) as { error?: { message?: string } | string };
        const msg =
          typeof j.error === 'object' && j.error && 'message' in j.error
            ? String(j.error.message)
            : typeof j.error === 'string'
              ? j.error
              : `Upload failed (${r.status})`;
        throw new Error(msg);
      }
      toast.success('Resume uploaded');
      await refetch();
      setFile(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  }

  async function runAnalyze(id: string) {
    setAnalyzingId(id);
    try {
      await analyze({ id }).unwrap();
      toast.success('Analysis complete');
      await refetch();
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    } finally {
      setAnalyzingId(null);
    }
  }

  async function toggleActive(r: ResumeRow) {
    try {
      await patchActive({ id: r._id, isActive: !r.isActive }).unwrap();
      toast.success(r.isActive === false ? 'Resume activated' : 'Resume deactivated');
      refetch();
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  }

  async function sendBuilder(id: string) {
    try {
      await hydrate(id).unwrap();
      toast.success('Draft updated — opening builder', { duration: 2000 });
      nav('/builder');
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink dark:text-slate-50">Upload resume</h1>
        <p className="mt-1 text-sm text-ink-secondary dark:text-slate-300">
          Parse, run full AI analysis, then send structured data to the resume builder.
        </p>
      </div>
      <Card className="flex flex-wrap items-center gap-3">
        <input type="file" accept=".pdf,.docx" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        <Button disabled={!file || busy} onClick={upload}>
          {busy ? 'Uploading…' : 'Upload'}
        </Button>
      </Card>

      {isFetching && !resumes.length ? (
        <p className="text-sm text-ink-muted dark:text-slate-400">Loading resumes…</p>
      ) : null}

      <ul className="space-y-3 text-sm">
        <AnimatePresence initial={false}>
          {resumes.map((r) => (
            <motion.li
              key={r._id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-lg border border-surface-line bg-surface p-4 shadow-sm dark:border-slate-600 dark:bg-slate-800"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-medium text-ink dark:text-slate-100">{r.originalName}</div>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-ink-muted dark:text-slate-400">
                    <span>ATS: {r.atsScore != null ? r.atsScore : '—'}</span>
                    {r.parsedData ? <Badge tone="success">Parsed</Badge> : <Badge tone="warning">Not parsed</Badge>}
                    <Badge tone={r.isActive === false ? 'muted' : 'success'}>
                      {r.isActive === false ? 'Inactive' : 'Active'}
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    className="px-2 py-1 text-xs"
                    onClick={() => toggleActive(r)}
                  >
                    {r.isActive === false ? 'Activate' : 'Deactivate'}
                  </Button>
                  <Button
                    variant="secondary"
                    className="px-2 py-1 text-xs"
                    onClick={() => parse(r._id).then(() => refetch())}
                  >
                    Parse
                  </Button>
                  <Button
                    className="gap-1 px-2 py-1 text-xs"
                    disabled={analyzingId === r._id}
                    onClick={() => runAnalyze(r._id)}
                  >
                    {analyzingId === r._id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Wand2 className="h-3 w-3" />
                    )}
                    Run AI analysis
                  </Button>
                  <Button variant="secondary" className="px-2 py-1 text-xs" onClick={() => sendBuilder(r._id)}>
                    Send to builder
                  </Button>
                </div>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
        {!resumes.length && !isFetching ? <li className="text-ink-muted dark:text-slate-400">No resumes yet.</li> : null}
      </ul>
    </div>
  );
}
