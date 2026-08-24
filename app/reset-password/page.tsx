'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { KeyRound, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { LiquidButton } from '@/components/animate-ui/components/buttons/liquid';
import { ThemeTogglerButton } from '@/components/animate-ui/components/buttons/theme-toggler';
import { api } from '@/lib/api';

// ─── Inner component yang pakai useSearchParams (wajib dibungkus Suspense) ─────
function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!token) {
      setMessage({ type: 'error', text: 'Tautan reset password tidak valid atau sudah kedaluwarsa.' });
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (!password || !confirmPassword) {
      setMessage({ type: 'error', text: 'Mohon isi semua kolom kata sandi baru.' });
      return;
    }
    if (password.length < 8) {
      setMessage({ type: 'error', text: 'Kata sandi minimal harus 8 karakter.' });
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setMessage({ type: 'error', text: 'Kata sandi harus mengandung minimal 1 huruf besar.' });
      return;
    }
    if (!/[0-9]/.test(password)) {
      setMessage({ type: 'error', text: 'Kata sandi harus mengandung minimal 1 angka.' });
      return;
    }
    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Konfirmasi kata sandi tidak cocok.' });
      return;
    }

    setMessage(null);
    setLoading(true);

    try {
      const res = await api.post<{ message: string }>('/auth/reset-password', { token, password });
      setMessage({ type: 'ok', text: res.data.message || 'Kata sandi berhasil diperbarui! Mengarahkan...' });
      setTimeout(() => router.push('/login'), 2500);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Gagal mengatur ulang kata sandi. Silakan coba lagi.' });
      setLoading(false);
    }
  };

  const inputCls =
    'w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-10 text-base text-slate-800 outline-none transition-colors placeholder:text-slate-400 hover:border-slate-300 focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/15 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-[#0b111b] dark:text-slate-100 dark:placeholder:text-slate-500 dark:hover:border-slate-600 dark:focus:border-brand/60 dark:focus:bg-[#0b111b] dark:focus:ring-brand/10 sm:text-sm';
  const labelCls = 'block text-[10px] font-black uppercase tracking-wider text-slate-550 dark:text-slate-400 mb-2';

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-900/10 dark:border-slate-800 dark:bg-[#111722] dark:shadow-black/40 sm:p-8">

      {/* Header */}
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Kata Sandi Baru</h2>
        <p className="text-xs sm:text-sm font-bold tracking-wider text-brand dark:text-brand-dark mt-0.5 sm:mt-1 uppercase">PT. Industri Nabati Lestari</p>
        <p className="mt-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed max-w-sm mx-auto">
          Silakan masukkan kata sandi baru Anda untuk mengakses akun Portal kembali.
        </p>
      </div>

      {/* Toast */}
      {message && (
        <div className={`mb-4 flex items-start gap-3 rounded-xl p-3.5 border text-xs leading-relaxed ${
          message.type === 'ok'
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-450'
            : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-450'
        }`}>
          {message.type === 'ok'
            ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            : <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />}
          <span className="font-bold">{message.text}</span>
        </div>
      )}

      {token && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Password Baru */}
          <div>
            <label className={labelCls}>Kata Sandi Baru *</label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Minimal 8 karakter"
                className={inputCls}
                disabled={loading}
                autoFocus
              />
              <button type="button" onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer focus:outline-none">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Konfirmasi Password */}
          <div>
            <label className={labelCls}>Konfirmasi Kata Sandi Baru *</label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
              <input
                type={showConfirmPw ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Ulangi kata sandi baru"
                className={inputCls}
                disabled={loading}
              />
              <button type="button" onClick={() => setShowConfirmPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer focus:outline-none">
                {showConfirmPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <LiquidButton
              type="submit"
              variant="outline"
              size="login"
              disabled={loading}
              className="flex w-full items-center justify-center cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 focus:ring-2 focus:ring-brand/20 focus:outline-none"
            >
              {loading
                ? <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Memproses…</span>
                : 'Perbarui Kata Sandi'
              }
            </LiquidButton>
          </div>
        </form>
      )}

      {/* Back to login */}
      <div className="mt-5 text-center">
        <button type="button" onClick={() => router.push('/login')}
          className="text-xs font-bold text-slate-500 hover:text-slate-750 dark:text-slate-400 dark:hover:text-slate-200 transition-colors focus:outline-none">
          Kembali ke Login
        </button>
      </div>
    </div>
  );
}

// ─── Page wrapper — Suspense wajib untuk useSearchParams di Next.js 14+ ────────
export default function ResetPasswordPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-100 px-4 py-16 transition-colors dark:bg-[#0b0f17]">
      <div className="absolute right-4 top-4 z-10 sm:right-8 sm:top-8">
        <ThemeTogglerButton variant="pill" size="sm" modes={['light', 'dark', 'system']} />
      </div>

      <div className="w-full max-w-md animate-fade-up">
        <Suspense fallback={
          <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-900/10 dark:border-slate-800 dark:bg-[#111722] dark:shadow-black/40">
            <Loader2 className="h-6 w-6 animate-spin text-brand" />
          </div>
        }>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </main>
  );
}
