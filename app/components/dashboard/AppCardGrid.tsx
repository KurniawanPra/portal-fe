'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { resolveImageUrl } from '@/lib/utils';
import { AnimatedCard, StaggerContainer } from '@/components/motion/Animated';
import { useLaunchApp } from '@/components/motion/ApplicationLaunchAnimation';
import { 
  Clock, 
  BookOpen, 
  ShieldCheck, 
  FileText, 
  Calendar, 
  Layers, 
  ShoppingBag, 
  HelpCircle,
  Lock,
  LucideProps
} from 'lucide-react';

interface Aplikasi {
  id: string;
  nama: string;
  url: string;
  auth_mode: string;
  icon: string;
  deskripsi: string;
  urutan: number;
  is_active: boolean;
  kategori?: string;
}

interface AppCardGridProps {
  apps: Aplikasi[];
  searchQuery: string;
  showUuid?: boolean;
  columns?: 3 | 4;
  isEmployee?: boolean;
}

// Icon mapping for Standard Lucide icons
const iconMap: Record<string, React.ComponentType<LucideProps>> = {
  Clock: Clock,
  BookOpen: BookOpen,
  ShieldCheck: ShieldCheck,
  FileText: FileText,
  Calendar: Calendar,
  Layers: Layers,
  ShoppingBag: ShoppingBag,
};

// Returns a beautiful iOS App Store style icon container (no background, no border)
export function AppIcon({ name }: { name: string }) {
  const [imageFailed, setImageFailed] = useState(false);
  const containerClass = "h-24 w-24 shrink-0 flex items-center justify-center transition-transform duration-300 bg-transparent";

  switch (name) {
    case 'Google':
      return (
        <div className={containerClass}>
          <svg viewBox="0 0 24 24" className="h-16 w-16">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
            <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z" />
          </svg>
        </div>
      );
    case 'YouTube':
      return (
        <div className={containerClass}>
          <svg viewBox="0 0 24 24" className="h-16 w-16" fill="#FF0000">
            <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.516 0-9.387.507a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.871.507 9.387.507 9.387.507s7.517 0 9.387-.507a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837Z" />
            <path d="M9.545 15.568V8.432L15.818 12l-6.273 3.568Z" fill="currentColor" className="text-white dark:text-slate-900" />
          </svg>
        </div>
      );
    case 'Facebook':
      return (
        <div className={containerClass}>
          <svg viewBox="0 0 24 24" className="h-16 w-16" fill="#1877F2">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073Z" />
          </svg>
        </div>
      );
    case 'MLBB': // Mobile Legends
      return (
        <div className={containerClass}>
          <svg viewBox="0 0 24 24" className="h-16 w-16" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" fill="#F59E0B" fillOpacity="0.2"/>
            <path d="M3 20h18" strokeWidth="3" />
          </svg>
        </div>
      );
    case 'PUBG': // PUBG Mobile
      return (
        <div className={containerClass}>
          <svg viewBox="0 0 24 24" className="h-16 w-16" fill="none" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" fill="#F97316" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
          </svg>
        </div>
      );
    case 'Valorant': // Valorant
      return (
        <div className={containerClass}>
          <svg viewBox="0 0 24 24" className="h-16 w-16">
            <path fill="#FF4655" d="M3 3h6.5l7.5 18H10.5L3 3z" />
            <path fill="#FF4655" d="M21 3h-6.5l-3.5 8.5h6.5L21 3z" />
          </svg>
        </div>
      );
    case 'Genshin': // Genshin Impact
      return (
        <div className={containerClass}>
          <svg viewBox="0 0 24 24" className="h-16 w-16" fill="none" stroke="#06B6D4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2z" fill="#06B6D4" fillOpacity="0.2" />
            <path d="M12 7l1.5 3.5L17 12l-3.5 1.5L12 17l-1.5-3.5L7 12l3.5-1.5L12 7z" fill="#E0F2FE" />
          </svg>
        </div>
      );
    default:
      const isImg = name && (name.startsWith('http') || name.includes('.') || name.includes('/') || name.includes('\\'));
      if (isImg && !imageFailed) {
        const srcUrl = resolveImageUrl(name);
        return (
          <div className={containerClass}>
            <img
              src={srcUrl}
              alt="Icon"
              loading="lazy"
              decoding="async"
              className="h-20 w-20 shrink-0 rounded-2xl bg-white/70 object-contain p-2 shadow-sm ring-1 ring-slate-200/70 dark:bg-slate-900/60 dark:ring-white/10"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                setImageFailed(true);
              }}
            />
          </div>
        );
      }
      const IconComponent = iconMap[name] || HelpCircle;
      return (
        <div className={`${containerClass} text-slate-500 dark:text-slate-400`}>
          <IconComponent className="h-16 w-16" />
        </div>
      );
  }
}

