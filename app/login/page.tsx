'use client';

import React, { useState, useRef, useMemo } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';
import LoginCard from '@/components/login/LoginCard';
import { HoleBackground } from '@/components/animate-ui/components/backgrounds/hole';
import { ThemeTogglerButton } from '@/components/animate-ui/components/buttons/theme-toggler';

// Lazy-loaded WebGL scene — only loads when needed, excluded from SSR
const Inl3DScene = dynamic(() => import('@/components/login/Inl3DScene'), { ssr: false });

/**
 * Detect whether the current device is low-end.
 * Criteria: ≤4 logical CPU cores or browser reports saveData / reduced motion preference.
 * This runs once at mount time and never changes.
 */
function useIsLowEnd(): boolean {
  return useMemo(() => {
    if (typeof navigator === 'undefined') return false;
    const cores = navigator.hardwareConcurrency ?? 4;
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return cores <= 4 || prefersReduced;
  }, []);
}

// const soundwaveStyle = `
//   @keyframes soundwave-1 { 0%, 100% { height: 4px; } 50% { height: 14px; } }
//   @keyframes soundwave-2 { 0%, 100% { height: 6px; } 50% { height: 16px; } }
//   @keyframes soundwave-3 { 0%, 100% { height: 12px; } 50% { height: 4px; } }
//   @keyframes soundwave-4 { 0%, 100% { height: 5px; } 50% { height: 15px; } }
//   .animate-soundwave-1 { animation: soundwave-1 0.8s ease-in-out infinite; }
//   .animate-soundwave-2 { animation: soundwave-2 0.7s ease-in-out infinite 0.1s; }
//   .animate-soundwave-3 { animation: soundwave-3 0.9s ease-in-out infinite 0.2s; }
//   .animate-soundwave-4 { animation: soundwave-4 0.6s ease-in-out infinite 0.15s; }
// `;

