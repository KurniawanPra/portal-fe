'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  LayoutGrid, Users, Shield, TrendingUp, AlertTriangle,
  CheckCircle2, Activity, Zap, Lock, ChevronLeft, ChevronRight,
  CalendarDays, BarChart3, ArrowUpRight
} from 'lucide-react';

// ─── Animated Counter ─────────────────────────────────────────────────────────
function AnimatedCounter({ to, duration = 1000 }: { to: number; duration?: number }) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.ceil(to / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= to) { setValue(to); clearInterval(timer); }
      else setValue(start);
    }, 16);
    return () => clearInterval(timer);
  }, [to, duration]);
  return <>{value.toLocaleString('id-ID')}</>;
}

// ─── Access Log Mock Data ──────────────────────────────────────────────────────
const APPS = [
  { id: 'google', name: 'Google Workspace', color: '#f59e0b' },
  { id: 'erp',    name: 'ERP SAP Internal', color: '#6366f1' },
  { id: 'hcm',    name: 'HCM SunFish',      color: '#10b981' },
  { id: 'teams',  name: 'MS Teams',         color: '#3b82f6' },
  { id: 'lms',    name: 'Learning Mgmt',    color: '#ec4899' },
  { id: 'youtube',name: 'YouTube Studio',   color: '#f97316' },
  { id: 'fb',     name: 'Workplace FB',     color: '#8b5cf6' },
];

type AppId = 'google'|'erp'|'hcm'|'teams'|'lms'|'youtube'|'fb';

interface DailyLog {
  key: string; // e.g. "2026-06-01"
  label: string; // e.g. "01"
  day: number;
  apps: Record<AppId, number>;
  total: number;
}

const MONTH_NAMES = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const MONTH_SHORT = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agt','Sep','Okt','Nov','Des'];

// Seed-based simple randomizer so it's deterministic for the same month/year
const generateDailyLogs = (year: number, month: number): DailyLog[] => {
  const daysInMonth = new Date(year, month, 0).getDate();
  const logs: DailyLog[] = [];
  
  const getSeededRandom = (seed: number) => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const seed = year * 1000 + month * 32 + day;
    
    const apps: Record<AppId, number> = {} as any;
    let total = 0;
    
    APPS.forEach((app, index) => {
      const baseLoad = {
        google: 35,
        erp: 26,
        hcm: 22,
        teams: 18,
        lms: 12,
        youtube: 8,
        fb: 10
      }[app.id] || 10;
      
      const weekendFactor = isWeekend ? 0.2 : 1.0;
      const rand = getSeededRandom(seed + index) * 0.4 + 0.8; // 0.8 to 1.2
      const val = Math.round(baseLoad * weekendFactor * rand);
      apps[app.id as AppId] = val;
      total += val;
    });
    
    const label = day.toString().padStart(2, '0');
    
    logs.push({
      key: `${year}-${month.toString().padStart(2, '0')}-${label}`,
      label,
      day,
      apps,
      total
    });
  }
  return logs;
};

// ─── Custom Month Picker ───────────────────────────────────────────────────────
interface MonthPickerProps {
  value: { year: number; month: number };
  onChange: (v: { year: number; month: number }) => void;
  label: string;
  minDate?: { year: number; month: number };
  maxDate?: { year: number; month: number };
}

