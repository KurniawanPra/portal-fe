'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import AppCardGrid from '@/components/dashboard/AppCardGrid';
import { api } from '@/lib/api';
import { Loader2 } from 'lucide-react';

interface ApiAplikasi {
  id: string;
  nama: string;
  url: string;
  authMode: 'sso' | 'independent';
  icon: string | null;
  deskripsi: string | null;
  urutan: number;
  isActive: boolean;
  kategori?: string | null;
}

interface Aplikasi {
  id: string;
  nama: string;
  url: string;
  auth_mode: string;
  icon: string;
  deskripsi: string;
  urutan: number;
  is_active: boolean;
  kategori: string;
}

function AplikasiContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [apps, setApps] = useState<Aplikasi[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApps = async () => {
      try {
        const res = await api.get<ApiAplikasi[]>('/apps?limit=200&isActive=true');
        const mapped: Aplikasi[] = (res.data || []).map((app) => ({
          id: app.id,
          nama: app.nama,
          url: app.url,
          auth_mode: app.authMode,
          icon: app.icon || 'Clock',
          deskripsi: app.deskripsi || '',
          urutan: app.urutan,
          is_active: app.isActive,
          kategori: app.kategori || 'Lainnya',
        }));
        setApps(mapped);
      } catch (err) {
        console.error('Gagal memuat data aplikasi:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchApps();
  }, []);

  return (
    <div className="transition-colors duration-300">
      {/* Header Section */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 sm:text-3xl">
          Portal Aplikasi Karyawan
        </h1>
        <p className="mt-1 text-sm font-semibold text-slate-600 dark:text-slate-400">
          Akses seluruh aplikasi kerja PT Industri Nabati Lestari yang terintegrasi.
        </p>
      </div>

      {/* Mobile Search Bar Helper */}
      <div className="mb-6 sm:hidden relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            const params = new URLSearchParams(window.location.search);
            if (e.target.value) {
              params.set('q', e.target.value);
            } else {
              params.delete('q');
            }
            window.history.replaceState(null, '', `?${params.toString()}`);
          }}
          placeholder="Cari aplikasi..."
          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 py-2.5 pl-10 pr-4 text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 transition-colors duration-300"
        />
        <span className="absolute inset-y-0 left-3.5 flex items-center text-slate-400">
          <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </span>
      </div>

      {/* Cards List Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20 gap-3 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-slate-800/60 rounded-3xl p-8">
          <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
          <span className="text-sm font-semibold text-slate-400">Memuat aplikasi...</span>
        </div>
      ) : (
        <AppCardGrid apps={apps} searchQuery={query} />
      )}
    </div>
  );
}

export default function AplikasiPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20 gap-3 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-slate-800/60 rounded-3xl p-8">
        <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
        <span className="text-sm font-semibold text-slate-400">Memuat portal...</span>
      </div>
    }>
      <AplikasiContent />
    </Suspense>
  );
}
