'use client';

import React, { useState } from 'react';
import {
  Building2, Briefcase, GraduationCap, Heart, MapPin, Layers
} from 'lucide-react';
import TabStatusKaryawan from './components/TabStatusKaryawan';
import TabGrade from './components/TabGrade';
import TabTipeUnit from './components/TabTipeUnit';
import TabPendidikan from './components/TabPendidikan';
import TabStatusNikah from './components/TabStatusNikah';
import TabPenempatanArea from './components/TabPenempatanArea';
import TabRoleAplikasi from './components/TabRoleAplikasi';

// ─── TABS CONFIG ───────────────────────────────────────────────────────────────
const TABS = [
  {
    id: 'status-kary',
    label: 'Status Karyawan',
    icon: Briefcase,
    accentText: 'text-slate-900 dark:text-white',
    accentBg: 'bg-slate-50 dark:bg-slate-800',
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
    id: 'role-aplikasi',
    label: 'Role Aplikasi',
    icon: Layers,
    accentText: 'text-slate-900 dark:text-white',
    accentBg: 'bg-slate-50 dark:bg-slate-800',
    Component: TabRoleAplikasi
  },
];

export default function MasterDataPage() {
  const [activeTab, setActiveTab] = useState('status-kary');
  const activeTabObj = TABS.find(t => t.id === activeTab) || TABS[0];
  const ActiveComponent = activeTabObj.Component;

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
      <div className="relative overflow-hidden rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="flex overflow-x-auto">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold whitespace-nowrap transition-colors duration-150 cursor-pointer focus:outline-none border-b-2 ${
                  isActive
                    ? `border-slate-900 dark:border-slate-100 ${tab.accentText} ${tab.accentBg}`
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-950'
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