export default function LoginPage() {
  const isLowEnd = useIsLowEnd();

  const [isPlaying, setIsPlaying] = useState(false);
  const [is3dHovered, setIs3dHovered] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch((err) => console.log('Audio playback blocked:', err));
      setIsPlaying(true);
    }
  };

  // Adaptive HoleBackground counts: halved on low-end
  const holeLines = isLowEnd ? 28 : 55;
  const holeDiscs  = isLowEnd ? 28 : 55;

  return (
    <div className="relative min-h-screen lg:h-screen w-full bg-[#f8fafc] dark:bg-[#0b0f17] lg:overflow-hidden transition-colors duration-300">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes soundwave-1 { 0%, 100% { height: 4px; } 50% { height: 14px; } }
        @keyframes soundwave-2 { 0%, 100% { height: 6px; } 50% { height: 16px; } }
        @keyframes soundwave-3 { 0%, 100% { height: 12px; } 50% { height: 4px; } }
        @keyframes soundwave-4 { 0%, 100% { height: 5px; } 50% { height: 15px; } }
        .animate-soundwave-1 { animation: soundwave-1 0.8s ease-in-out infinite; }
        .animate-soundwave-2 { animation: soundwave-2 0.7s ease-in-out infinite 0.1s; }
        .animate-soundwave-3 { animation: soundwave-3 0.9s ease-in-out infinite 0.2s; }
        .animate-soundwave-4 { animation: soundwave-4 0.6s ease-in-out infinite 0.15s; }
      `}} />

      {/* Floating Top-Right Quick Actions */}
      <div className="login-quick-actions absolute top-4 right-4 z-30 flex items-center gap-4 sm:top-8 sm:right-8">
        <a
          href="https://inl.co.id"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold text-slate-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-500 transition-colors cursor-pointer hidden sm:block"
        >
          Situs Utama →
        </a>
        <ThemeTogglerButton variant="pill" size="sm" />
      </div>

      {/* Foreground */}
      <div className="relative z-20 flex min-h-screen lg:h-full w-full flex-col lg:flex-row justify-between">
        {/* Left Side: Login Form (Flex layout to prevent overlapping) */}
        <div className={cn(
          'w-full lg:w-[45%] min-h-screen lg:h-screen flex flex-col justify-between py-6 px-4 sm:p-8 md:p-10 lg:py-8 z-20 relative lg:overflow-y-auto',
          'bg-white/5 dark:bg-slate-950/10 border-r border-white/5 dark:border-slate-800/10',
          // Lighter backdrop blur on low-end to save GPU memory bandwidth
          isLowEnd ? 'backdrop-blur-sm' : 'backdrop-filter backdrop-blur-[2px]',
        )}>
          {/* Brand Header inside left side */}
          <header className={cn(
            'login-header flex items-center gap-3 rounded-2xl border select-none w-fit',
            'border-t-white/60 border-l-white/60 border-r-white/20 border-b-white/10',
            'bg-gradient-to-br from-white/20 to-white/10 dark:from-[#121620]/20 dark:to-[#121620]/10',
            isLowEnd ? 'backdrop-blur-md' : 'backdrop-filter backdrop-blur-2xl',
            'px-4 py-2 shadow-sm'
          )}>
            <Image
              src="/img/logo.png"
              alt="Logo PT INL"
              width={40}
              height={40}
              className="h-10 w-10 object-contain"
              priority
            />
            <div className="flex flex-col">
              <span className="text-xs font-bold tracking-tight text-slate-800 dark:text-slate-100">PT Industri Nabati Lestari</span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-500">Portal SSO</span>
            </div>
          </header>

          <div className="login-card-container w-full flex-1 flex items-center justify-center py-6 sm:py-8 animate-ios-page max-w-md mx-auto">
            <LoginCard />
          </div>

          {/* Footer relative to panel */}
          <p className="text-center text-xs text-slate-500 dark:text-slate-450 font-medium select-none z-30 pt-4">
            © {new Date().getFullYear()} PT Industri Nabati Lestari — KEK Sei Mangkei. Seluruh hak cipta dilindungi.
          </p>
        </div>

        {/* Slanted Glowing Neon Divider Line */}
        <div className="absolute top-0 bottom-0 left-[45%] w-[1.5px] bg-gradient-to-b from-brand/20 via-brand to-brand/20 z-30 hidden lg:block shadow-[0_0_20px_rgba(var(--brand-rgb),0.6)] transform -skew-x-6 origin-top pointer-events-none" />

        {/* Right Side: Animated 3D INL Logo */}
        <div 
          onMouseEnter={() => setIs3dHovered(true)}
          onMouseLeave={() => setIs3dHovered(false)}
          className="relative hidden lg:flex lg:flex-1 h-full items-center justify-center z-10 bg-slate-100/10 dark:bg-slate-950/20"
        >
          {/* Ambient glow highlights — skip costly blur-3xl on low-end */}
          {!isLowEnd && (
            <>
              <div 
                className={cn(
                  "absolute left-1/4 top-1/3 h-96 w-96 rounded-full blur-3xl pointer-events-none transition-all duration-700 ease-out transform-gpu",
                  is3dHovered ? "opacity-35 dark:opacity-45 scale-125" : "opacity-20 dark:opacity-20 scale-100"
                )} 
                style={{ background: is3dHovered ? 'rgba(var(--brand-dark-rgb), 0.75)' : 'rgba(var(--brand-rgb), 0.5)' }} 
              />
              <div 
                className={cn(
                  "absolute right-1/4 bottom-1/3 h-80 w-80 rounded-full blur-3xl pointer-events-none transition-all duration-700 ease-out transform-gpu",
                  is3dHovered ? "opacity-25 dark:opacity-35 scale-115" : "opacity-15 dark:opacity-15 scale-100"
                )} 
                style={{ background: is3dHovered ? 'rgba(59, 130, 246, 0.65)' : 'rgba(59, 130, 246, 0.4)' }} 
              />
            </>
          )}

          {/* Hole Background */}
          <HoleBackground
            className="absolute inset-y-0 -left-[20%] -right-[20%] z-0"
            style={{
              maskImage: 'linear-gradient(to right, transparent, rgba(0, 0, 0, 1) 30%)',
              WebkitMaskImage: 'linear-gradient(to right, transparent, rgba(0, 0, 0, 1) 30%)',
            }}
            strokeColor="#737373"
            numberOfLines={holeLines}
            numberOfDiscs={holeDiscs}
            particleRGBColor={[255, 255, 255]}
            lowEndMode={isLowEnd}
          />

          {/* 3D Scene */}
          <div className="absolute inset-y-0 -left-[20%] -right-[20%] z-10">
            <Inl3DScene isHoveredExternal={is3dHovered} />
          </div>

          {/* Floating Audio Controller */}
          <div className="absolute bottom-4 right-4 z-30 flex items-center gap-3">
            <audio ref={audioRef} src="/audio/lagu-login.mp3" loop preload="none" />
            <button
              onClick={togglePlay}
              className="flex items-center gap-2.5 rounded-full border border-white/20 dark:border-white/10 bg-white/20 dark:bg-black/35 backdrop-blur-md px-4 py-2 text-[10px] tracking-wider font-bold text-slate-800 dark:text-slate-250 shadow-md hover:bg-white/35 dark:hover:bg-black/45 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer focus:outline-none"
              title={isPlaying ? 'Senyapkan Audio Latar' : 'Putar Audio Latar'}
            >
              <div className="flex items-end gap-[2px] h-3 w-4">
                <div className={cn('w-[2px] bg-amber-500 dark:bg-amber-400 rounded-full transition-all duration-300', isPlaying ? 'animate-soundwave-1' : 'h-1')} />
                <div className={cn('w-[2px] bg-amber-500 dark:bg-amber-400 rounded-full transition-all duration-300', isPlaying ? 'animate-soundwave-2' : 'h-1.5')} />
                <div className={cn('w-[2px] bg-amber-500 dark:bg-amber-400 rounded-full transition-all duration-300', isPlaying ? 'animate-soundwave-3' : 'h-2.5')} />
                <div className={cn('w-[2px] bg-amber-500 dark:bg-amber-400 rounded-full transition-all duration-300', isPlaying ? 'animate-soundwave-4' : 'h-1.5')} />
              </div>
              <span>{isPlaying ? 'MUTE BACKGROUND' : 'PLAY AMBIENT'}</span>
            </button>
          </div>

          <p className="absolute bottom-6 left-0 right-0 text-center text-xs text-slate-450 dark:text-slate-500/55 font-medium select-none pointer-events-none tracking-wide z-20">
            PT Industri Nabati Lestari — Produsen Olahan Kelapa Sawit Terintegrasi
          </p>
        </div>
      </div>
    </div>
  );
}