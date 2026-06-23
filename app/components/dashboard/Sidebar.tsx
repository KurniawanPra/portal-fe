'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, User, ShieldAlert, LogOut, Briefcase, ChevronRight, ChevronLeft, X } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  employee: {
    nama: string;
    jabatan: string;
    bagian: { nama: string };
    foto_profil?: string;
  };
  onLogout: () => void;
}

export default function Sidebar({
  isOpen,
  setIsOpen,
  isCollapsed,
  setIsCollapsed,
  employee,
  onLogout,
}: SidebarProps) {
  const pathname = usePathname();

  const menuItems = [
    { id: 'apps', label: 'Aplikasi Saya', path: '/dashboard/aplikasi', icon: LayoutGrid },
    { id: 'profile', label: 'Profil Saya', path: '/dashboard/profile', icon: User },
    { id: 'security', label: 'Keamanan Akun', path: '/dashboard/security', icon: ShieldAlert },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-white/60 dark:border-slate-800/35 bg-white/70 dark:bg-[#121620]/80 backdrop-blur-xl transition-all duration-350 ease-in-out lg:static lg:translate-x-0 relative ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:shadow-none'
        } ${isCollapsed ? 'w-20' : 'w-72'}`}
      >
        {/* Desktop Collapse Toggle Floating Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex absolute top-1/2 -translate-y-1/2 -right-3 h-14 w-6 items-center justify-center rounded-r-xl border border-l-0 border-slate-200/80 dark:border-slate-800/35 bg-white/90 dark:bg-[#161b26]/90 text-slate-500 hover:text-slate-850 dark:hover:text-white shadow-md backdrop-blur-md cursor-pointer z-50 transition-all duration-300 hover:w-7 hover:shadow-lg active:scale-95 focus:outline-none"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>

        {/* Brand Header */}
        <div className={`flex h-20 items-center border-b border-slate-100 dark:border-slate-800 transition-all duration-300 ${
          isCollapsed ? 'justify-center px-2' : 'justify-between px-6'
        }`}>
          <div className="flex items-center gap-3">
            <Image
              src="/img/logo.png"
              alt="Logo PT INL"
              width={40}
              height={40}
              className="h-10 w-10 object-contain shrink-0"
            />
            {!isCollapsed && (
              <div className="flex flex-col animate-fade-in">
                <span className="text-sm font-bold tracking-tight text-slate-800 dark:text-slate-100">PT Industri Nabati Lestari</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Portal SSO</span>
              </div>
            )}
          </div>
          {/* Mobile Close Button */}
          {!isCollapsed && (
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 lg:hidden cursor-pointer focus:ring-2 focus:ring-slate-500/10 focus:outline-none"
              aria-label="Tutup menu"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className={`flex-1 space-y-1.5 py-6 transition-all duration-300 ${
          isCollapsed ? 'px-3' : 'px-4'
        }`}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path || pathname?.startsWith(item.path + '/');
            return (
              <Link
                key={item.id}
                href={item.path}
                onClick={() => setIsOpen(false)} // Auto-close on mobile
                title={isCollapsed ? item.label : undefined}
                className={`flex items-center rounded-xl border transition-all duration-300 ease-in-out cursor-pointer hover:scale-[1.02] active:scale-[0.98] focus:ring-2 focus:ring-indigo-500/20 focus:outline-none ${
                  isCollapsed ? 'justify-center p-3.5' : 'justify-between px-4 py-3 text-sm font-semibold hover:translate-x-0.5'
                } ${
                  isActive
                    ? 'border-indigo-600 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-transparent shadow-sm'
                    : 'border-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-4.5 w-4.5 shrink-0 transition-colors duration-300 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`} />
                  {!isCollapsed && <span className="animate-fade-in">{item.label}</span>}
                </div>
                {!isCollapsed && isActive && <ChevronRight className="h-4 w-4 text-indigo-600/80 dark:text-indigo-400/80 animate-fade-in transition-colors duration-300" />}
              </Link>
            );
          })}
        </nav>

        {/* User Profile Card & Logout Button */}
        <div className={`border-t border-slate-100 dark:border-slate-800/30 bg-slate-50/40 dark:bg-[#0e1118]/40 transition-all duration-350 ${
          isCollapsed ? 'p-3' : 'p-4'
        }`}>
          <div className={`flex items-center rounded-2xl border border-white dark:border-slate-800/40 bg-white/40 dark:bg-[#161b26]/50 shadow-sm transition-all duration-300 ${
            isCollapsed ? 'justify-center p-1.5' : 'gap-3 px-2 py-3'
          }`}>
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-bold text-sm shadow-inner">
              {employee.nama.charAt(0)}
            </div>
            {!isCollapsed && (
              <div className="flex-1 overflow-hidden animate-fade-in">
                <h4 className="truncate text-sm font-bold text-slate-800 dark:text-slate-200">{employee.nama}</h4>
                <p className="truncate text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Briefcase className="h-3 w-3 shrink-0" />
                  {employee.jabatan}
                </p>
              </div>
            )}
          </div>

          <button
            onClick={onLogout}
            title={isCollapsed ? "Keluar Portal" : undefined}
            className={`mt-3 flex items-center justify-center rounded-xl border border-rose-100 dark:border-rose-950/30 bg-rose-50/20 dark:bg-rose-950/10 text-rose-700 dark:text-rose-400 transition-all duration-300 ease-in-out hover:scale-[1.02] active:scale-[0.98] cursor-pointer focus:ring-2 focus:ring-rose-500/20 focus:outline-none ${
              isCollapsed ? 'w-full py-3' : 'w-full gap-2 px-4 py-2.5 text-sm font-semibold hover:translate-x-0.5'
            } hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-800 dark:hover:text-rose-350`}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!isCollapsed && <span className="animate-fade-in">Keluar Portal</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