// Maps application titles to realistic developer names and categories
const getSubInfo = (app: Aplikasi) => {
  return app.kategori || 'Lainnya';
};

// Generates app-specific brand action colors for the BUKA button
const getBrandButtonClass = (appName: string) => {
  if (appName.includes('Google')) {
    return 'bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 focus:ring-slate-500/25';
  }
  if (appName.includes('YouTube')) {
    return 'bg-[#FF0000] hover:bg-[#E20000] text-white focus:ring-red-500/25';
  }
  if (appName.includes('Facebook')) {
    return 'bg-[#1877F2] hover:bg-[#0F60D8] text-white focus:ring-blue-500/25';
  }
  if (appName.includes('Mobile Legends') || appName.includes('MLBB')) {
    return 'bg-[#F59E0B] hover:bg-[#D97706] text-white focus:ring-amber-500/25';
  }
  if (appName.includes('PUBG')) {
    return 'bg-[#F97316] hover:bg-[#EA580C] text-white focus:ring-orange-500/25';
  }
  if (appName.includes('Valorant')) {
    return 'bg-[#FF4655] hover:bg-[#E13745] text-white focus:ring-red-500/25';
  }
  if (appName.includes('Genshin')) {
    return 'bg-[#06B6D4] hover:bg-[#0891B2] text-white focus:ring-cyan-500/25';
  }
  // Default Game Button
  return 'bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white focus:ring-indigo-500/30';
};

// Generates app-specific brand colors for the authentication pills
const getAuthBadgeClass = (appName: string, authMode: string) => {
  if (appName.includes('Google')) {
    return 'bg-slate-100 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800/60';
  }
  if (appName.includes('YouTube')) {
    return 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-100 dark:border-red-900/30';
  }
  if (appName.includes('Facebook')) {
    return 'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-900/30';
  }
  if (appName.includes('Mobile Legends') || appName.includes('MLBB')) {
    return 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/30';
  }
  if (appName.includes('PUBG')) {
    return 'bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400 border-orange-100 dark:border-orange-900/30';
  }
  if (appName.includes('Valorant')) {
    return 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-100 dark:border-red-900/30';
  }
  if (appName.includes('Genshin')) {
    return 'bg-cyan-50 dark:bg-cyan-950/20 text-cyan-700 dark:text-cyan-400 border-cyan-100 dark:border-cyan-900/30';
  }

  switch (authMode.toUpperCase()) {
    case 'SSO':
    case 'SSO-OAUTH2':
      return 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30';
    case 'INDEPENDENT':
    case 'SSO-SAML':
    case 'API-KEY':
      return 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30';
    default:
      return 'bg-slate-50 dark:bg-slate-900/20 text-slate-700 dark:text-slate-400 border-slate-150 dark:border-slate-800/30';
  }
};

