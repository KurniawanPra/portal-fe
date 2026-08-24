'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Calendar, Search, User, Lock, HelpCircle, LogOut, ChevronDown, Loader2 } from 'lucide-react';
import { cn, resolveImageUrl } from '@/lib/utils';
import { ThemeTogglerButton } from '@/components/animate-ui/components/buttons/theme-toggler';
import { SidebarTrigger } from '@/components/animate-ui/components/radix/sidebar';
import { ModalPortal } from '@/components/ui/ModalPortal';
import PortalHelpGuide from '@/components/help/PortalHelpGuide';
import PortalCommandPalette from './PortalCommandPalette';
import NotificationBell from './NotificationBell';

interface NavbarProps {
  employee: {
    nama: string;
    jabatan?: string;
    bagian: { nama: string };
    foto_profil?: string;
  };
  isSuperAdmin?: boolean;
  onLogout?: () => void;
}

export default function Navbar({ employee, isSuperAdmin = false, onLogout }: NavbarProps) {
  const [time, setTime] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setTime(`${now.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })} WIB`);
      setDateStr(now.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }));
    };

    updateDateTime();
    const interval = window.setInterval(updateDateTime, 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isSuperAdmin) return;
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandPaletteOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [isSuperAdmin]);

  // Close dropdown on click outside
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropdownOpen]);

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      if (onLogout) {
        await onLogout();
      }
    } catch (err) {
      console.error(err);
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      {isSuperAdmin && (
        <PortalCommandPalette open={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} isSuperAdmin={isSuperAdmin} />
      )}

      {/* Help Guide Modal */}
      <PortalHelpGuide
        audience={isSuperAdmin ? 'admin' : 'employee'}
        open={showHelpModal}
        onOpenChange={setShowHelpModal}
      />

      <header className="relative z-30 h-16 w-full border-b border-white/90 dark:border-white/[0.08] bg-gradient-to-r from-[#e9eff6] via-[#f0f4f9] to-[#e2ebf5] dark:from-[#111520] dark:via-[#0e121a] dark:to-[#0a0d14] px-3 backdrop-blur-2xl shadow-[0_8px_20px_rgba(163,177,198,0.45),inset_0_-1.5px_1.5px_rgba(255,255,255,0.95)] dark:shadow-[0_8px_28px_rgba(4,7,13,0.9),inset_0_-1.5px_1.5px_rgba(255,255,255,0.12)] transition-all duration-300 sm:h-20 sm:px-6 lg:px-8">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4 flex-1 mr-6 lg:mr-8">
            <SidebarTrigger />
            {isSuperAdmin && (
              <>
                <button
                  type="button"
                  onClick={() => setCommandPaletteOpen(true)}
                  className="group hidden items-center gap-2 rounded-2xl border border-white/80 dark:border-white/[0.08] bg-[#e6ecf4]/80 dark:bg-[#0b0e15]/80 px-4 py-2 text-sm text-slate-500 shadow-[inset_2px_2px_5px_rgba(163,177,198,0.5),inset_-2px_-2px_5px_rgba(255,255,255,0.95)] dark:shadow-[inset_3px_3px_8px_rgba(4,7,13,0.75),inset_-2px_-2px_6px_rgba(35,46,68,0.35)] transition-all duration-200 hover:border-amber-500/50 hover:bg-[#e1e7f0] dark:hover:bg-[#0e121b] md:flex flex-1 w-full max-w-2xl justify-between cursor-pointer"
                >
                  <span className="flex items-center gap-2 truncate">
                    <Search className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span className="font-semibold text-slate-600 dark:text-slate-300 truncate">Pencarian Cepat...</span>
                  </span>
                  <kbd className="hidden rounded-xl bg-white/90 dark:bg-[#161d2a] px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-slate-600 dark:text-slate-300 sm:inline-block shadow-[2px_2px_5px_rgba(163,177,198,0.4),-2px_-2px_5px_rgba(255,255,255,0.9)] dark:shadow-[2px_2px_5px_rgba(4,7,13,0.7),-1px_-1px_4px_rgba(35,46,68,0.3)] border border-white/80 dark:border-white/[0.08] shrink-0">
                    Ctrl K
                  </kbd>
                </button>
                <button
                  type="button"
                  onClick={() => setCommandPaletteOpen(true)}
                  className="flex items-center justify-center rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden"
                >
                  <Search className="h-5 w-4" />
                </button>
              </>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-3 sm:gap-4 ml-auto">
            {/* Datetime Badge (Flat Style with clear right padding & separation) */}
            <div className="hidden flex-col items-end pr-4 mr-2 border-r border-slate-200/80 dark:border-slate-800/80 text-right md:flex">
              <span className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                <Calendar className="h-3 w-3 text-amber-500 shrink-0" />
                {dateStr || 'Memuat tanggal...'}
              </span>
              <span className="mt-0.5 text-xs font-bold tracking-tight text-slate-700 dark:text-slate-200">
                {time || 'Memuat jam...'}
              </span>
            </div>

            <ThemeTogglerButton variant="pill" size="md" modes={['light', 'dark', 'system']} />
            <NotificationBell />

            {/* Profile Dropdown Trigger (Flat Style) */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl border border-transparent hover:border-slate-200/80 dark:hover:border-white/[0.08] hover:bg-slate-100/80 dark:hover:bg-white/[0.04] transition-all duration-200 cursor-pointer focus:outline-none"
              >
                <div className="hidden min-w-0 flex-col text-right lg:flex">
                  <span className="text-xs font-bold leading-none text-slate-800 dark:text-slate-100 truncate max-w-[130px]">{employee?.nama || 'User'}</span>
                  <span className="mt-1 text-[10px] font-semibold leading-none text-slate-500 dark:text-slate-400 truncate max-w-[130px]">{employee?.bagian?.nama || '-'}</span>
                </div>
                {employee?.foto_profil ? (
                  <img
                    src={resolveImageUrl(employee.foto_profil)}
                    alt={employee?.nama || 'Profile'}
                    className="h-9 w-9 shrink-0 rounded-xl object-cover shadow-xs border border-slate-200 dark:border-slate-700"
                  />
                ) : (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-xs font-bold text-white shadow-xs">
                    {(employee?.nama || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <ChevronDown className={cn("h-3.5 w-3.5 text-slate-400 dark:text-slate-500 transition-transform duration-200 shrink-0", dropdownOpen && "rotate-180")} />
              </button>

              {/* Profile Dropdown Menu Card (Smooth Pop-Up Animation) */}
              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-3 w-64 rounded-3xl border border-white/90 dark:border-white/[0.1] bg-gradient-to-br from-white via-slate-50 to-slate-100/95 dark:from-[#181e2d] dark:via-[#131824] dark:to-[#0e121c] backdrop-blur-2xl p-2.5 shadow-[8px_8px_32px_rgba(163,177,198,0.65),-6px_-6px_22px_rgba(255,255,255,1)] dark:shadow-[8px_8px_35px_rgba(4,7,13,0.95),-6px_-6px_22px_rgba(36,48,72,0.45)] z-50 origin-top-right transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 space-y-1">
                  {/* User Info Header */}
                  <div className="px-3 py-2.5 flex items-center gap-3 border-b border-slate-100 dark:border-slate-850">
                    {employee.foto_profil ? (
                      <img
                        src={resolveImageUrl(employee.foto_profil)}
                        alt={employee.nama}
                        className="h-10 w-10 shrink-0 rounded-full object-cover shadow-sm border border-slate-200 dark:border-slate-700"
                      />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-sm font-bold text-white shadow-sm">
                        {employee.nama.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-xs text-slate-900 dark:text-white truncate">{employee.nama}</p>
                      <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate mt-0.5">{employee.bagian?.nama || '-'}</p>
                      <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wide ${isSuperAdmin ? 'bg-rose-50 text-rose-600 dark:bg-rose-955/20 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/30' : 'bg-amber-50 text-amber-600 dark:bg-amber-955/20 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/30'}`}>
                        {isSuperAdmin ? 'Super Admin' : 'Karyawan'}
                      </span>
                    </div>
                  </div>

                  {/* Menu Options */}
                  <div className="py-1 space-y-0.5">
                    {/* Profil Saya */}
                    <Link
                      href={isSuperAdmin ? '/admin/profile' : '/dashboard/profile'}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/90 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                      <User className="h-4 w-4 text-amber-500 shrink-0" />
                      <span>Profil Saya</span>
                    </Link>

                    {/* Ubah Password */}
                    <Link
                      href={isSuperAdmin ? '/admin/security' : '/dashboard/security'}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/90 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                      <Lock className="h-4 w-4 text-indigo-500 shrink-0" />
                      <span>Ubah Password</span>
                    </Link>

                    {/* Panduan & Bantuan (Help) */}
                    <button
                      type="button"
                      onClick={() => {
                        setDropdownOpen(false);
                        setShowHelpModal(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/90 hover:text-slate-900 dark:hover:text-white transition-colors text-left cursor-pointer"
                    >
                      <HelpCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>Panduan & Bantuan (Help)</span>
                    </button>
                  </div>

                  {/* Logout Option */}
                  <div className="pt-1 border-t border-slate-100 dark:border-slate-850">
                    <button
                      type="button"
                      onClick={() => {
                        setDropdownOpen(false);
                        setShowLogoutModal(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-955/35 dark:hover:text-rose-300 transition-colors text-left cursor-pointer"
                    >
                      <LogOut className="h-4 w-4 text-rose-500 shrink-0" />
                      <span>Keluar Portal</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Logout Confirmation Modal */}
      <ModalPortal open={showLogoutModal}>
        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => !isLoggingOut && setShowLogoutModal(false)} />
        <div className="absolute inset-0 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-sm animate-fade-up bg-white dark:bg-[#0d1218] rounded-2xl border border-slate-300 dark:border-white/[0.08] shadow-2xl shadow-slate-900/10 p-6 text-center">
            <h3 className="text-base font-black text-slate-800 dark:text-slate-100">Keluar Portal?</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Apakah Anda yakin ingin keluar dari sesi ini?</p>
            <div className="mt-5 flex gap-3">
              <button 
                disabled={isLoggingOut} 
                onClick={() => setShowLogoutModal(false)} 
                className="flex-1 rounded-xl border border-slate-200 dark:border-white/[0.08] px-4 py-2.5 text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Batal
              </button>
              <button 
                disabled={isLoggingOut} 
                onClick={handleConfirmLogout} 
                className="flex-1 rounded-xl bg-rose-500/90 hover:bg-rose-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoggingOut ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Keluar...</span>
                  </>
                ) : (
                  <span>Keluar Sekarang</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </ModalPortal>
    </>
  );
}
