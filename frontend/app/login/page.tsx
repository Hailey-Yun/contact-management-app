'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });

      const { accessToken, user } = res.data;

      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('userRole', user.role); // "admin" or "user"
        localStorage.setItem('userEmail', user.email);
        localStorage.setItem('userId', user.id.toString());
      }

      router.push('/contacts');
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.message || 'Invalid email or password.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-md border border-slate-100">
        <h1 className="mb-6 text-2xl font-bold text-slate-900 text-center">Login</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading ? 'Logging in…' : 'Login'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-600">
          Don't have an account?{' '}
          <a
            href="/register"
            className="font-semibold text-blue-600  hover:underline"
          >
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}
