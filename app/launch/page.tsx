'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, AlertCircle, Rocket } from 'lucide-react';
import { api } from '@/lib/api';

interface ApiAplikasi {
  id: string;
  nama: string;
  url: string;
  authMode: 'sso' | 'independent';
  isActive: boolean;
  icon?: string;
}

function normalizeAppUrl(url: string) {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  if (/^[a-z][a-z\d+\-.]*:\/\//i.test(trimmed) || trimmed.startsWith('/')) return trimmed;
  return `https://${trimmed}`;
}

function LaunchContent() {
  const searchParams = useSearchParams();
  const appName = searchParams.get('app') || 'aplikasi';
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function launch() {
      try {
        let appId = searchParams.get('appId') || searchParams.get('app_id') || '';
        let fallbackUrl = searchParams.get('url') || '';
        let authMode: ApiAplikasi['authMode'] = 'sso';

        const appsRes = await api.get<ApiAplikasi[]>('/apps?limit=200&isActive=true');
        const app = (appsRes.data || []).find(item => item.nama.toLowerCase() === appName.toLowerCase());

        if (app) {
          if (!appId) appId = app.id;
          if (!fallbackUrl) fallbackUrl = app.url;
          authMode = app.authMode;
        } else if (!appId) {
          throw new Error('Data aplikasi tidak lengkap. Silakan buka aplikasi dari dashboard portal.');
        }

        if (authMode !== 'sso') {
          if (!fallbackUrl) throw new Error('URL aplikasi belum dikonfigurasi.');
          window.location.replace(normalizeAppUrl(fallbackUrl));
          return;
        }

        const tokenRes = await api.get<{ token: string; redirectUrl: string }>(`/sso/token?app_id=${appId}`);
        const baseUrl = normalizeAppUrl(tokenRes.data.redirectUrl || fallbackUrl);
        if (!baseUrl) throw new Error('URL redirect aplikasi belum dikonfigurasi.');

        const separator = baseUrl.includes('?') ? '&' : '?';
        window.location.replace(`${baseUrl}${separator}token=${encodeURIComponent(tokenRes.data.token)}`);
      } catch (err) {
        if (!cancelled) {
          setErrorMsg(err instanceof Error ? err.message : 'Gagal membuka aplikasi.');
        }
      }
    }

    launch();
    return () => {
      cancelled = true;
    };
  }, [appName, searchParams]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-amber-50/50 px-6 text-slate-900 dark:from-[#0e1118] dark:via-[#121620] dark:to-[#0e1118] dark:text-white">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(4deg); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
          20%, 40%, 60%, 80% { transform: translateX(2px); }
        }
        .animate-float {
          animation: float 2.5s ease-in-out infinite;
        }
        .animate-shake {
          animation: shake 1.2s ease-in-out infinite;
        }
      `}</style>

      <section className={`w-full max-w-sm text-center transform transition-all duration-1000 ease-out ${
        mounted ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'
      }`}>

        {errorMsg ? (
          <div className="mt-5 flex flex-col items-center gap-5">
            <AlertCircle className="h-14 w-14 text-rose-600 dark:text-rose-400 animate-shake" />
            <h1 className="text-xl font-black tracking-tight text-rose-600 dark:text-rose-400">
              Gagal Membuka Aplikasi
            </h1>
          </div>
        ) : (
          <div className="mt-5 flex flex-col items-center gap-5">
            <Rocket className="h-14 w-14 text-amber-500 animate-float" />
            <h1 className="text-xl font-black tracking-tight">
              Membuka {appName}
            </h1>
          </div>
        )}
        <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-500 dark:text-slate-400">
          {errorMsg || 'Mempersiapkan sesi SSO dan mengalihkan ke aplikasi tujuan.'}
        </p>

        {errorMsg ? (
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) window.history.back();
              else window.location.href = '/dashboard';
            }}
            className="mt-6 rounded-full bg-slate-900 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
          >
            Kembali Ke Portal
          </button>
        ) : (
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-500 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
            Harap tunggu...
          </div>
        )}
      </section>
    </main>
  );
}

export default function LaunchPage() {
  return (
    <Suspense fallback={
      <main className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-[#0e1118]">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </main>
    }>
      <LaunchContent />
    </Suspense>
  );
}
