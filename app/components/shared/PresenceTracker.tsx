'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { api } from '@/lib/api';

interface PresenceTrackerProps {
  appId?: string;
  appName?: string;
}

const PATH_TITLE_MAP: Record<string, string> = {
  '/dashboard': 'Dashboard Portal',
  '/dashboard/aplikasi': 'Portal Aplikasi',
  '/dashboard/profile': 'Profil Saya',
  '/dashboard/security': 'Keamanan Akun',
  '/dashboard/dokumen': 'IDMS - Semua Dokumen',
  '/dashboard/dokumen/approved': 'IDMS - Dokumen Disetujui',
  '/dashboard/dokumen/requests': 'IDMS - Menunggu Persetujuan',
  '/dashboard/dokumen/riwayat': 'IDMS - Riwayat Persetujuan',
  '/dashboard/dokumen/approval': 'IDMS - Persetujuan Akses',
  '/dashboard/dokumen/kategori': 'IDMS - Kategori Dokumen',
  '/dashboard/dokumen/akses-global': 'IDMS - Akses Global Dokumen',
  '/dashboard/dokumen/audit-log': 'IDMS - Log Dokumen',
  '/admin': 'Dashboard Admin Portal',
  '/admin/organisasi': 'Master Unit Organisasi',
  '/admin/bagan': 'Bagan Struktur Jabatan',
  '/admin/master': 'Master Referensi & Wilayah',
  '/admin/employees': 'Data Karyawan',
  '/admin/users': 'Kelola User & Akun',
  '/admin/roles': 'Role & Izin Akses',
  '/admin/aplikasi': 'Layanan Aplikasi SSO',
  '/admin/aplikasi-portal': 'Portal Aplikasi',
  '/admin/settings/branding': 'Identitas & Penamaan Portal',
  '/admin/profile': 'Profil Admin',
  '/admin/security': 'Keamanan Admin',
};

function getHumanPageTitle(pathname: string): string {
  if (PATH_TITLE_MAP[pathname]) {
    return PATH_TITLE_MAP[pathname];
  }
  if (pathname.startsWith('/dashboard/dokumen/')) {
    return 'IDMS - Pratinjau Dokumen';
  }
  if (pathname.startsWith('/admin/employees/')) {
    return 'Detail Data Karyawan';
  }
  return pathname;
}

export function PresenceTracker({ appId = 'portal', appName = 'Portal SSO' }: PresenceTrackerProps) {
  const pathname = usePathname();
  const lastPingRef = useRef<number>(0);

  const sendHeartbeat = async (overrideAppId?: string, overrideAppName?: string, overrideTitle?: string) => {
    if (!pathname) return;
    try {
      const pageTitle = overrideTitle || getHumanPageTitle(pathname);
      await api.post('/presence/heartbeat', {
        appId: overrideAppId || appId,
        appName: overrideAppName || appName,
        currentPath: pathname,
        pageTitle,
      });
      lastPingRef.current = Date.now();
    } catch {
      // Non-blocking silently on unauthenticated / network glitch
    }
  };

  // Ping immediately on route change
  useEffect(() => {
    sendHeartbeat();
  }, [pathname]);

  // Regular interval heartbeat + instant return on focus / tab activation
  useEffect(() => {
    const interval = setInterval(() => {
      if (!document.hidden) {
        sendHeartbeat();
      }
    }, 25_000);

    const handleTabActive = () => {
      // If user switches back to portal tab, immediately sync presence as active on Portal
      if (!document.hidden && Date.now() - lastPingRef.current > 2_000) {
        sendHeartbeat();
      }
    };

    window.addEventListener('focus', handleTabActive);
    document.addEventListener('visibilitychange', handleTabActive);

    // Custom event to trigger immediate presence update from other components
    const handleCustomPing = (e: any) => {
      const d = e?.detail;
      sendHeartbeat(d?.appId, d?.appName, d?.pageTitle);
    };
    window.addEventListener('portal:presence-ping', handleCustomPing);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleTabActive);
      document.removeEventListener('visibilitychange', handleTabActive);
      window.removeEventListener('portal:presence-ping', handleCustomPing);
    };
  }, [pathname]);

  return null;
}
