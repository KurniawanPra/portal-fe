'use client';

import { Suspense, useEffect, useState, type ComponentType } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  AlertCircle,
  Loader2,
  ShieldCheck,
  Clock,
  BookOpen,
  FileText,
  Calendar,
  Layers,
  ShoppingBag,
  HelpCircle
} from 'lucide-react';
import { api } from '@/lib/api';

const iconMap: Record<string, ComponentType<{ className?: string }>> = {
  Clock,
  BookOpen,
  ShieldCheck,
  FileText,
  Calendar,
  Layers,
  ShoppingBag,
  HelpCircle
};

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
  const [appIcon, setAppIcon] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    // Set initial icon if passed via search params
    const initialIcon = searchParams.get('icon') || searchParams.get('app_icon');
    if (initialIcon) {
      setAppIcon(initialIcon);
    }

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
          if (app.icon && !initialIcon) {
            setAppIcon(app.icon);
          }
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

  const renderIcon = () => {
    if (errorMsg) return <AlertCircle className="h-7 w-7" />;
    
    if (appIcon) {
      const isCustomIcon = appIcon.includes('/') || appIcon.includes('.');
      if (isCustomIcon) {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001';
        const imageUrl = appIcon.startsWith('http') || appIcon.startsWith('/') 
          ? appIcon 
          : `${backendUrl}/uploads/${appIcon}`;
        return <img src={imageUrl} alt={appName} className="h-10 w-10 object-contain" />;
      }
      const IconComp = iconMap[appIcon] || ShieldCheck;
      return <IconComp className="h-7 w-7" />;
    }
    
    return;
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-amber-50/50 px-6 text-slate-900 dark:from-[#0e1118] dark:via-[#121620] dark:to-[#0e1118] dark:text-white">
      <section className="w-full max-w-sm text-center">
        <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border shadow-lg ${
          errorMsg
            ? 'border-rose-500/20 bg-rose-500/10 text-rose-600 shadow-rose-500/10 dark:text-rose-400'
            : 'border-amber-500/20 bg-amber-500/10 text-amber-600 shadow-amber-500/10 dark:text-amber-400'
        }`}>
          {renderIcon()}
        </div>

        <h1 className="mt-5 text-xl font-black tracking-tight">
          {errorMsg ? 'Gagal Membuka Aplikasi' : `Membuka ${appName}`}
        </h1>
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