export default function AppCardGrid({ apps, searchQuery, showUuid = false, columns = 3, isEmployee = true }: AppCardGridProps) {
  const { launchApp, launchingApp } = useLaunchApp();
  const [modal, setModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
  });

  // Filter and sort apps by sequence (urutan)
  const filteredApps = apps
    .filter(
      (app) =>
          app.is_active &&
          (app.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.deskripsi.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => a.urutan - b.urutan);

  const handleOpenApp = async (e: React.MouseEvent<HTMLAnchorElement>, app: Aplikasi) => {
    e.preventDefault();
    const cardElement = e.currentTarget.closest('[data-app-card]') as HTMLElement | null;

    if (app.auth_mode !== 'sso') {
      launchApp({
        appName: app.nama,
        url: app.url,
        iconElement: cardElement,
        onBeforeRedirect: async () => {
          try {
            await api.post(`/apps/${app.id}/access`, {});
          } catch (err) {
            console.error('Gagal mencatat akses aplikasi:', err);
          }
        },
      });
      return;
    }

    if (!isEmployee) {
      setModal({
        isOpen: true,
        title: 'Akses SSO Terbatas',
        message: 'Akses SSO hanya tersedia untuk akun yang terhubung ke data karyawan. Silakan hubungi divisi IT untuk melakukan sinkronisasi.',
      });
      return;
    }

    try {
      const res = await api.get<{ token: string; redirectUrl: string }>(`/sso/token?app_id=${app.id}`);
      const token = res.data.token;
      const baseUrl = res.data.redirectUrl || app.url;
      const separator = baseUrl.includes('?') ? '&' : '?';
      const finalUrl = `${baseUrl}${separator}token=${token}`;
      launchApp({ appName: app.nama, url: finalUrl, iconElement: cardElement });
    } catch (err: any) {
      const msg: string =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        'Gagal menginisialisasi login SSO.';
      setModal({
        isOpen: true,
        title: 'Gagal Membuka Aplikasi',
        message: msg,
      });
    }
  };

  return (
    <div className="w-full">
      {filteredApps.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-slate-800/60 rounded-3xl p-8 transition-colors duration-300">
          <HelpCircle className="h-12 w-12 text-slate-300 dark:text-slate-700 animate-pulse" />
          <h3 className="mt-4 text-base font-bold text-slate-800 dark:text-slate-200">Aplikasi Tidak Ditemukan</h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-sm font-medium">
            Tidak ada aplikasi aktif yang cocok dengan kata pencarian &quot;{searchQuery}&quot;. Silakan coba kata kunci lain.
          </p>
        </div>
      ) : (
        <StaggerContainer className={`grid grid-cols-1 gap-4 md:grid-cols-2 ${columns === 4 ? 'xl:grid-cols-4' : 'xl:grid-cols-3'} items-start`} stagger={0.06}>
          {filteredApps.map((app) => {
            const isLockedSso = app.auth_mode === 'sso' && !isEmployee;
            const isLaunching = launchingApp === app.nama;
            return (
              <AnimatedCard
                key={app.id}
                data-app-card
                className={`group perspective-1000 min-h-[12rem] w-full transition-all duration-500 ${isLaunching ? 'scale-[1.03] opacity-70 blur-[1px]' : ''}`}
              >
                {/* Inner 3D Container */}
                <div className="relative w-full rounded-3xl transition-transform duration-500 preserve-3d group-hover:[transform:rotateY(180deg)]">
                  
                  {/* Front Face: App Store Style Icon & Application Name */}
                  <div className={`absolute inset-0 w-full h-full rounded-3xl border border-slate-200 dark:border-slate-800/35 bg-white/70 dark:bg-[#161b26]/70 backdrop-blur-xl shadow-sm flex flex-col items-center justify-center p-5 backface-hidden ${isLockedSso ? 'opacity-75' : ''}`}>
                    {isLockedSso && (
                      <div className="absolute top-4 right-4 bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-450 p-1.5 rounded-full border border-rose-500/20">
                        <Lock className="h-3.5 w-3.5" />
                      </div>
                    )}
                    <AppIcon name={app.icon} />
                    <span className="mt-3 text-sm sm:text-base font-black tracking-tight text-slate-800 dark:text-slate-200 text-center truncate w-full px-2 flex items-center justify-center gap-1">
                      {app.nama}
                    </span>
                    {isLockedSso && (
                      <span className="text-[10px] text-rose-500 dark:text-rose-450 font-bold mt-1 uppercase tracking-wider">
                        Khusus Karyawan
                      </span>
                    )}
                  </div>

                  {/* Back Face: Redesigned Layout with Header, Body, and Footer */}
                  <div className="relative w-full rounded-3xl border border-slate-200 dark:border-slate-800/35 bg-white dark:bg-[#131924]/95 backdrop-blur-xl shadow-lg p-5 flex flex-col justify-between backface-hidden rotate-y-180 min-h-[12rem] gap-2">
                    
                    {/* 1. Header (Full Width Title and Subtitle) */}
                    <div className="min-w-0">
                      <h3 className="truncate text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                        {app.nama}
                        {isLockedSso && <Lock className="h-3.5 w-3.5 text-rose-500 shrink-0" />}
                      </h3>
                      <span className="block text-[9.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mt-0.5 truncate">
                        {getSubInfo(app)}
                      </span>
                      {showUuid && (
                        <span className="block text-[8px] font-mono text-slate-350 dark:text-slate-600 mt-1 truncate select-all" title={app.id}>
                          {app.id}
                        </span>
                      )}
                    </div>

                    {/* 2. Body (Description) */}
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-1 flex-1 font-medium">
                      {isLockedSso 
                        ? 'Aplikasi ini menggunakan integrasi Single Sign-On (SSO) internal karyawan. Akun Anda saat ini belum dihubungkan ke data karyawan.'
                        : app.deskripsi}
                    </p>

                    {/* 3. Footer (Divider + Auth Mode Badge (Left) + BUKA Button (Right)) */}
                    <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/30 pt-2.5 mt-2 w-full shrink-0">
                      {/* Left: Auth Badge */}
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-[8.5px] font-extrabold uppercase tracking-wider ${getAuthBadgeClass(
                          app.nama,
                          app.auth_mode
                        )}`}
                      >
                        {app.auth_mode}
                      </span>

                      {/* Right: BUKA Pill Button */}
                      <a
                        href={app.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => handleOpenApp(e, app)}
                        className={`inline-flex items-center justify-center rounded-full px-5 py-1.5 text-xs font-black tracking-wider transition-all duration-200 cursor-pointer shadow-sm hover:shadow hover:scale-[1.03] active:scale-95 focus:outline-none focus:ring-2 ${
                          isLockedSso 
                            ? 'bg-slate-200 dark:bg-slate-850 hover:bg-slate-300 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-300/40 dark:border-slate-700/40' 
                            : getBrandButtonClass(app.nama)
                        }`}
                      >
                        {isLockedSso ? 'TERKUNCI' : 'BUKA'}
                      </a>
                    </div>
                  </div>

                </div>
              </AnimatedCard>
            );
          })}
        </StaggerContainer>
      )}

      {modal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white p-6 shadow-2xl dark:bg-[#121620] border border-slate-200 dark:border-slate-800/80 transition-all transform scale-100 duration-300">
            
            {/* Header / Icon */}
            <div className="flex items-start gap-4">
              {/* <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-450 border border-rose-100 dark:border-rose-900/30">
                <ShieldAlert className="h-5 w-5" />
              </div> */}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                  {modal.title}
                </h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  {modal.message}
                </p>
              </div>
            </div>

            {/* Action Button */}
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setModal(prev => ({ ...prev, isOpen: false }))}
                className="rounded-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 px-6 py-2 text-xs font-black tracking-wider text-white dark:text-slate-900 transition-all duration-200 shadow-sm hover:shadow active:scale-95"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
