'use client';

import React from 'react';
import Image from 'next/image';
import LoginCard from '@/components/login/LoginCard';
import { HoleBackground } from '@/components/animate-ui/components/backgrounds/hole';

export default function LoginPage() {
  return (
    <div className="relative min-h-screen w-full bg-[#f8fafc] dark:bg-[#0b0f17] overflow-x-hidden transition-colors duration-300">
      {/* Hole Background */}
      <HoleBackground className="absolute inset-0 z-0" />

      {/* Floating Top-Left Glassmorphism Brand Card */}
      <header className="absolute top-4 left-4 right-4 sm:top-8 sm:left-8 sm:right-auto z-30 flex items-center gap-3 rounded-2xl border border-white/60 dark:border-slate-800/35 bg-white/30 dark:bg-[#121620]/30 backdrop-blur-xl px-5 py-2.5 shadow-[0_8px_32px_-6px_rgba(15,23,42,0.15)] dark:shadow-[0_8px_32px_-6px_rgba(0,0,0,0.5)] transition-all duration-300">
        <Image
          src="/img/logo.png"
          alt="Logo PT INL"
          width={90}
          height={90}
          className="h-10 w-10 sm:h-12 sm:w-12 object-contain"
        />
        <div className="flex flex-col">
          <span className="text-xs sm:text-sm font-bold tracking-tight text-slate-800 dark:text-slate-200">PT Industri Nabati Lestari</span>
          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-indigo-650 dark:text-indigo-400">Portal SSO</span>
        </div>
      </header>

      {/* Floating Top-Right Quick Link */}
      <div className="absolute top-9 right-6 sm:right-8 z-30 hidden sm:block">
        <a
          href="https://inl.co.id"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold text-slate-650 hover:text-indigo-650 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors cursor-pointer"
        >
          Situs Utama →
        </a>
      </div>

      {/* Foreground */}
      <div className="relative z-20 flex min-h-screen flex-col items-center justify-center p-4">
        <div className="w-full flex-1 flex flex-col items-center justify-center pt-20 pb-4 sm:py-12 md:py-24 -mb-10 animate-ios-page">
          <LoginCard />
        </div>
        {/* Footer */}
        <p className="text-center text-xs text-slate-500 dark:text-slate-400 font-medium pb-2">
          © {new Date().getFullYear()} PT Industri Nabati Lestari — KEK Sei Mangkei. Seluruh hak cipta dilindungi.
        </p>
      </div>
    </div>
  );
}
