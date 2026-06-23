'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

interface MessageState {
  type: 'error' | 'ok';
  text: string;
}

export default function LoginCard() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const [message, setMessage] = useState<MessageState | null>(null);

  const handleSubmit = () => {
    if (loading) return;
    if (!username || !password) {
      setMessage({ type: 'error', text: 'Mohon isi Username/Email dan Password.' });
      return;
    }
    setMessage(null);
    setLoading(true);
    console.log('[Portal PT INL] Submit:', { username, remember });
    setTimeout(() => {
      setLoading(false);
      setMessage({ type: 'ok', text: 'Login berhasil! (Simulasi sukses)' });
    }, 1200);
  };

  // const ssoLogin = (provider: string) => {
  //   console.log('[Portal PT INL] SSO via', provider);
  //   setMessage({ type: 'ok', text: `Login SSO via ${provider} sukses! (Simulasi sukses)` });
  //   setLoading(true);
  //   setTimeout(() => {
  //     setLoading(false);
  //   }, 1000);
  // };

  const fieldStyle = (name: string) =>
    focused === name
      ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-[0_4px_20px_-4px_rgba(99,102,241,0.12)] bg-white dark:bg-slate-900'
      : 'border-slate-200/80 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-950/30 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-950/40';

  return (
    <div className="w-full max-w-md animate-fade-up px-1 sm:px-0">
      <div className="rounded-3xl border border-slate-150/85 dark:border-slate-800/40 bg-white/98 dark:bg-[#11151f]/98 p-6 sm:p-10 shadow-[0_32px_64px_-12px_rgba(15,23,42,0.14),0_16px_32px_-8px_rgba(15,23,42,0.08)] dark:shadow-[0_32px_64px_-12px_rgba(0,0,0,0.6),0_16px_32px_-8px_rgba(0,0,0,0.4)]">
        {/* Title Block */}
        <div className="mb-6 sm:mb-8 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Portal Apps</h2>
          <p className="text-sm font-semibold tracking-wide text-indigo-650 dark:text-indigo-400 mt-1 uppercase">PT. Industri Nabati Lestari</p>
          <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
            Gunakan akun portal Anda untuk mengakses seluruh aplikasi terintegrasi secara aman.
          </p>
        </div>

        {/* Alert Messages */}
        {message && (
          <div
            className={`mb-5 sm:mb-6 flex items-start gap-2.5 rounded-2xl border p-4 text-sm font-medium animate-scale-in ${
              message.type === 'error'
                ? 'bg-rose-50/70 text-rose-700 border-rose-100'
                : 'bg-emerald-50/70 text-emerald-700 border-emerald-100'
            }`}
          >
            {message.type === 'error' ? (
              <AlertCircle className="h-5 w-5 shrink-0 text-rose-500 mt-0.5" />
            ) : (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Input Fields */}
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 sm:mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Username atau Email
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onFocus={() => setFocused('user')}
              onBlur={() => setFocused(null)}
              placeholder="nama@inl.co.id"
              autoComplete="username"
              className={`w-full rounded-2xl border px-4 py-3 text-sm text-slate-800 dark:text-slate-200 outline-none transition-all duration-200 placeholder:text-slate-450 dark:placeholder:text-slate-550 ${fieldStyle('user')}`}
            />
          </div>

          <div>
            <label className="mb-1.5 sm:mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Password
            </label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocused('pw')}
                onBlur={() => setFocused(null)}
                placeholder="••••••••"
                autoComplete="current-password"
                className={`w-full rounded-2xl border px-4 py-3 pr-11 text-sm text-slate-800 dark:text-slate-200 outline-none transition-all duration-200 placeholder:text-slate-450 dark:placeholder:text-slate-550 ${fieldStyle('pw')}`}
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 transition-colors hover:text-slate-650 dark:hover:text-slate-300 focus:outline-none cursor-pointer"
                aria-label={showPw ? 'Sembunyikan password' : 'Tampilkan password'}
              >
                {showPw ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
              </button>
            </div>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between pt-1 pb-2">
            <label className="flex cursor-pointer select-none items-center gap-2.5 text-sm font-semibold text-slate-700 dark:text-slate-305">
              <button
                type="button"
                onClick={() => setRemember((r) => !r)}
                className={`grid h-5 w-5 place-items-center rounded-md border transition-all duration-150 cursor-pointer focus:ring-2 focus:ring-indigo-500/20 focus:outline-none ${
                  remember
                    ? 'border-indigo-650 bg-indigo-650 text-white'
                    : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/40 hover:border-slate-450 dark:hover:border-slate-600'
                }`}
              >
                {remember && (
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
              Ingat saya
            </label>
            <button
              type="button"
              onClick={() => setMessage({ type: 'ok', text: 'Link reset password telah dikirim ke email Anda.' })}
              className="text-sm font-bold text-indigo-650 dark:text-indigo-400 transition-colors hover:text-indigo-850 dark:hover:text-indigo-300 cursor-pointer focus:outline-none focus:underline"
            >
              Lupa password?
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-4 py-3.5 text-sm font-semibold text-white shadow-[0_4px_12px_rgba(79,70,229,0.2)] transition-all duration-200 hover:from-indigo-500 hover:to-indigo-600 hover:shadow-[0_6px_20px_rgba(79,70,229,0.3)] hover:scale-[1.01] active:scale-[0.99] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Memproses…
              </span>
            ) : (
              'Masuk Ke Portal'
            )}
          </button>
        </div>

        {/* Divider */}
        {/* <div className="my-5 sm:my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200/60" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">atau masuk dengan</span>
          <div className="h-px flex-1 bg-slate-200/60" />
        </div> */}

        {/* Security Badge */}
        <div className="mt-6 pt-1 flex items-center justify-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span className="font-semibold tracking-wide">Koneksi Terenkripsi & Aman</span>
        </div>

        {/* SSO Options */}
        {/* <div className="space-y-3">
          <button
            type="button"
            onClick={() => ssoLogin('SSO Korporat')}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-indigo-100 bg-indigo-50/40 px-4 py-2.5 text-sm font-semibold text-indigo-700 shadow-sm transition-all duration-200 hover:bg-indigo-50 hover:shadow-md hover:scale-[1.01] active:scale-[0.99] cursor-pointer focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="11" width="18" height="10" rx="2" />
              <path strokeLinecap="round" d="M7 11V8a5 5 0 0 1 10 0v3" />
            </svg>
            Masuk dengan SSO Korporat
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => ssoLogin('Microsoft')}
              className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200/80 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:bg-slate-50 hover:shadow-md hover:scale-[1.01] active:scale-[0.99] cursor-pointer focus:ring-2 focus:ring-slate-500/10 focus:outline-none"
            >
              <svg viewBox="0 0 23 23" className="h-4 w-4">
                <rect width="10" height="10" x="1" y="1" fill="#f25022" />
                <rect width="10" height="10" x="12" y="1" fill="#7fba00" />
                <rect width="10" height="10" x="1" y="12" fill="#00a4ef" />
                <rect width="10" height="10" x="12" y="12" fill="#ffb900" />
              </svg>
              Microsoft
            </button>
            <button
              type="button"
              onClick={() => ssoLogin('Google')}
              className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200/80 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:bg-slate-50 hover:shadow-md hover:scale-[1.01] active:scale-[0.99] cursor-pointer focus:ring-2 focus:ring-slate-500/10 focus:outline-none"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
                <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z" />
              </svg>
              Google
            </button>
          </div>
        </div> */}
      </div>
    </div>
  );
}
