'use client';

import React from 'react';
import { 
  Clock, 
  BookOpen, 
  ShieldCheck, 
  FileText, 
  Calendar, 
  Layers, 
  ShoppingBag, 
  HelpCircle,
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
}

interface AppCardGridProps {
  apps: Aplikasi[];
  searchQuery: string;
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

// Returns a beautiful iOS App Store style icon squircle container
function AppIcon({ name }: { name: string }) {
  const containerClass = "h-16 w-16 shrink-0 flex items-center justify-center transition-transform duration-300 bg-transparent";

  switch (name) {
    case 'Google':
      return (
        <div className={containerClass}>
          <svg viewBox="0 0 24 24" className="h-12 w-12">
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
          <svg viewBox="0 0 24 24" className="h-12 w-12" fill="#FF0000">
            <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.516 0-9.387.507a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.871.507 9.387.507 9.387.507s7.517 0 9.387-.507a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837Z" />
            <path d="M9.545 15.568V8.432L15.818 12l-6.273 3.568Z" fill="currentColor" className="text-white dark:text-slate-900" />
          </svg>
        </div>
      );
    case 'Facebook':
      return (
        <div className={containerClass}>
          <svg viewBox="0 0 24 24" className="h-12 w-12" fill="#1877F2">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073Z" />
          </svg>
        </div>
      );
    case 'MLBB': // Mobile Legends
      return (
        <div className={containerClass}>
          <svg viewBox="0 0 24 24" className="h-12 w-12" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" fill="#F59E0B" fillOpacity="0.2"/>
            <path d="M3 20h18" strokeWidth="3" />
          </svg>
        </div>
      );
    case 'PUBG': // PUBG Mobile
      return (
        <div className={containerClass}>
          <svg viewBox="0 0 24 24" className="h-12 w-12" fill="none" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
          <svg viewBox="0 0 24 24" className="h-12 w-12">
            <path fill="#FF4655" d="M3 3h6.5l7.5 18H10.5L3 3z" />
            <path fill="#FF4655" d="M21 3h-6.5l-3.5 8.5h6.5L21 3z" />
          </svg>
        </div>
      );
    case 'Genshin': // Genshin Impact
      return (
        <div className={containerClass}>
          <svg viewBox="0 0 24 24" className="h-12 w-12" fill="none" stroke="#06B6D4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2z" fill="#06B6D4" fillOpacity="0.2" />
            <path d="M12 7l1.5 3.5L17 12l-3.5 1.5L12 17l-1.5-3.5L7 12l3.5-1.5L12 7z" fill="#E0F2FE" />
          </svg>
        </div>
      );
    default:
      const IconComponent = iconMap[name] || HelpCircle;
      return (
        <div className={`${containerClass} text-slate-500 dark:text-slate-400`}>
          <IconComponent className="h-12 w-12" />
        </div>
      );
  }
}

// Maps application titles to realistic developer names and categories
const getSubInfo = (appName: string) => {
  if (appName.includes('Google')) return 'Google LLC • Produktivitas';
  if (appName.includes('YouTube')) return 'YouTube, LLC • Hiburan';
  if (appName.includes('Facebook')) return 'Meta Platforms • Sosial';
  if (appName.includes('Mobile Legends') || appName.includes('MLBB')) return 'Moonton • Game MOBA';
  if (appName.includes('PUBG')) return 'Tencent Games • Battle Royale';
  if (appName.includes('Valorant')) return 'Riot Games • FPS Taktis';
  if (appName.includes('Genshin')) return 'HoYoverse • Open-World RPG';
  return 'Game Online Terpopuler';
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
    case 'SSO-OAUTH2':
      return 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30';
    case 'SSO-SAML':
      return 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30';
    default:
      return 'bg-slate-50 dark:bg-slate-900/20 text-slate-700 dark:text-slate-400 border-slate-150 dark:border-slate-800/30';
  }
};

export default function AppCardGrid({ apps, searchQuery }: AppCardGridProps) {
  // Filter and sort apps by sequence (urutan)
  const filteredApps = apps
    .filter(
      (app) =>
        app.is_active &&
        (app.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
          app.deskripsi.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => a.urutan - b.urutan);

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
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 items-start">
          {filteredApps.map((app, index) => (
            <div
              key={app.id}
              style={{ animationDelay: `${index * 75}ms` }}
              className="group perspective-1000 min-h-[10rem] w-full animate-fade-up fill-mode-both"
            >
              {/* Inner 3D Container */}
              <div className="relative w-full rounded-3xl transition-transform duration-500 preserve-3d group-hover:[transform:rotateY(180deg)]">
                
                {/* Front Face: App Store Style Icon & Application Name */}
                <div className="absolute inset-0 w-full h-full rounded-3xl border border-slate-200 dark:border-slate-800/35 bg-white/70 dark:bg-[#161b26]/70 backdrop-blur-xl shadow-sm flex flex-col items-center justify-center p-4 backface-hidden">
                  <AppIcon name={app.icon} />
                  <span className="mt-2.5 text-xs sm:text-sm font-extrabold tracking-tight text-slate-800 dark:text-slate-200 text-center truncate w-full px-2">
                    {app.nama}
                  </span>
                </div>

                {/* Back Face: Redesigned Layout with Header, Body, and Footer */}
                <div className="relative w-full rounded-3xl border border-slate-200 dark:border-slate-800/35 bg-white dark:bg-[#131924]/95 backdrop-blur-xl shadow-lg p-4 flex flex-col justify-between backface-hidden rotate-y-180 min-h-[10rem] gap-2">
                  
                  {/* 1. Header (Full Width Title and Subtitle) */}
                  <div className="min-w-0">
                    <h3 className="truncate text-sm sm:text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
                      {app.nama}
                    </h3>
                    <span className="block text-[9.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mt-0.5 truncate">
                      {getSubInfo(app.nama)}
                    </span>
                  </div>

                  {/* 2. Body (Description) */}
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-1 flex-1 font-medium">
                    {app.deskripsi}
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
                      className={`inline-flex items-center justify-center rounded-full px-5 py-1.5 text-xs font-black tracking-wider transition-all duration-200 cursor-pointer shadow-sm hover:shadow hover:scale-[1.03] active:scale-95 focus:outline-none focus:ring-2 ${getBrandButtonClass(
                        app.nama
                      )}`}
                    >
                      BUKA
                    </a>
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
