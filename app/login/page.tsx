'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Scene from '@/components/login/Scene';
import LoginCard from '@/components/login/LoginCard';

// ---- Small hook: is the viewport a small screen? ----
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
  );
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [breakpoint]);
  return isMobile;
}

export default function LoginPage() {
  const mobile = useIsMobile();

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-amber-50 overflow-x-hidden">
      {/* Floating Top-Left Glassmorphism Brand Card */}
      <header className="absolute top-4 left-4 right-4 sm:top-8 sm:left-8 sm:right-auto z-30 flex items-center gap-3 rounded-2xl border border-white/60 bg-white/20 backdrop-blur-xl px-5 py-2.5 shadow-[0_8px_32px_-6px_rgba(15,23,42,0.1)]">
        <Image
          src="/img/logo.png"
          alt="Logo PT INL"
          width={90}
          height={90}
          className="h-10 w-10 sm:h-12 sm:w-12 object-contain"
        />
        <div className="flex flex-col">
          <span className="text-xs sm:text-sm font-bold tracking-tight text-slate-800">PT Industri Nabati Lestari</span>
          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-indigo-600">Portal SSO</span>
        </div>
      </header>

      {/* Floating Top-Right Quick Link */}
      <div className="absolute top-9 right-6 sm:right-8 z-30 hidden sm:block">
        <a
          href="https://inl.co.id"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer"
        >
          Situs Utama →
        </a>
      </div>

      {/* 3D background (orbits around the viewport, behind the card) */}
      <div className="absolute inset-0 z-0">
        <Scene mobile={mobile} />
      </div>

      {/* soft radial vignette so the centered card reads clearly above the orbiting 3D */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background:
            'radial-gradient(circle at 50% 45%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.15) 35%, transparent 65%)',
        }}
      />

      {/* Foreground */}
      <div className="relative z-20 flex min-h-screen flex-col items-center justify-center p-4">
        <div className="w-full flex-1 flex flex-col items-center justify-center pt-20 pb-4 sm:py-12 md:py-24 -mb-10">
          <LoginCard />
        </div>
          {/* Footer */}
          <p className="text-center text-xs text-slate-500 font-medium pb-2">
            © {new Date().getFullYear()} PT Industri Nabati Lestari — KEK Sei Mangkei. Seluruh hak cipta dilindungi.
          </p>
      </div>
    </div>
  );
}
