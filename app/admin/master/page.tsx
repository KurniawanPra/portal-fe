'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Building2, Briefcase, GraduationCap, Heart, MapPin, Layers, BookOpen,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import TabStatusKaryawan from './components/TabStatusKaryawan';
import TabGrade from './components/TabGrade';
import TabTipeUnit from './components/TabTipeUnit';
import TabPendidikan from './components/TabPendidikan';
import TabStatusNikah from './components/TabStatusNikah';
import TabPenempatanArea from './components/TabPenempatanArea';
import TabKategoriAplikasi from './components/TabKategoriAplikasi';
import TabAgama from './components/TabAgama';

// ─── TABS CONFIG ───────────────────────────────────────────────────────────────
const TABS = [
  {
    id: 'status-kary',
    label: 'Status Karyawan',
    icon: Briefcase,
    accentText: 'text-slate-900 dark:text-white',
    accentBg: 'bg-slate-50 dark:bg-slate-805',
    Component: TabStatusKaryawan
  },
  {
    id: 'grade',
    label: 'Grade / Golongan',
    icon: Building2,
    accentText: 'text-slate-900 dark:text-white',
    accentBg: 'bg-slate-50 dark:bg-slate-800',
    Component: TabGrade
  },
  {
    id: 'tipe-unit',
    label: 'Tipe Unit',
    icon: Building2,
    accentText: 'text-slate-900 dark:text-white',
    accentBg: 'bg-slate-50 dark:bg-slate-800',
    Component: TabTipeUnit
  },
  {
    id: 'pendidikan',
    label: 'Pendidikan',
    icon: GraduationCap,
    accentText: 'text-slate-900 dark:text-white',
    accentBg: 'bg-slate-50 dark:bg-slate-800',
    Component: TabPendidikan
  },
  {
    id: 'status-nikah',
    label: 'Status Pernikahan',
    icon: Heart,
    accentText: 'text-slate-900 dark:text-white',
    accentBg: 'bg-slate-50 dark:bg-slate-800',
    Component: TabStatusNikah
  },
  {
    id: 'penempatan-area',
    label: 'Penempatan Area',
    icon: MapPin,
    accentText: 'text-slate-900 dark:text-white',
    accentBg: 'bg-slate-50 dark:bg-slate-800',
    Component: TabPenempatanArea
  },
  {
    id: 'kategori-app',
    label: 'Kategori Aplikasi',
    icon: Layers,
    accentText: 'text-slate-900 dark:text-white',
    accentBg: 'bg-slate-50 dark:bg-slate-800',
    Component: TabKategoriAplikasi
  },
  {
    id: 'agama',
    label: 'Agama',
    icon: BookOpen,
    accentText: 'text-slate-900 dark:text-white',
    accentBg: 'bg-slate-50 dark:bg-slate-800',
    Component: TabAgama
  },
];

export default function MasterDataPage() {
  const [activeTab, setActiveTab] = useState('status-kary');
  const [canScrollLeft, setCanScrollLeft]   = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeTabObj = TABS.find(t => t.id === activeTab) || TABS[0];
  const ActiveComponent = activeTabObj.Component;

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      ro.disconnect();
    };
  }, [updateScrollState]);

  const scrollBy = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'right' ? 200 : -200, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
          Master Data
        </h1>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          Kelola data referensi sistem Portal SSO PT INL — Status Karyawan, Grade, Tipe Unit, Pendidikan, Status Pernikahan, dan Penempatan Area Kerja.
        </p>
      </div>

      {/* Tab Bar */}
      <div className="relative overflow-hidden rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0f1623] shadow-sm">

        {/* Left transparent scroll button */}
        {canScrollLeft && (
          <button
            onClick={() => scrollBy('left')}
            className="absolute left-0 top-0 bottom-0 z-20 flex items-center justify-center w-8 bg-gradient-to-r from-white/90 to-white/10 dark:from-[#0f1623]/90 dark:to-[#0f1623]/10 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer focus:outline-none"
            aria-label="Scroll tab ke kiri"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}

        {/* Right transparent scroll button */}
        {canScrollRight && (
          <button
            onClick={() => scrollBy('right')}
            className="absolute right-0 top-0 bottom-0 z-20 flex items-center justify-center w-8 bg-gradient-to-l from-white/90 to-white/10 dark:from-[#0f1623]/90 dark:to-[#0f1623]/10 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer focus:outline-none"
            aria-label="Scroll tab ke kanan"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}

        {/* Scrollable tab list */}
        <div ref={scrollRef} className="flex overflow-x-auto hide-scrollbar">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer focus:outline-none border-b-2 ${
                  isActive
                    ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-500/5 dark:bg-amber-500/10'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/[0.04]'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        <ActiveComponent />
      </div>
    </div>
  );
}
