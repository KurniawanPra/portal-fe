'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Search, Bell, Menu, Calendar } from 'lucide-react';
import { ThemeTogglerButton } from '@/components/animate-ui/components/buttons/theme-toggler';

interface NavbarProps {
  setSidebarOpen: (open: boolean) => void;
  employee: {
    nama: string;
    bagian: { nama: string };
  };
}

export default function Navbar({
  setSidebarOpen,
  employee,
}: NavbarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  

  
  // Local state to keep the input text responsive, syncing with URL parameters
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    setSearchValue(searchParams.get('q') || '');
  }, [searchParams]);

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

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set('q', value);
    } else {
      params.delete('q');
    }

    // Redirect to Aplikasi page if searched from another sub-route
    if (pathname === '/dashboard/aplikasi') {
      router.replace(`${pathname}?${params.toString()}`);
    } else {
      router.push(`/dashboard/aplikasi?${params.toString()}`);
    }
  };

  return (
    <header className="h-20 w-full border-b border-white/60 dark:border-slate-800/35 bg-white/40 dark:bg-[#121620]/45 backdrop-blur-md z-30 transition-colors duration-300">
      <div className="mx-auto max-w-7xl h-full flex items-center justify-between px-6 lg:px-8 -ms-4">
        <div className="flex items-center gap-4">
          {/* Toggle Sidebar Button (Mobile) */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-xl p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-white lg:hidden cursor-pointer focus:ring-2 focus:ring-slate-500/10 focus:outline-none"
            aria-label="Buka menu"
          >
            <Menu className="h-5.5 w-5.5" />
          </button>

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
              className="w-full rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/30 py-2.5 pl-10 pr-4 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition-all duration-200 focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 focus:bg-white dark:focus:bg-slate-950"
            />
          </div>
        </div>

        {/* Date-Time & Notifications */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Time Indicator */}
          <div className="hidden md:flex flex-col items-end text-right border-r border-slate-200 dark:border-slate-800 pr-4">
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="h-3 w-3 text-slate-400 dark:text-slate-500" />
              {dateStr || 'Memuat tanggal...'}
            </span>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200 tracking-tight mt-0.5">{time || 'Memuat jam...'}</span>
          </div>

          {/* Dark Mode Toggle Button */}
          <ThemeTogglerButton variant="pill" size="md" modes={['light', 'dark', 'system']} />

          {/* Notifications Icon */}
          <button
            className="relative rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-950/20 p-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-white transition-all duration-200 cursor-pointer focus:ring-2 focus:ring-slate-500/15 focus:outline-none"
            aria-label="Notifikasi"
          >
            <Bell className="h-5 w-5" />
            {/* Notification Dot */}
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-indigo-600 ring-2 ring-white dark:ring-slate-950" />
          </button>

          {/* Profile Summary */}
          <div className="flex items-center gap-2">
            <div className="flex flex-col text-right">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-none">{employee.nama}</span>
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 leading-none mt-1">{employee.bagian.nama}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
