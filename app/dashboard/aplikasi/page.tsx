'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AppCardGrid from '@/components/dashboard/AppCardGrid';

// --- MOCK DATABASE WITH RICH PLATFORM DESCRIPTIONS ---
const MOCK_APLIKASI = [
  {
    id: 'app-google',
    nama: 'Google Workspace',
    url: 'https://workspace.google.com',
    auth_mode: 'SSO-OAuth2',
    icon: 'Google',
    deskripsi: 'Kolaborasi tanpa batas menggunakan Gmail korporat, penyimpanan cloud bersama (Drive) terpusat, pengolah kata Docs, Sheets, serta Meet untuk rapat koordinasi daring.',
    urutan: 1,
    is_active: true,
  },
  {
    id: 'app-youtube',
    nama: 'YouTube Studio',
    url: 'https://studio.youtube.com',
    auth_mode: 'API-Key',
    icon: 'YouTube',
    deskripsi: 'Dashboard manajemen video publisitas PT INL. Unggah konten video promosi, kelola hak siar publisitas, pantau analitik penonton, serta optimasi SEO konten digital.',
    urutan: 2,
    is_active: true,
  },
  {
    id: 'app-facebook',
    nama: 'Workplace Facebook',
    url: 'https://workplace.com',
    auth_mode: 'SSO-SAML',
    icon: 'Facebook',
    deskripsi: 'Jejaring sosial internal PT INL. Lakukan siaran langsung pengumuman direksi secara interaktif, bagikan kabar divisi, dan bangun komunikasi komunitas kerja yang aktif.',
    urutan: 3,
    is_active: true,
  },
  {
    id: 'app-1',
    nama: 'Mobile Legends: Bang Bang',
    url: 'https://m.mobilelegends.com',
    auth_mode: 'SSO-OAuth2',
    icon: 'MLBB',
    deskripsi: 'Pertempuran MOBA 5v5 secara real-time melawan pemain asli. Pilih hero favoritmu, bangun tim terkuat, hancurkan turret musuh, dan capai rank Mythic bersama teman-teman!',
    urutan: 4,
    is_active: true,
  },
  {
    id: 'app-2',
    nama: 'PUBG Mobile',
    url: 'https://www.pubgmobile.com',
    auth_mode: 'SSO-SAML',
    icon: 'PUBG',
    deskripsi: 'Game battle royale multiplayer legendaris. Terjun payung di peta luas, kumpulkan senjata terbaik, bertahan dari zona biru, kalahkan 99 pemain lain, dan dapatkan Winner Winner Chicken Dinner!',
    urutan: 5,
    is_active: true,
  },
  {
    id: 'app-3',
    nama: 'Valorant',
    url: 'https://playvalorant.com',
    auth_mode: 'SSO-OAuth2',
    icon: 'Valorant',
    deskripsi: 'Penembak taktis 5v5 berbasis karakter yang memadukan keahlian menembak presisi tinggi dengan kemampuan agen khusus. Pasang Spike, pertahankan site, dan menangkan pertandingan!',
    urutan: 6,
    is_active: true,
  },
  {
    id: 'app-4',
    nama: 'Genshin Impact',
    url: 'https://genshin.hoyoverse.com',
    auth_mode: 'SSO-SAML',
    icon: 'Genshin',
    deskripsi: 'Jelajahi dunia fantasi luas Teyvat yang penuh dengan misteri, pertarungan elemen dinamis, dan petualangan seru. Rekrut berbagai karakter unik dan ungkap rahasia dunia yang hilang.',
    urutan: 7,
    is_active: true,
  },
];

function AplikasiContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';

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
      <AppCardGrid apps={MOCK_APLIKASI} searchQuery={query} />
    </div>
  );
}

export default function AplikasiPage() {
  return (
    <Suspense fallback={<div className="text-center py-10 font-bold text-slate-500 dark:text-slate-400">Memuat aplikasi...</div>}>
      <AplikasiContent />
    </Suspense>
  );
}
