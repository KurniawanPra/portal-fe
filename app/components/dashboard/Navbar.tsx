'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Search, Bell, Calendar } from 'lucide-react';
import { ThemeTogglerButton } from '@/components/animate-ui/components/buttons/theme-toggler';
import { SidebarTrigger } from '@/components/animate-ui/components/radix/sidebar';
import NotificationModal, { type Notification } from './NotificationModal';

// --- INITIAL MOCK NOTIFICATIONS (SSO / BUMN Corporate Alerts) ---
const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-1',
    category: 'security',
    title: 'Perangkat Baru Terdeteksi',
    message:
      'Akun Anda diakses dari perangkat baru: Chrome 125 di Windows 11 (Jakarta, ID). Jika bukan Anda, segera ganti kata sandi.',
    timestamp: '2 menit lalu',
    isRead: false,
  },
  {
    id: 'notif-2',
    category: 'warning',
    title: 'Pemeliharaan Sistem Terjadwal',
    message:
      'Portal SSO akan menjalani pemeliharaan rutin pada Sabtu, 28 Juni 2026 pukul 23.00–01.00 WIB. Simpan pekerjaan Anda sebelum waktu tersebut.',
    timestamp: '1 jam lalu',
    isRead: false,
  },
  {
    id: 'notif-3',
    category: 'success',
    title: 'Sinkronisasi Akun Berhasil',
    message:
      'Profil karyawan Anda telah berhasil disinkronkan dengan direktori HRIS PT INL. Data jabatan dan divisi kini sudah diperbarui.',
    timestamp: '3 jam lalu',
    isRead: false,
  },
  {
    id: 'notif-4',
    category: 'info',
    title: 'Pembaruan Kebijakan Akses',
    message:
      'Kebijakan akses aplikasi Google Workspace telah diperbarui. Mulai 1 Juli 2026, autentikasi dua faktor (2FA) diwajibkan untuk semua karyawan.',
    timestamp: 'Kemarin',
    isRead: true,
  },
  {
    id: 'notif-5',
    category: 'security',
    title: 'Sesi Login Aktif Terdeteksi',
    message:
      'Terdeteksi 2 sesi aktif pada akun Anda secara bersamaan. Klik untuk meninjau dan keluar dari sesi yang tidak dikenali.',
    timestamp: 'Kemarin',
    isRead: true,
  },
];

interface NavbarProps {
  employee: {
    nama: string;
    bagian: { nama: string };
    foto_profil?: string;
  };
}

export default function Navbar({ employee }: NavbarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // ── Search State ────────────────────────────────────────────────
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    setSearchValue(searchParams.get('q') || '');
  }, [searchParams]);

  // ── Date / Time State ───────────────────────────────────────────
  const [time, setTime] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }) + ' WIB'
      );
      setDateStr(
        now.toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      );
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // ── Notification State ─────────────────────────────────────────
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleToggleNotification = useCallback(() => {
    setIsNotificationOpen((prev) => !prev);
  }, []);

  const handleCloseNotification = useCallback(() => {
    setIsNotificationOpen(false);
  }, []);

  const handleToggleRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: !n.isRead } : n))
    );
  }, []);

  const handleMarkAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }, []);

  const handleClearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // ── Search Handler ─────────────────────────────────────────────
  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set('q', value);
    } else {
      params.delete('q');
    }

    if (pathname === '/dashboard/aplikasi') {
      router.replace(`${pathname}?${params.toString()}`);
    } else {
      router.push(`/dashboard/aplikasi?${params.toString()}`);
    }
  };

  return (
    <>
      {/* ── Navbar Header ──────────────────────────────────────────── */}
      <header className="h-20 w-full border-b border-white/60 dark:border-slate-800/35 bg-white/40 dark:bg-[#121620]/45 backdrop-blur-md z-30 transition-colors duration-300 px-6 lg:px-8">
        {/* Inner container: same max-w-7xl as the content body, no horizontal padding here */}
        <div className="mx-auto max-w-7xl h-full flex items-center justify-between">

          <div className="flex items-center gap-4">
            {/* Toggle Sidebar Button — aligns with content left-edge because
                 both the header AND main content use px-6 lg:px-8 on the outer wrapper */}
            <SidebarTrigger />

            {/* Search Bar */}
            <div className="relative hidden sm:block w-72 md:w-96">
              <span className="absolute inset-y-0 left-3.5 flex items-center text-slate-400 dark:text-slate-500 pointer-events-none">
                <Search className="h-4.5 w-4.5" />
              </span>
              <input
                type="text"
                value={searchValue}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Cari aplikasi berdasarkan nama atau deskripsi..."
                className="w-full rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/30 py-2.5 pl-10 pr-4 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-550 outline-none transition-all duration-200 focus:border-amber-500 dark:focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 focus:bg-white dark:focus:bg-slate-950"
              />
            </div>
          </div>

          {/* Right side: Date-Time, Theme Toggle, Notifications, Profile */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Time Indicator */}
            <div className="hidden md:flex flex-col items-end text-right border-r border-slate-200 dark:border-slate-800 pr-4">
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                {dateStr || 'Memuat tanggal...'}
              </span>
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200 tracking-tight mt-0.5">
                {time || 'Memuat jam...'}
              </span>
            </div>

            {/* Dark Mode Toggle Button */}
            <ThemeTogglerButton variant="pill" size="md" modes={['light', 'dark', 'system']} />

            {/* Notifications Bell — wrapper gives badge room to overflow outside the button */}
            <div className="relative">
              <button
                id="notification-bell-btn"
                type="button"
                onClick={handleToggleNotification}
                className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-950/20 p-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-white transition-all duration-200 cursor-pointer focus:ring-2 focus:ring-slate-500/15 focus:outline-none"
                aria-label="Notifikasi"
                aria-expanded={isNotificationOpen}
              >
                <Bell className="h-5 w-5" />
              </button>

              {/* Unread Badge — floats outside button via wrapper's position:relative */}
              {unreadCount > 0 && (
                <span className="pointer-events-none absolute -top-2 -right-2 flex min-w-[1.25rem] h-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-black leading-none text-white ring-2 ring-white dark:ring-[#121620] transition-all duration-200">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>

            {/* Profile Summary */}
            <div className="flex items-center gap-2.5">
              <div className="flex flex-col text-right">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-none">
                  {employee.nama}
                </span>
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 leading-none mt-1">
                  {employee.bagian.nama}
                </span>
              </div>
              {employee.foto_profil ? (
                <img
                  src={employee.foto_profil.startsWith('http') ? employee.foto_profil : `/uploads/${employee.foto_profil}`}
                  alt={employee.nama}
                  className="h-9 w-9 rounded-full object-cover shrink-0 border border-slate-200/80 dark:border-slate-700 shadow-sm"
                />
              ) : (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white font-bold text-xs shadow-sm">
                  {employee.nama.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Notification Modal ──────────────────────────────────────── */}
      <NotificationModal
        isOpen={isNotificationOpen}
        onClose={handleCloseNotification}
        notifications={notifications}
        onMarkAllRead={handleMarkAllRead}
        onClearAll={handleClearAll}
        onToggleRead={handleToggleRead}
      />
    </>
  );
}
