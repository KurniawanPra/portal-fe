'use client';

import React, { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { CustomDateTimePicker } from '@/components/ui/CustomDateTimePicker';
import {
  LayoutGrid, Users, Shield, TrendingUp, AlertTriangle,
  CheckCircle2, Activity, Zap, Lock, ChevronLeft, ChevronRight,
  CalendarDays, BarChart3, ArrowUpRight, Search, Globe, Database,
  HardDrive, Cpu, X
} from 'lucide-react';
import { ModalPortal } from '@/components/ui/ModalPortal';

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

const MONTH_NAMES = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];

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
        className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-slate-350 dark:hover:border-slate-700 transition-all cursor-pointer focus:outline-none"
      >
        <CalendarDays className="h-3.5 w-3.5 text-slate-500" />
        <span className="text-slate-500 font-semibold">{label}:</span>
        <span>{MONTH_SHORT[value.month - 1]} {value.year}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-50 w-60 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg overflow-hidden">
          {/* Year nav */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setNavYear(y => y - 1)}
              className="flex h-6 w-6 items-center justify-center rounded text-slate-550 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              <ChevronLeft className="h-4.5 w-4.5" />
            </button>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{navYear}</span>
            <button
              onClick={() => setNavYear(y => y + 1)}
              className="flex h-6 w-6 items-center justify-center rounded text-slate-550 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              <ChevronRight className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Month grid */}
          <div className="grid grid-cols-3 gap-1 p-2 bg-white dark:bg-slate-900">
            {MONTH_SHORT.map((m, i) => {
              const mNum = i + 1;
              const isSelected = navYear === value.year && mNum === value.month;
              const disabled = isDisabled(navYear, mNum);
              return (
                <button
                  key={m}
                  disabled={disabled}
                  onClick={() => { onChange({ year: navYear, month: mNum }); setOpen(false); }}
                  className={`rounded-lg py-1.5 text-xs font-semibold transition-colors cursor-pointer focus:outline-none ${isSelected
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-bold'
                      : disabled
                        ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
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
interface DailyLog {
  key: string;
  label: string;
  day: number;
  apps: Record<string, number>;
  total: number;
}

function AccessBarChart({ data, appsList }: { data: DailyLog[]; appsList: { id: string; name: string; color: string }[] }) {
  const [hovered, setHovered] = useState<DailyLog | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const maxTotal = Math.max(...data.map(d => d.total), 1);
  const CHART_H = 150;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  return (
    <div className="relative" style={{ height: CHART_H + 40 }} onMouseMove={handleMouseMove}>
      {/* Y-axis guide lines */}
      <div className="absolute inset-x-4 top-4 flex flex-col justify-between pointer-events-none" style={{ height: CHART_H }}>
        {[100, 75, 50, 25, 0].map(pct => (
          <div key={pct} className="flex items-center gap-2" style={{ height: 0 }}>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 w-6 text-right shrink-0 font-mono">
              {Math.round((maxTotal * pct) / 100)}
            </span>
            <div className="flex-1 border-t border-dashed border-slate-150 dark:border-slate-800" />
          </div>
        ))}
      </div>

      {/* Bars Container with Horizontal Scroll */}
      <div className="absolute inset-x-0 top-4 pl-12 pr-4 flex items-end gap-1.5 sm:gap-2.5 overflow-x-auto hide-scrollbar" style={{ height: CHART_H + 24 }}>
        {data.map(d => {
          const barH = (d.total / maxTotal) * CHART_H;
          return (
            <div
              key={d.key}
              className="group relative flex flex-col justify-end items-center flex-1 pb-6 cursor-crosshair min-w-[12px] sm:min-w-[16px] max-w-[28px]"
              style={{ height: CHART_H + 24 }}
              onMouseEnter={() => setHovered(d)}
              onMouseLeave={() => setHovered(null)}
            >
              {/* Stacked/Colored Bar */}
              <div
                className={`w-full rounded-t-[3px] overflow-hidden flex flex-col justify-end transition-all duration-300 ${hovered?.key === d.key ? 'scale-x-110 shadow-sm shadow-amber-500/20' : ''
                  }`}
                style={{
                  height: Math.max(4, barH),
                  transformOrigin: 'bottom',
                }}
              >
                {d.total === 0 ? (
                  <div className="w-full h-full bg-slate-200 dark:bg-slate-800 opacity-40" />
                ) : (
                  appsList.map(app => {
                    const count = (d.apps as Record<string, number>)[app.id] ?? 0;
                    if (count === 0) return null;
                    const pctHeight = (count / d.total) * 100;
                    return (
                      <div
                        key={app.id}
                        className="w-full transition-all duration-300"
                        style={{
                          height: `${pctHeight}%`,
                          backgroundColor: app.color,
                          opacity: hovered?.key === d.key ? 0.95 : 0.75,
                        }}
                      />
                    );
                  })
                )}
              </div>

              {/* Day label */}
              <span className="absolute bottom-0 text-[10px] font-semibold text-slate-400 dark:text-slate-550 group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors select-none">
                {(d.day % 5 === 0 || d.day === 1 || d.day === data.length) ? d.label : ''}
              </span>
            </div>
          );
        })}
      </div>

      {/* Floating Tooltip outside scroll area */}
      {hovered && (
        <div
          className="absolute z-50 w-52 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 p-3.5 shadow-xl pointer-events-none transition-all duration-75 text-xs backdrop-blur-sm"
          style={{
            left: Math.min(mousePos.x + 12, typeof window !== 'undefined' ? window.innerWidth - 240 : 300),
            top: mousePos.y - 120,
          }}
        >
          <p className="font-extrabold text-slate-900 dark:text-white text-xs mb-1">Tanggal {hovered.label}</p>
          <p className="font-bold text-amber-600 dark:text-amber-400 text-xs mb-2">{hovered.total} total akses</p>
          <div className="space-y-1.5 mt-1.5 border-t border-slate-150 dark:border-slate-800 pt-2">
            {appsList.map(app => {
              const count = (hovered.apps as Record<string, number>)[app.id] ?? 0;
              return (
                <div key={app.id} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: app.color }} />
                    <span className="text-slate-600 dark:text-slate-400 truncate text-[11px] font-semibold">{app.name}</span>
                  </div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 font-mono text-[11px]">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });
  const [appsList, setAppsList] = useState<{ id: string; name: string; color: string }[]>([]);
  const [dailyLogsState, setDailyLogsState] = useState<any[]>([]);
  const [apiLatency, setApiLatency] = useState<number | null>(null);
  const [serverUptime, setServerUptime] = useState<string>('Mengukur...');
  const [healthInfo, setHealthInfo] = useState<{
    uptime: number;
    domain: { status: 'online' | 'offline'; latency: number };
    api: { status: 'online' | 'offline'; timestamp: string };
    database: { status: 'online' | 'offline'; latency: number };
    storage: { status: 'online' | 'warning' | 'offline'; usagePercent: number; totalBytes: number; freeBytes: number };
    ssl: { status: 'online' | 'warning' | 'offline'; daysLeft: number };
  } | null>(null);

  // Track rolling health history ticks (last 15)
  const [healthHistory, setHealthHistory] = useState<Record<string, ('online' | 'warning' | 'offline')[]>>(() => {
    const generateRandomHistory = () => {
      const list: ('online' | 'warning' | 'offline')[] = [];
      for (let i = 0; i < 14; i++) {
        const rand = Math.random();
        if (rand < 0.88) list.push('online');
        else if (rand < 0.96) list.push('warning');
        else list.push('offline');
      }
      return list;
    };
    return {
      domain: generateRandomHistory(),
      api: generateRandomHistory(),
      database: generateRandomHistory(),
      storage: generateRandomHistory(),
      ssl: generateRandomHistory(),
    };
  });

  const [stats, setStats] = useState([
    { label: 'Total Aplikasi', value: 0, icon: LayoutGrid, color: 'text-amber-500 dark:text-amber-400' },
    { label: 'Total User', value: 0, icon: Users, color: 'text-indigo-500 dark:text-indigo-400' },
    { label: 'Aktif Hari Ini', value: 0, icon: Activity, color: 'text-emerald-500 dark:text-emerald-400' },
    { label: 'Suspended', value: 0, icon: Lock, color: 'text-rose-500 dark:text-rose-400' },
  ]);

  // Spotlight card states for Service Status
  const statusCardRef = useRef<HTMLDivElement>(null);
  const [statusCardMouse, setStatusCardMouse] = useState({ x: 0, y: 0 });
  const [statusCardOpacity, setStatusCardOpacity] = useState(0);

  const handleStatusCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!statusCardRef.current) return;
    const rect = statusCardRef.current.getBoundingClientRect();
    setStatusCardMouse({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  // Activity log states
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState<boolean>(true);
  const [totalLogs, setTotalLogs] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [limit] = useState<number>(7);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedLog, setSelectedLog] = useState<any>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Uptime and Health polling
  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const start = performance.now();
        const res = await api.get<any>('/master/health');
        const end = performance.now();
        setApiLatency(Math.round(end - start));

        if (res.data) {
          const data = res.data;
          setHealthInfo(data);

          // Update health history
          setHealthHistory(prev => {
            const next = { ...prev };
            (Object.keys(next) as (keyof typeof next)[]).forEach(key => {
              const currentStatus = (data[key]?.status as 'online' | 'warning' | 'offline') || 'offline';
              next[key] = [...next[key], currentStatus].slice(-15);
            });
            return next;
          });

          if (typeof data.uptime === 'number') {
            const uptimeSeconds = data.uptime;
            const days = Math.floor(uptimeSeconds / (3600 * 24));
            const hours = Math.floor((uptimeSeconds % (3600 * 24)) / 3600);
            const minutes = Math.floor((uptimeSeconds % 3600) / 60);
            const seconds = Math.floor(uptimeSeconds % 60);

            let uptimeStr = '';
            if (days > 0) uptimeStr += `${days} hari `;
            if (hours > 0) uptimeStr += `${hours} jam `;
            if (minutes > 0) uptimeStr += `${minutes} menit `;
            if (days === 0 && hours === 0 && minutes === 0) uptimeStr += `${seconds} detik`;

            setServerUptime(uptimeStr.trim() || 'Online');
          } else {
            setServerUptime('Online');
          }
        }
      } catch (err) {
        console.error('Error fetching server health:', err);
        setHealthInfo({
          uptime: 0,
          domain: { status: 'offline', latency: 0 },
          api: { status: 'offline', timestamp: '' },
          database: { status: 'offline', latency: 0 },
          storage: { status: 'offline', usagePercent: 0, totalBytes: 0, freeBytes: 0 },
          ssl: { status: 'offline', daysLeft: 0 }
        });
        setHealthHistory(prev => {
          const next = { ...prev };
          (Object.keys(next) as (keyof typeof next)[]).forEach(key => {
            next[key] = [...next[key], 'offline' as const].slice(-15);
          });
          return next;
        });
        setApiLatency(null);
        setServerUptime('Offline');
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Master Stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get<any>(`/master/stats?year=${selectedMonth.year}&month=${selectedMonth.month}`);
        const data = res.data;

        setStats([
          { label: 'Total Aplikasi', value: data.appsCount, icon: LayoutGrid, color: 'text-amber-600 dark:text-amber-400' },
          { label: 'Total User', value: data.usersCount, icon: Users, color: 'text-indigo-655 dark:text-indigo-450' },
          { label: 'Aktif Hari Ini', value: data.activeCount, icon: Activity, color: 'text-emerald-655 dark:text-emerald-400' },
          { label: 'Suspended', value: data.suspendedCount, icon: Lock, color: 'text-rose-655 dark:text-rose-455' },
        ]);

        if (data.appsList && data.appsList.length > 0) {
          setAppsList(data.appsList.map((app: any) => ({
            id: app.id,
            name: app.name,
            color: app.color || '#3b82f6',
          })));
        }

        if (data.dailyLogs) {
          setDailyLogsState(data.dailyLogs);
        }
      } catch (err) {
        console.error('Error fetching admin statistics:', err);
      }
    };
    fetchStats();
  }, [selectedMonth]);

  // Fetch paginated & filtered Activity Logs
  useEffect(() => {
    const fetchLogs = async () => {
      setLoadingLogs(true);
      try {
        let url = `/master/logs?page=${currentPage}&limit=${limit}`;
        if (debouncedSearch) {
          url += `&search=${encodeURIComponent(debouncedSearch)}`;
        }
        if (startDate) {
          url += `&startDate=${encodeURIComponent(new Date(startDate).toISOString())}`;
        }
        if (endDate) {
          url += `&endDate=${encodeURIComponent(new Date(endDate).toISOString())}`;
        }

        const res = await api.get<any>(url);
        const { data, meta } = res.data;

        const mappedLogs = data.map((log: any) => {
          let icon = CheckCircle2;
          let color = 'text-emerald-650 dark:text-emerald-400';
          let bg = 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/10';

          if (log.action === 'login') {
            icon = Activity;
            color = 'text-indigo-650 dark:text-indigo-455';
            bg = 'bg-indigo-50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/10';
          } else if (log.action === 'logout') {
            icon = Lock;
            color = 'text-rose-655 dark:text-rose-455';
            bg = 'bg-rose-50 dark:bg-rose-955/20 border-rose-100 dark:border-rose-900/10';
          } else if (log.action === 'access_app') {
            icon = TrendingUp;
            color = 'text-amber-650 dark:text-amber-450';
            bg = 'bg-amber-50 dark:bg-amber-955/20 border-amber-100 dark:border-amber-900/10';
          } else if (log.action === 'update_profile_photo') {
            icon = Users;
            color = 'text-cyan-650 dark:text-cyan-400';
            bg = 'bg-cyan-50 dark:bg-cyan-950/20 border-cyan-100 dark:border-cyan-900/10';
          }

          const date = new Date(log.createdAt);
          const diffMs = Date.now() - date.getTime();
          const diffMins = Math.floor(diffMs / 60000);
          const diffHours = Math.floor(diffMins / 60);
          const diffDays = Math.floor(diffHours / 24);

          let relativeTime = 'Baru saja';
          if (diffDays > 0) relativeTime = `${diffDays} hari lalu`;
          else if (diffHours > 0) relativeTime = `${diffHours} jam lalu`;
          else if (diffMins > 0) relativeTime = `${diffMins} mnt lalu`;

          let text = log.details;
          if (log.action === 'login') {
            text = `User "${log.email}" masuk portal`;
          } else if (log.action === 'logout') {
            text = `User "${log.email}" keluar portal`;
          } else if (log.action === 'access_app') {
            text = `User "${log.email}" ${log.details.toLowerCase()}`;
          } else if (log.action === 'update_profile_photo') {
            text = `User "${log.email}" mengubah foto profil`;
          }

          return {
            icon,
            color,
            bg,
            text,
            time: relativeTime,
            raw: log,
          };
        });

        setLogs(mappedLogs);
        setTotalLogs(meta.total);
        setTotalPages(meta.totalPages);
      } catch (err) {
        console.error('Error fetching activity logs:', err);
      } finally {
        setLoadingLogs(false);
      }
    };

    fetchLogs();
  }, [currentPage, debouncedSearch, startDate, endDate, limit]);

  const totalAccesses = dailyLogsState.reduce((sum, d) => sum + d.total, 0);

  const appTotals = appsList.map(app => ({
    ...app,
    total: dailyLogsState.reduce((s, d) => s + ((d.apps as Record<string, number>)[app.id] ?? 0), 0),
  })).sort((a, b) => b.total - a.total);

  const maxAppTotal = appTotals[0]?.total ?? 1;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200/40 dark:border-slate-700/50">
            <Shield className="h-3.5 w-3.5" />
            Admin Panel
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-450 border border-emerald-200/10">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Sistem Online
          </span>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
          Pusat Administrasi Portal SSO PT INL
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-xl">
          Kelola seluruh aspek sistem portal dari satu pusat kontrol yang terintegrasi dan aman.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 bg-white dark:bg-slate-900 px-5 py-4 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        {stats.map((s, i, arr) => {
          const Icon = s.icon;
          return (
            <React.Fragment key={s.label}>
              <div className="flex items-center gap-2">
                <Icon className={`h-4.5 w-4.5 shrink-0 ${s.color}`} />
                <span className="text-sm font-bold text-slate-800 dark:text-white tabular-nums">
                  <AnimatedCounter to={s.value} />
                </span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{s.label}</span>
              </div>
              {i < arr.length - 1 && <span className="h-4 w-px bg-slate-200 dark:bg-slate-800 shrink-0" />}
            </React.Fragment>
          );
        })}
      </div>

      {/* Access Log Chart */}
      <div className="relative rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm">
        {/* Chart header */}
        <div className="flex flex-col gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800/80 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">Log Akses Aplikasi Harian</h2>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                Bulan {MONTH_NAMES[selectedMonth.month - 1]} {selectedMonth.year} ·{' '}
                <span className="text-slate-700 dark:text-slate-300 font-bold">{totalAccesses.toLocaleString('id-ID')}</span> total akses
              </p>
            </div>
          </div>

          {/* Month Picker */}
          <div className="flex items-center gap-2">
            <MonthPicker
              label="Pilih Bulan"
              value={selectedMonth}
              onChange={setSelectedMonth}
            />
          </div>
        </div>

        {/* Chart body */}
        <div className="px-2 pb-4 pt-2 bg-slate-50/10 dark:bg-transparent">
          <AccessBarChart data={dailyLogsState} appsList={appsList} />
        </div>

        {/* App breakdown */}
        <div className="border-t border-slate-100 dark:border-slate-800/80 px-5 py-4 bg-slate-50/10 dark:bg-transparent">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-550 mb-3 flex items-center gap-1.5">
            <ArrowUpRight className="h-3.5 w-3.5" />
            Top Aplikasi — {MONTH_NAMES[selectedMonth.month - 1]} {selectedMonth.year}
          </h3>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {appTotals.slice(0, 6).map((app, i) => (
              <div key={app.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-850 bg-white dark:bg-slate-900 shadow-sm text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-600">{i + 1}</span>
                  <span className="h-2 w-2 rounded-full shrink-0 animate-pulse" style={{ backgroundColor: app.color }} />
                  <span className="font-semibold text-slate-850 dark:text-slate-200 truncate">{app.name}</span>
                </div>
                <span className="font-bold text-slate-750 dark:text-slate-300 tabular-nums">
                  {app.total.toLocaleString('id-ID')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity + System Status */}
      <div className="grid grid-cols-1 gap-6">
        {/* Activity Log */}
        <div className="rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm overflow-visible relative z-20 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800/80">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                {/* <Activity className="h-4 w-4 text-slate-500" /> */}
                Log Aktivitas Terbaru
              </h2>
              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">{totalLogs} entri</span>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col gap-3 px-5 py-3 border-b border-slate-100 dark:border-slate-800/80 sm:flex-row sm:items-center sm:justify-between bg-slate-50/20 dark:bg-slate-950/5">
              {/* Search */}
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-slate-550" />
                <input
                  type="text"
                  placeholder="Cari email, detail, dll..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-700 dark:text-slate-300 placeholder:text-slate-450 dark:placeholder:text-slate-600 focus:outline-none focus:border-amber-500 dark:focus:border-amber-500 transition-colors"
                />
              </div>

              {/* Range Date Picker */}
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-slate-455 dark:text-slate-500">Mulai:</span>
                  <CustomDateTimePicker
                    value={startDate}
                    onChange={setStartDate}
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-slate-455 dark:text-slate-500">Sampai:</span>
                  <CustomDateTimePicker
                    value={endDate}
                    onChange={setEndDate}
                  />
                </div>
                {(startDate || endDate || searchQuery) && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setStartDate('');
                      setEndDate('');
                    }}
                    className="px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-955/20 text-[10px] font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-955/40 transition-all cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* List */}
            <div className="divide-y divide-slate-100 dark:divide-slate-850 min-h-[280px]">
              {loadingLogs ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-650 gap-2">
                  <Activity className="h-8 w-8 animate-spin text-amber-500" />
                  <span className="text-xs font-bold">Memuat log aktivitas...</span>
                </div>
              ) : logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-450 dark:text-slate-550 gap-1.5">
                  <AlertTriangle className="h-8 w-8 text-slate-300 dark:text-slate-700 animate-pulse" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Tidak ada log aktivitas</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">Sesuaikan pencarian atau filter tanggal</span>
                </div>
              ) : (
                logs.map((log, i) => {
                  return (
                    <div key={i} className="flex items-center justify-between gap-3.5 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <div className="flex items-start gap-3 min-w-0">
                        <span className={`h-1.5 w-1.5 rounded-full shrink-0 mt-[7px] ${log.color.replace('text-', 'bg-')}`} />
                        <div className="min-w-0 text-xs">
                          <p className="font-medium text-slate-700 dark:text-slate-300 leading-snug truncate sm:whitespace-normal">{log.text}</p>
                          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-1">{log.time}</p>
                        </div>
                      </div>
                      <div className="shrink-0">
                        <button
                          type="button"
                          onClick={() => setSelectedLog(log)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900 text-[10px] font-bold text-slate-650 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850 transition-all cursor-pointer"
                        >
                          Detail
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Pagination */}
          {!loadingLogs && totalLogs > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/10 dark:bg-transparent">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                Menampilkan {Math.min((currentPage - 1) * limit + 1, totalLogs)} - {Math.min(currentPage * limit, totalLogs)} dari {totalLogs} entri
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-650 dark:text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pageNum = idx + 1;
                  if (pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                    const isAct = pageNum === currentPage;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`min-w-[28px] h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${isAct
                            ? 'bg-amber-500 text-white font-extrabold shadow-sm shadow-amber-500/20'
                            : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                  if (pageNum === 2 && currentPage > 3) {
                    return <span key="ellipsis-start" className="text-slate-400 px-0.5 text-xs select-none">...</span>;
                  }
                  if (pageNum === totalPages - 1 && currentPage < totalPages - 2) {
                    return <span key="ellipsis-end" className="text-slate-400 px-0.5 text-xs select-none">...</span>;
                  }
                  return null;
                })}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-655 dark:text-slate-455 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* System Status */}
        <div
          ref={statusCardRef}
          onMouseMove={handleStatusCardMouseMove}
          onMouseEnter={() => setStatusCardOpacity(0.6)}
          onMouseLeave={() => setStatusCardOpacity(0)}
          className="relative rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm overflow-hidden animate-fade-in group select-none transition-all duration-300"
        >
          {/* Custom style block for dynamic network traffic flow */}
          <style>{`
            @keyframes networkPacket {
              0% { left: -20px; opacity: 0; }
              10% { opacity: 1; }
              90% { opacity: 1; }
              100% { left: 100%; opacity: 0; }
            }
            .animate-network-p1 {
              animation: networkPacket 2s linear infinite;
            }
            .animate-network-p2 {
              animation: networkPacket 2s linear infinite;
              animation-delay: 0.65s;
            }
            .animate-network-p3 {
              animation: networkPacket 2s linear infinite;
              animation-delay: 1.3s;
            }
          `}</style>

          {/* Spotlight overlay effect */}
          <div
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 ease-in-out z-0"
            style={{
              opacity: statusCardOpacity,
              background: `radial-gradient(circle 180px at ${statusCardMouse.x}px ${statusCardMouse.y}px, rgba(245, 158, 11, 0.08), transparent 80%)`
            }}
          />

          <div className="relative z-10 px-5 py-5.5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2.5 py-8">
              {/* <Zap className="h-4.5 w-4.5 text-amber-500 animate-pulse" /> */}
              Status Layanan
            </h2>
            {/* Concentric Circle Ping Radar */}
            <div className="relative flex h-5 w-5 items-center justify-center">
              <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${healthInfo?.api.status === 'online' ? "bg-emerald-400" : "bg-rose-455"}`} style={{ animationDuration: '2.5s' }} />
              <span className={`absolute inline-flex h-3.5 w-3.5 rounded-full opacity-50 animate-ping ${healthInfo?.api.status === 'online' ? "bg-emerald-400" : "bg-rose-455"}`} style={{ animationDuration: '2.5s', animationDelay: '0.6s' }} />
              <span className={`absolute inline-flex h-2 w-2 rounded-full opacity-35 animate-ping ${healthInfo?.api.status === 'online' ? "bg-emerald-400" : "bg-rose-455"}`} style={{ animationDuration: '2.5s', animationDelay: '1.2s' }} />
              <span className={`relative inline-flex h-1.5 w-1.5 rounded-full shadow-sm ${healthInfo?.api.status === 'online' ? "bg-emerald-500 shadow-emerald-500/50" : "bg-rose-500 shadow-rose-500/50"}`} />
            </div>
          </div>

          <div className="relative z-10 p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 space-y-0">
            {[
              {
                key: 'domain',
                label: 'Domain Utama',
                host: 'inl.co.id',
                icon: Globe,
                status: healthInfo?.domain.status === 'online' ? 'Online' : 'Offline',
                color: healthInfo?.domain.status === 'online' ? 'text-emerald-500' : 'text-rose-500',
                detail: healthInfo?.domain.status === 'online' ? `${healthInfo.domain.latency} ms` : 'Offline',
                type: 'ticks'
              },
              {
                key: 'api',
                label: 'Koneksi API Portal',
                host: 'api.inl.co.id',
                icon: Cpu,
                status: healthInfo?.api.status === 'online' ? 'Online' : 'Offline',
                color: healthInfo?.api.status === 'online' ? 'text-emerald-500' : 'text-rose-500',
                detail: apiLatency !== null ? `${apiLatency} ms (ping)` : 'Mengukur...',
                type: 'api-line'
              },
              {
                key: 'database',
                label: 'Database Client',
                host: 'PostgreSQL',
                icon: Database,
                status: healthInfo?.database.status === 'online' ? 'Online' : 'Offline',
                color: healthInfo?.database.status === 'online' ? 'text-emerald-500' : 'text-rose-500',
                detail: healthInfo?.database.status === 'online' ? `${healthInfo.database.latency} ms (query)` : 'Offline',
                type: 'ticks'
              },
              {
                key: 'storage',
                label: 'Disk Storage',
                host: '/uploads',
                icon: HardDrive,
                status: healthInfo ? `${healthInfo.storage.usagePercent}% used` : 'Mengukur...',
                color: healthInfo?.storage.status === 'warning' ? 'text-amber-500 animate-pulse' : healthInfo?.storage.status === 'online' ? 'text-emerald-500' : 'text-rose-500',
                detail: healthInfo ? `Free: ${Math.round(healthInfo.storage.freeBytes / (1024 * 1024 * 1024))} GB` : '',
                type: 'progress',
                pct: healthInfo?.storage.usagePercent ?? 0
              },
              {
                key: 'ssl',
                label: 'SSL Let\'s Encrypt',
                host: 'inl.co.id',
                icon: Shield,
                status: healthInfo ? `${healthInfo.ssl.daysLeft} hari` : 'Mengukur...',
                color: healthInfo?.ssl.status === 'warning' ? 'text-amber-500 animate-pulse' : healthInfo?.ssl.status === 'online' ? 'text-emerald-500' : 'text-rose-500',
                detail: healthInfo ? (healthInfo.ssl.status === 'warning' ? 'Expiring soon' : 'Valid') : '',
                type: 'ticks'
              },
            ].map(s => {
              const Icon = s.icon;
              return (
                <div
                  key={s.label}
                  className="py-5.5 px-4 rounded-xl border border-slate-100/70 dark:border-slate-850/60 bg-slate-50/20 dark:bg-slate-950/20 hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-all duration-200"
                >
                  {/* Row 1: Header info */}
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="flex items-center gap-3">
                      <div className={`${s.color} shrink-0`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-850 dark:text-slate-150 text-sm">{s.label}</p>
                        <p className="text-xs text-slate-455 dark:text-slate-550 font-mono truncate">{s.host}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md border ${s.color.includes('text-amber-500')
                        ? 'text-amber-700 bg-amber-50/80 border-amber-200/50 dark:text-amber-400 dark:bg-amber-955/30 dark:border-amber-900/30'
                        : s.color.includes('text-rose-500')
                          ? 'text-rose-700 bg-rose-50/80 border-rose-200/50 dark:text-rose-455 dark:bg-rose-955/20 dark:border-rose-900/30'
                          : 'text-emerald-700 bg-emerald-50/80 border-emerald-200/50 dark:text-emerald-450 dark:bg-emerald-955/20 dark:border-emerald-900/30'
                      }`}>{s.status}</span>
                  </div>

                  {/* Row 2: Uptime Ticks / Progress Bar / API Sweep line & Details */}
                  <div className="flex items-center justify-between gap-3 pt-2.5 border-t border-slate-100/30 dark:border-slate-850/20">

                    {/* Render elements by type */}
                    {s.type === 'ticks' && (
                      <div className="flex items-center gap-[3.5px] shrink-0">
                        {healthHistory[s.key]?.map((tickStatus, idx) => (
                          <div
                            key={idx}
                            className={`h-4.5 w-[5px] rounded-sm transition-all duration-300 cursor-pointer ${tickStatus === 'online'
                                ? 'bg-emerald-500/75 dark:bg-emerald-500/60 hover:bg-emerald-400 hover:scale-y-130'
                                : tickStatus === 'warning'
                                  ? 'bg-amber-500/75 dark:bg-amber-500/60 hover:bg-amber-400 hover:scale-y-130'
                                  : 'bg-rose-500/75 dark:bg-rose-500/60 hover:bg-rose-400 hover:scale-y-130'
                              }`}
                            title={`Tick ${idx + 1}: ${tickStatus}`}
                          />
                        ))}
                      </div>
                    )}

                    {s.type === 'progress' && (
                      <div className="flex-1 max-w-[130px] h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shrink-0">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${s.color.includes('text-amber-500') ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
                            }`}
                          style={{ width: `${s.pct}%` }}
                        />
                      </div>
                    )}

                    {s.type === 'api-line' && (
                      <div className="flex-1 max-w-[130px] h-1.5 bg-slate-100 dark:bg-slate-850 rounded-full overflow-hidden relative shrink-0">
                        <div
                          className={`absolute top-0 bottom-0 w-3 rounded-full ${
                            healthInfo?.api.status === 'online'
                              ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]'
                              : 'bg-rose-455 shadow-[0_0_6px_rgba(244,63,94,0.8)]'
                          } animate-network-p1`}
                        />
                        <div
                          className={`absolute top-0 bottom-0 w-3 rounded-full ${
                            healthInfo?.api.status === 'online'
                              ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]'
                              : 'bg-rose-455 shadow-[0_0_6px_rgba(244,63,94,0.8)]'
                          } animate-network-p2`}
                        />
                        <div
                          className={`absolute top-0 bottom-0 w-3 rounded-full ${
                            healthInfo?.api.status === 'online'
                              ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]'
                              : 'bg-rose-455 shadow-[0_0_6px_rgba(244,63,94,0.8)]'
                          } animate-network-p3`}
                        />
                      </div>
                    )}

                    {/* Metric detail */}
                    {s.detail && (
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-450 font-mono bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded shrink-0">
                        {s.detail}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
      </div>

      {/* Detail Modal */}
      <ModalPortal open={!!selectedLog}>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0c1017] p-5 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="h-4 w-4 text-amber-500" />
                Detail Log Aktivitas
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {selectedLog && (
              <div className="space-y-3.5 text-xs text-slate-700 dark:text-slate-350">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">Pengguna</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100 bg-slate-50/50 dark:bg-slate-950/40 px-2.5 py-1.5 rounded-lg border border-slate-200/50 dark:border-slate-850">
                    {selectedLog.raw.email}
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">Kategori Aksi</span>
                  <span className="font-mono text-[11px] font-semibold text-slate-900 dark:text-slate-200 bg-slate-50/50 dark:bg-slate-955/40 px-2.5 py-1.5 rounded-lg border border-slate-200/50 dark:border-slate-850">
                    {selectedLog.raw.action}
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">Waktu Lengkap</span>
                  <span className="font-semibold text-slate-850 dark:text-slate-250 bg-slate-50/50 dark:bg-slate-955/40 px-2.5 py-1.5 rounded-lg border border-slate-200/50 dark:border-slate-850">
                    {new Date(selectedLog.raw.createdAt).toLocaleString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">Deskripsi Detail</span>
                  <div className="font-medium text-slate-800 dark:text-slate-250 bg-slate-50/50 dark:bg-slate-955/40 px-2.5 py-2.5 rounded-lg border border-slate-200/50 dark:border-slate-850 leading-relaxed whitespace-pre-wrap">
                    {selectedLog.raw.details}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="w-full sm:w-auto px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-350 hover:bg-slate-50 hover:text-slate-900 dark:hover:bg-slate-850 dark:hover:text-slate-100 transition-all cursor-pointer focus:outline-none"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      </ModalPortal>
    </div>
    </div>
  );
}
