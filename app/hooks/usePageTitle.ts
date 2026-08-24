'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Mapping of pathname patterns to page titles.
 * Matched from top to bottom — first match wins.
 * Use `startsWith` matching for route groups.
 */
const titleMap: { pattern: string; title: string }[] = [
  // Admin routes
  { pattern: '/admin/employees', title: 'Karyawan' },
  { pattern: '/admin/master', title: 'Master Data' },
  { pattern: '/admin/users', title: 'Kelola User' },
  { pattern: '/admin/organisasi', title: 'Organisasi' },
  { pattern: '/admin/bagan', title: 'Bagan Organisasi' },
  { pattern: '/admin/aplikasi-portal', title: 'Aplikasi Portal' },
  { pattern: '/admin/aplikasi', title: 'Aplikasi' },
  { pattern: '/admin/security', title: 'Keamanan' },
  { pattern: '/admin/profile', title: 'Profil Admin' },
  { pattern: '/admin', title: 'Dashboard Admin' },

  // Dashboard routes
  { pattern: '/dashboard/profile', title: 'Profil Saya' },
  { pattern: '/dashboard/security', title: 'Keamanan' },
  { pattern: '/dashboard/aplikasi', title: 'Aplikasi' },
  { pattern: '/dashboard/dokumen/kategori', title: 'Kategori Dokumen' },
  { pattern: '/dashboard/dokumen/audit-log', title: 'Audit Log Dokumen' },
  { pattern: '/dashboard/dokumen/approval', title: 'Persetujuan Dokumen' },
  { pattern: '/dashboard/dokumen/approved', title: 'Dokumen Disetujui' },
  { pattern: '/dashboard/dokumen/requests', title: 'Permintaan Dokumen' },
  { pattern: '/dashboard/dokumen', title: 'Dokumen' },
  { pattern: '/dashboard', title: 'Dashboard' },

  // Auth routes
  { pattern: '/login', title: 'Masuk' },
  { pattern: '/reset-password', title: 'Atur Ulang Kata Sandi' },
  { pattern: '/launch', title: 'Launch' },
];

const APP_NAME = 'InTes Portal';

/**
 * Sets the browser tab title based on the current pathname.
 * Uses pathname → title mapping with a fallback to the app name.
 */
export function usePageTitle() {
  const pathname = usePathname();

  useEffect(() => {
    const match = titleMap.find((entry) => pathname.startsWith(entry.pattern));
    if (match) {
      document.title = `${match.title} — ${APP_NAME}`;
    } else {
      document.title = `InTes — PT Industri Nabati Lestari`;
    }
  }, [pathname]);
}
