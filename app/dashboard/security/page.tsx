'use client';

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  CheckCircle,
  Eye,
  EyeOff,
  AlertCircle
} from 'lucide-react';

export default function SecurityPage() {
  const [passwordState, setPasswordState] = useState({ current: '', next: '', confirm: '' });
  const [showPws, setShowPws] = useState({ current: false, next: false, confirm: false });
  const [secMessage, setSecMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setSecMessage(null);
    if (!passwordState.current || !passwordState.next || !passwordState.confirm) {
      setSecMessage({ type: 'err', text: 'Semua kolom password wajib diisi.' });
      return;
    }
    if (passwordState.next !== passwordState.confirm) {
      setSecMessage({ type: 'err', text: 'Konfirmasi password baru tidak cocok.' });
      return;
    }
    if (passwordState.next.length < 8) {
      setSecMessage({ type: 'err', text: 'Password baru minimal harus terdiri dari 8 karakter.' });
      return;
    }
    
    // Simulate successful password update
    setSecMessage({ type: 'ok', text: 'Password Anda berhasil diperbarui!' });
    setPasswordState({ current: '', next: '', confirm: '' });
  };

  return (
    <div className="transition-colors duration-300">
      {/* Header Section */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 sm:text-3xl">
          Keamanan Akun & Kredensial
        </h1>
        <p className="mt-1 text-sm font-semibold text-slate-600 dark:text-slate-400">
          Kelola kata sandi dan riwayat otentikasi akun Portal SSO Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Shield and Security Status Card */}
        <div className="rounded-3xl border border-white/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/70 p-6 shadow-sm backdrop-blur-xl flex flex-col items-center text-center">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 mb-4">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Status Keamanan</h3>
          <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">Akun Anda berada dalam kondisi terlindungi.</p>
          
          <div className="mt-6 w-full border-t border-slate-100 dark:border-slate-800 pt-5 text-left space-y-4">
            <div className="flex items-start gap-2.5">
              <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">SSL Enkripsi Aktif</h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-455 font-semibold mt-0.5">Semua data sesi terenkripsi dengan aman secara online.</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Perangkat Saat Ini</h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-455 font-semibold mt-0.5">Otentikasi sukses menggunakan peramban internal berlisensi.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Password Change Form */}
        <div className="lg:col-span-2 rounded-3xl border border-white/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/70 p-6 shadow-sm backdrop-blur-xl">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
            <Lock className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400" />
            Ganti Password Akun
          </h3>

          {secMessage && (
            <div
              className={`mt-4 flex items-start gap-2.5 rounded-2xl border p-4 text-sm font-medium animate-scale-in ${
                secMessage.type === 'ok'
                  ? 'bg-emerald-50/70 text-emerald-700 border-emerald-100'
                  : 'bg-rose-50/70 text-rose-700 border-rose-100'
              }`}
            >
              {secMessage.type === 'ok' ? (
                <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 shrink-0 text-rose-500 mt-0.5" />
              )}
              <span>{secMessage.text}</span>
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="mt-5 space-y-4 max-w-lg">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Password Saat Ini
              </label>
              <div className="relative">
                <input
                  type={showPws.current ? 'text' : 'password'}
                  value={passwordState.current}
                  onChange={(e) => setPasswordState({ ...passwordState, current: e.target.value })}
                  placeholder="Masukkan password lama"
                  className="w-full rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/30 px-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 focus:bg-white dark:focus:bg-slate-950 transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPws({ ...showPws, current: !showPws.current })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                >
                  {showPws.current ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Password Baru
              </label>
              <div className="relative">
                <input
                  type={showPws.next ? 'text' : 'password'}
                  value={passwordState.next}
                  onChange={(e) => setPasswordState({ ...passwordState, next: e.target.value })}
                  placeholder="Minimal 8 karakter"
                  className="w-full rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/30 px-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 focus:bg-white dark:focus:bg-slate-950 transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPws({ ...showPws, next: !showPws.next })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                >
                  {showPws.next ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Konfirmasi Password Baru
              </label>
              <div className="relative">
                <input
                  type={showPws.confirm ? 'text' : 'password'}
                  value={passwordState.confirm}
                  onChange={(e) => setPasswordState({ ...passwordState, confirm: e.target.value })}
                  placeholder="Ulangi password baru"
                  className="w-full rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/30 px-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 focus:bg-white dark:focus:bg-slate-950 transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPws({ ...showPws, confirm: !showPws.confirm })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                >
                  {showPws.confirm ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="flex items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:from-indigo-500 hover:to-indigo-600 hover:scale-[1.01] active:scale-[0.99] cursor-pointer focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
            >
              Perbarui Password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