function MonthPicker({ value, onChange, label, minDate, maxDate }: MonthPickerProps) {
  const [open, setOpen] = useState(false);
  const [navYear, setNavYear] = useState(value.year);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const isDisabled = (y: number, m: number) => {
    if (minDate && (y < minDate.year || (y === minDate.year && m < minDate.month))) return true;
    if (maxDate && (y > maxDate.year || (y === maxDate.year && m > maxDate.month))) return true;
    return false;
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setOpen(!open); setNavYear(value.year); }}
        className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0a0f1a] px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-350 hover:border-amber-500/30 dark:hover:border-amber-500/30 hover:text-amber-600 dark:hover:text-amber-300 transition-all duration-200 cursor-pointer focus:outline-none"
      >
        <CalendarDays className="h-3.5 w-3.5 text-slate-450 dark:text-slate-500" />
        <span className="text-slate-450 dark:text-slate-500 font-semibold">{label}:</span>
        <span>{MONTH_SHORT[value.month - 1]} {value.year}</span>
      </button>

      {open && (
        <div className="absolute right-0 sm:left-0 top-full mt-1.5 z-50 w-64 rounded-2xl border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-[#0d1218] shadow-2xl shadow-slate-900/10 dark:shadow-black/40 overflow-hidden">
          {/* Top accent */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />

          {/* Year nav */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-white/[0.06]">
            <button
              onClick={() => setNavYear(y => y - 1)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:text-slate-700 dark:hover:text-slate-200 transition-all cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-black text-slate-800 dark:text-slate-100">{navYear}</span>
            <button
              onClick={() => setNavYear(y => y + 1)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:text-slate-700 dark:hover:text-slate-200 transition-all cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Month grid */}
          <div className="grid grid-cols-3 gap-1 p-3 bg-white dark:bg-[#0d1218]">
            {MONTH_SHORT.map((m, i) => {
              const mNum = i + 1;
              const isSelected = navYear === value.year && mNum === value.month;
              const disabled = isDisabled(navYear, mNum);
              return (
                <button
                  key={m}
                  disabled={disabled}
                  onClick={() => { onChange({ year: navYear, month: mNum }); setOpen(false); }}
                  className={`rounded-lg py-2 text-xs font-bold transition-all duration-150 cursor-pointer focus:outline-none ${
                    isSelected
                      ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                      : disabled
                        ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
                        : 'text-slate-600 dark:text-slate-450 hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {m}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Bar Chart Component ───────────────────────────────────────────────────────
function AccessBarChart({ data }: { data: DailyLog[] }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const maxTotal = Math.max(...data.map(d => d.total), 1);
  const CHART_H = 180;

  return (
    <div className="relative pt-4">
      {/* Y-axis guide lines */}
      <div className="absolute inset-x-5 top-4 flex flex-col justify-between pointer-events-none" style={{ height: CHART_H }}>
        {[100, 75, 50, 25, 0].map(pct => (
          <div key={pct} className="flex items-center gap-2">
            <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-600 w-6 text-right shrink-0">
              {Math.round((maxTotal * pct) / 100)}
            </span>
            <div className="flex-1 border-t border-dashed border-slate-100 dark:border-white/[0.04]" />
          </div>
        ))}
      </div>

      {/* Bars */}
      <div className="relative flex items-end gap-[2px] sm:gap-[3px] md:gap-1.5 pl-10 pr-5" style={{ height: CHART_H + 32 }}>
        {data.map(d => {
          const barH = Math.max(4, (d.total / maxTotal) * CHART_H);
          const isHov = hovered === d.key;
          return (
            <div
              key={d.key}
              className="group relative flex flex-col items-center flex-1 pb-7 cursor-crosshair"
              onMouseEnter={() => setHovered(d.key)}
              onMouseLeave={() => setHovered(null)}
            >
              {/* Tooltip */}
              {isHov && (
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 w-44 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-white/95 dark:bg-[#0d1218]/95 shadow-2xl shadow-black/30 dark:shadow-black/50 p-3 pointer-events-none transition-all duration-200 animate-scale-in">
                  <p className="text-xs font-black text-slate-800 dark:text-slate-200 mb-2">Tanggal {d.label}</p>
                  <p className="text-[10px] font-black text-amber-500 dark:text-amber-400 mb-2">{d.total.toLocaleString('id-ID')} total akses</p>
                  <div className="space-y-1.5">
                    {APPS.map(app => (
                      <div key={app.id} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: app.color }} />
                          <span className="text-[10px] text-slate-500 dark:text-slate-450 truncate">{app.name}</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-700 dark:text-slate-350">{(d.apps as Record<string,number>)[app.id]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Value label */}
              <span className={`text-[8px] font-black mb-1 transition-colors duration-200 ${isHov ? 'text-amber-500 dark:text-amber-400' : 'text-slate-400 dark:text-slate-600'}`}>
                {d.total}
              </span>

              {/* Bar */}
              <div
                className={`w-full rounded-t transition-all duration-300 ${isHov ? 'opacity-100 scale-x-[1.1]' : 'opacity-80'}`}
                style={{
                  height: barH,
                  background: isHov
                    ? 'linear-gradient(to bottom, #fbbf24, #d97706)'
                    : 'linear-gradient(to bottom, rgba(245,158,11,0.5), rgba(217,119,6,0.3))',
                  boxShadow: isHov ? '0 0 8px rgba(245,158,11,0.3)' : 'none',
                  transformOrigin: 'bottom',
                }}
              />

              {/* Day label (display conditionally to avoid crowding) */}
              <span className="absolute bottom-0 text-[9px] font-bold text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
                {(d.day % 5 === 0 || d.day === 1 || d.day === data.length) ? d.label : ''}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Activity log ─────────────────────────────────────────────────────────────
const ACTIVITY_LOG = [
  { icon: CheckCircle2, color: 'text-emerald-500 dark:text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', text: 'Aplikasi "HCM SunFish" diaktifkan oleh Admin',     time: '10 mnt lalu' },
  { icon: Users,        color: 'text-indigo-500 dark:text-indigo-400',  bg: 'bg-indigo-500/10  border-indigo-500/20',  text: 'User "Hendra Gunawan" di-suspend dari portal',     time: '1 jam lalu'  },
  { icon: Shield,       color: 'text-amber-500 dark:text-amber-400',   bg: 'bg-amber-500/10   border-amber-500/20',   text: 'Hak akses role "Viewer" diperbarui',               time: '3 jam lalu'  },
  { icon: AlertTriangle,color: 'text-rose-500 dark:text-rose-400',    bg: 'bg-rose-500/10    border-rose-500/20',    text: 'Login gagal 3× berturut-turut dari IP unknown',   time: '5 jam lalu'  },
  { icon: CheckCircle2, color: 'text-emerald-500 dark:text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', text: 'User baru "Citra Anggraini" berhasil didaftarkan', time: '1 hari lalu' },
  { icon: TrendingUp,   color: 'text-cyan-500 dark:text-cyan-400',    bg: 'bg-cyan-500/10    border-cyan-500/20',    text: 'Aplikasi "Learning Management" ditambahkan',       time: '2 hari lalu' },
];

const STATS = [
  { label: 'Total Aplikasi',  value: 7,   icon: LayoutGrid, color: 'text-amber-500 dark:text-amber-400',   bg: 'bg-amber-500/10',  glow: 'shadow-amber-500/5 dark:shadow-amber-500/20'   },
  { label: 'Total User',      value: 10,  icon: Users,      color: 'text-indigo-500 dark:text-indigo-400',  bg: 'bg-indigo-500/10', glow: 'shadow-indigo-500/5 dark:shadow-indigo-500/20'  },
  { label: 'Aktif Hari Ini',  value: 8,   icon: Activity,   color: 'text-emerald-500 dark:text-emerald-400', bg: 'bg-emerald-500/10',glow: 'shadow-emerald-500/5 dark:shadow-emerald-500/20' },
  { label: 'Suspended',       value: 1,   icon: Lock,       color: 'text-rose-500 dark:text-rose-400',    bg: 'bg-rose-500/10',   glow: 'shadow-rose-500/5 dark:shadow-rose-500/20'    },
];

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [selectedMonth, setSelectedMonth] = useState({ year: 2026, month: 6 });

  const dailyLogs = generateDailyLogs(selectedMonth.year, selectedMonth.month);
  const totalAccesses = dailyLogs.reduce((sum, d) => sum + d.total, 0);

  // Top apps for the period
  const appTotals = APPS.map(app => ({
    ...app,
    total: dailyLogs.reduce((s, d) => s + ((d.apps as Record<string,number>)[app.id] ?? 0), 0),
  })).sort((a, b) => b.total - a.total);

  const maxAppTotal = appTotals[0]?.total ?? 1;

  return (
    <div className="space-y-8">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2.5 mb-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/20 dark:border-rose-500/30 bg-rose-500/5 dark:bg-rose-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400">
            <Shield className="h-3 w-3" />
            Admin Panel
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
            Sistem Online
          </span>
        </div>
        <h1 className="text-3xl font-black tracking-tight text-slate-800 dark:text-slate-100 leading-tight">
          Pusat Administrasi
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500 dark:from-amber-400 dark:to-orange-500">
            Portal SSO PT INL
          </span>
        </h1>
        <p className="text-sm font-semibold text-slate-550 dark:text-slate-400 mt-1 max-w-xl">
          Kelola seluruh aspek sistem portal dari satu pusat kontrol yang terintegrasi dan aman.
        </p>
      </div>

      {/* Stats — flat inline, no cards */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2.5 bg-white dark:bg-[#0f1623] px-5 py-4 rounded-2xl border border-slate-200/80 dark:border-white/[0.06] shadow-sm">
        {STATS.map((s, i, arr) => {
          const Icon = s.icon;
          return (
            <React.Fragment key={s.label}>
              <div className="flex items-center gap-2">
                <Icon className={`h-4.5 w-4.5 shrink-0 ${s.color}`} />
                <span className={`text-base font-black ${s.color} tabular-nums`}>
                  <AnimatedCounter to={s.value} />
                </span>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-455">{s.label}</span>
              </div>
              {i < arr.length - 1 && <span className="h-4 w-px bg-slate-200 dark:bg-white/[0.1] shrink-0" />}
            </React.Fragment>
          );
        })}
      </div>

      {/* ── Access Log Chart ─────────────────────────────────────────────── */}
      <div className="relative rounded-2xl border border-slate-200/80 dark:border-white/[0.06] bg-white dark:bg-[#0f1623] shadow">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/30 dark:via-amber-500/40 to-transparent rounded-t-2xl" />

        {/* Chart header */}
        <div className="flex flex-col gap-3 px-5 py-4 border-b border-slate-100 dark:border-white/[0.06] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <BarChart3 className="h-4.5 w-4.5 text-amber-500 dark:text-amber-400" />
            <div>
              <h2 className="text-sm font-black text-slate-800 dark:text-slate-100">Log Akses Aplikasi Harian</h2>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-500 mt-0.5">
                Bulan {MONTH_NAMES[selectedMonth.month - 1]} {selectedMonth.year} ·{' '}
                <span className="text-amber-550 dark:text-amber-400 font-black">{totalAccesses.toLocaleString('id-ID')}</span> total akses
              </p>
            </div>
          </div>

          {/* Custom Month Picker */}
          <div className="flex items-center gap-2">
            <MonthPicker
              label="Pilih Bulan"
              value={selectedMonth}
              onChange={setSelectedMonth}
            />
          </div>
        </div>

        {/* Chart body */}
        <div className="px-3 pb-4 pt-2 bg-slate-50/30 dark:bg-transparent">
          <AccessBarChart data={dailyLogs} />
        </div>

        {/* App breakdown */}
        <div className="border-t border-slate-150 dark:border-white/[0.06] px-5 py-4 bg-slate-50/20 dark:bg-transparent">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-450 dark:text-slate-500 mb-3 flex items-center gap-2">
            <ArrowUpRight className="h-3 w-3" />
            Top Aplikasi — {MONTH_NAMES[selectedMonth.month - 1]} {selectedMonth.year}
          </h3>
          <div className="space-y-2.5">
            {appTotals.map((app, i) => (
              <div key={app.id} className="flex items-center gap-3">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-600 w-4 shrink-0">{i + 1}</span>
                <div className="w-28 shrink-0">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-350 truncate">{app.name}</p>
                </div>
                <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-white/[0.04] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${(app.total / maxAppTotal) * 100}%`,
                      backgroundColor: app.color,
                      opacity: 0.7,
                    }}
                  />
                </div>
                <span className="text-xs font-black shrink-0" style={{ color: app.color }}>
                  {app.total.toLocaleString('id-ID')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Activity + System Status ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Activity Log */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 dark:border-white/[0.06] bg-white dark:bg-[#0f1623] overflow-hidden shadow">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/[0.06]">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-750 dark:text-slate-300 flex items-center gap-2">
              <Activity className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
              Log Aktivitas
            </h2>
            <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500">{ACTIVITY_LOG.length} entri</span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-white/[0.04]">
            {ACTIVITY_LOG.map((log, i) => {
              const Icon = log.icon;
              return (
                <div key={i} className="flex items-start gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors duration-150">
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${log.bg} mt-0.5`}>
                    <Icon className={`h-3.5 w-3.5 ${log.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-705 dark:text-slate-300 leading-snug">{log.text}</p>
                    <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 mt-0.5">{log.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* System Status */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.06] bg-white dark:bg-[#0f1623] overflow-hidden shadow">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-white/[0.06]">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-750 dark:text-slate-300 flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
              Status Sistem
            </h2>
          </div>
          <div className="p-5 space-y-4">
            {[
              { label: 'Portal SSO',    status: 'Online',   pct: 99,  color: 'bg-emerald-500 dark:bg-emerald-400' },
              { label: 'Database',      status: 'Online',   pct: 97,  color: 'bg-emerald-500 dark:bg-emerald-400' },
              { label: 'Auth Service',  status: 'Online',   pct: 100, color: 'bg-emerald-500 dark:bg-emerald-400' },
              { label: 'Email Gateway', status: 'Degraded', pct: 72,  color: 'bg-amber-500 dark:bg-amber-400'   },
            ].map(s => (
              <div key={s.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{s.label}</span>
                  <span className={`text-[10px] font-black ${s.pct >= 90 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>{s.status}</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-white/[0.06] overflow-hidden">
                  <div className={`h-full rounded-full ${s.color} transition-all duration-700`} style={{ width: `${s.pct}%` }} />
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 text-right">{s.pct}% uptime</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
