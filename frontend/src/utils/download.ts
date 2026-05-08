/** Download file from authenticated GET /resumes/:id/download */
export async function downloadResume(resumeId: string, filename: string) {
  const base = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
  const token = localStorage.getItem('resumate_token');
  const r = await fetch(`${base}/resumes/${resumeId}/download`, {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });
  if (!r.ok) throw new Error('Download failed');
  const blob = await r.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'resume';
  a.click();
  URL.revokeObjectURL(url);
}
