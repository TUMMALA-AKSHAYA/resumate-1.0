import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';

function messageFromPayload(data: unknown): string {
  if (data == null || typeof data !== 'object') return '';
  const d = data as Record<string, unknown>;
  const err = d.error;
  if (typeof err === 'string') return err;
  if (err && typeof err === 'object' && 'message' in err && typeof (err as { message: unknown }).message === 'string') {
    return (err as { message: string }).message;
  }
  return '';
}

/**
 * Human-readable message from RTK Query / fetchBaseQuery errors.
 */
export function getApiErrorMessage(error: unknown): string {
  if (error == null) return 'Something went wrong';
  if (typeof error !== 'object') return String(error);

  const e = error as FetchBaseQueryError;

  if ('status' in e) {
    if (e.status === 'FETCH_ERROR') {
      const msg = 'error' in e && typeof e.error === 'string' ? e.error : '';
      if (/failed to fetch|networkerror|load failed/i.test(msg)) {
        return 'Cannot reach the API. Start the backend (`cd backend && npm run dev`), ensure MongoDB is running, and check `frontend/.env` has the correct `VITE_API_URL` (e.g. http://localhost:4000/api).';
      }
      return msg || 'Network error. Is the backend running?';
    }
    if (e.status === 'PARSING_ERROR' && 'error' in e && typeof e.error === 'string') {
      return e.error;
    }
    if (e.status === 'CUSTOM_ERROR' && 'error' in e && typeof e.error === 'string') {
      return e.error;
    }
    if (typeof e.data === 'object' && e.data != null) {
      const nested = messageFromPayload(e.data);
      if (nested) return nested;
    }
    if (typeof e.data === 'string' && e.data.trim()) {
      return e.data;
    }
    if (typeof e.status === 'number') {
      return `Request failed (${e.status})`;
    }
  }

  return 'Something went wrong';
}
