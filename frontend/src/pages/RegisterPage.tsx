import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useRegisterMutation } from '../store/api';
import { useAppDispatch } from '../hooks';
import { setCredentials } from '../store/slices/authSlice';
import type { Role } from '../store/slices/authSlice';
import { getApiErrorMessage } from '../utils/apiError';
import { BRAND_NAME, BRAND_TAGLINE } from '../brand';

export function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('candidate');
  const [register, { isLoading, error }] = useRegisterMutation();
  const dispatch = useAppDispatch();
  const nav = useNavigate();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await register({ email, password, role, name }).unwrap();
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
        <h1 className="text-2xl font-bold text-ink dark:text-slate-50">Create your account</h1>
        <p className="mt-1 text-sm font-medium text-ink-secondary dark:text-slate-300">{BRAND_TAGLINE}</p>
      </div>
      <form onSubmit={onSubmit} className="form-auth-card">
        <label className="block text-sm font-medium text-ink-secondary dark:text-slate-300">
          Name
          <input
            className="form-input-lg mt-1.5 w-full"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
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
          Password (min 6 characters)
          <input
            className="form-input-lg mt-1.5 w-full"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <label className="block text-sm font-medium text-ink-secondary dark:text-slate-300">
          Role
          <select
            className="form-input-lg mt-1.5 w-full"
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
          >
            <option value="candidate">Candidate</option>
            <option value="recruiter">Recruiter</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        {error && (
          <p className="text-sm text-red-600 whitespace-pre-wrap dark:text-red-400">{getApiErrorMessage(error)}</p>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-xl bg-brand-600 py-2.5 font-semibold text-white shadow-md shadow-brand-600/20 transition hover:bg-brand-700 disabled:opacity-50"
        >
          {isLoading ? 'Creating…' : 'Create account'}
        </button>
      </form>
      <p className="text-center text-sm text-ink-secondary dark:text-slate-400">
        Already have an account?{' '}
        <Link className="font-semibold text-brand-800 hover:text-brand-900 dark:text-brand-300 dark:hover:text-brand-200" to="/login">
          Login
        </Link>
        {' · '}
        <Link className="font-semibold text-ink-muted hover:text-ink dark:text-slate-500 dark:hover:text-slate-200" to="/">
          Home
        </Link>
      </p>
    </div>
  );
}
