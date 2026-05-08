import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLoginMutation } from '../store/api';
import { useAppDispatch } from '../hooks';
import { setCredentials } from '../store/slices/authSlice';
import { getApiErrorMessage } from '../utils/apiError';
import { BRAND_NAME, BRAND_TAGLINE } from '../brand';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [login, { isLoading, error }] = useLoginMutation();
  const dispatch = useAppDispatch();
  const nav = useNavigate();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await login({ email, password }).unwrap();
      dispatch(setCredentials({ token: res.token, user: res.user }));
      nav('/', { replace: true });
    } catch {
      /* handled */
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <p className="text-sm font-semibold text-brand-800 dark:text-brand-300">{BRAND_NAME}</p>
        <h1 className="text-2xl font-bold text-ink dark:text-slate-50">Welcome back</h1>
        <p className="mt-1 text-sm font-medium text-ink-secondary dark:text-slate-300">{BRAND_TAGLINE}</p>
      </div>
      <form onSubmit={onSubmit} className="form-auth-card">
        <label className="block text-sm font-medium text-ink-secondary dark:text-slate-300">
          Email
          <input
            className="form-input-lg mt-1.5 w-full"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="block text-sm font-medium text-ink-secondary dark:text-slate-300">
          Password
          <input
            className="form-input-lg mt-1.5 w-full"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error && (
          <p className="text-sm text-red-600 whitespace-pre-wrap dark:text-red-400">{getApiErrorMessage(error)}</p>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-xl bg-brand-600 py-2.5 font-semibold text-white shadow-md shadow-brand-600/20 transition hover:bg-brand-700 disabled:opacity-50"
        >
          {isLoading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className="text-center text-sm text-ink-secondary dark:text-slate-400">
        No account?{' '}
        <Link className="font-semibold text-brand-800 hover:text-brand-900 dark:text-brand-300 dark:hover:text-brand-200" to="/register">
          Register
        </Link>
        {' · '}
        <Link className="font-semibold text-ink-muted hover:text-ink dark:text-slate-500 dark:hover:text-slate-200" to="/">
          Home
        </Link>
      </p>
    </div>
  );
}
