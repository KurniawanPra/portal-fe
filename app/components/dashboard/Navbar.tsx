'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Search, Calendar } from 'lucide-react';
import useSWR from 'swr';
import { api } from '@/lib/api';
import { resolveImageUrl } from '@/lib/utils';
import { ThemeTogglerButton } from '@/components/animate-ui/components/buttons/theme-toggler';
import { SidebarTrigger } from '@/components/animate-ui/components/radix/sidebar';


// Notifications are loaded dynamically via SWR from /api/auth/notifications

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
                  src={resolveImageUrl(employee.foto_profil)}
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


    </>
  );
}
