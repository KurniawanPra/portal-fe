'use client';

import React, { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { CustomDateTimePicker } from '@/components/ui/CustomDateTimePicker';
import { SearchSelect } from '@/components/ui/SearchSelect';
import {
  AppWindow, Users, Building2, TrendingUp, Ban,
  CheckCircle2, MonitorCheck, Lock, ChevronLeft, ChevronRight,
  CalendarDays, LogIn, LogOut, ArrowUpRight, Search, Globe, Database,
  HardDrive, Cpu, X, RefreshCw, Server, Wifi, OctagonAlert, Clock3,
  ClipboardList, Activity, LayoutGrid, AlertTriangle, Shield, Eye
} from 'lucide-react';
import { ModalPortal } from '@/components/ui/ModalPortal';
import { resolveImageUrl } from '@/lib/utils';
import PortalHelpGuide from '@/components/help/PortalHelpGuide';
import { usePortalBranding } from '@/lib/portal-branding';
import { LiveUsersModal } from './_components/LiveUsersModal';

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
    <div className="relative" style={{ height: CHART_H + 40 } as React.CSSProperties} onMouseMove={handleMouseMove}>
      {/* Y-axis guide lines */}
      <div className="absolute inset-x-4 top-4 flex flex-col justify-between pointer-events-none" style={{ height: CHART_H } as React.CSSProperties}>
        {[100, 75, 50, 25, 0].map(pct => (
          <div key={pct} className="flex items-center gap-2" style={{ height: 0 } as React.CSSProperties}>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 w-6 text-right shrink-0 font-mono">
              {Math.round((maxTotal * pct) / 100)}
            </span>
            <div className="flex-1 border-t border-dashed border-slate-150 dark:border-slate-800" />
          </div>
        ))}
      </div>

      {/* Bars Container with Horizontal Scroll */}
      <div className="absolute inset-x-0 top-4 pl-12 pr-4 flex items-end gap-1.5 sm:gap-2.5 overflow-x-auto hide-scrollbar" style={{ height: CHART_H + 24 } as React.CSSProperties}>
        {data.map(d => {
          const barH = (d.total / maxTotal) * CHART_H;
          return (
            <div
              key={d.key}
              className="group relative flex flex-col justify-end items-center flex-1 pb-6 cursor-crosshair min-w-[12px] sm:min-w-[16px] max-w-[28px]"
              style={{ height: CHART_H + 24 } as React.CSSProperties}
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
                } as React.CSSProperties}
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
                        } as React.CSSProperties}
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
          } as React.CSSProperties}
        >
          <p className="font-extrabold text-slate-900 dark:text-white text-xs mb-1">Tanggal {hovered.label}</p>
          <p className="font-bold text-amber-600 dark:text-amber-400 text-xs mb-2">{hovered.total} total akses</p>
          <div className="space-y-1.5 mt-1.5 border-t border-slate-150 dark:border-slate-800 pt-2">
            {appsList.map(app => {
              const count = (hovered.apps as Record<string, number>)[app.id] ?? 0;
              return (
                <div key={app.id} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: app.color } as React.CSSProperties} />
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
  const { branding } = usePortalBranding();
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
    domain: { status: 'online' | 'offline'; latency: number; host?: string };
    api: { status: 'online' | 'warning' | 'offline'; lagMs?: number; timestamp: string };
    database: { status: 'online' | 'offline'; latency: number };
    storage: { status: 'online' | 'warning' | 'offline'; usagePercent: number; totalBytes: number; freeBytes: number };
    ssl: { status: 'online' | 'warning' | 'offline'; daysLeft: number; host?: string };
    apps: Array<{ id: string; nama: string; url: string; icon: string | null; status: 'online' | 'offline'; latency: number }>;
  } | null>(null);

  // Track rolling health history ticks (last 15). Dimulai dari array kosong (bukan
  // data acak/palsu) agar riwayat yang ditampilkan selalu mencerminkan hasil polling
  // sungguhan sejak halaman dibuka — lebih jujur & fungsional.
  const [healthHistory, setHealthHistory] = useState<Record<string, ('online' | 'warning' | 'offline')[]>>({
    domain: [],
    api: [],
    database: [],
    storage: [],
    ssl: [],
  });
  const [healthRefreshKey, setHealthRefreshKey] = useState(0);
  const [isHealthRefreshing, setIsHealthRefreshing] = useState(false);
  const [lastHealthCheck, setLastHealthCheck] = useState<Date | null>(null);

  const [stats, setStats] = useState<Array<{ label: string; value: number; icon: any; color: string; onlineNow?: number }>>([
    { label: 'Total Aplikasi', value: 0, icon: LayoutGrid, color: 'text-amber-500 dark:text-amber-400' },
    { label: 'Total User', value: 0, icon: Users, color: 'text-indigo-500 dark:text-indigo-400' },
    { label: 'Login Portal (Hari Ini)', value: 0, icon: Activity, color: 'text-emerald-500 dark:text-emerald-400' },
    { label: 'Suspended', value: 0, icon: Lock, color: 'text-rose-500 dark:text-rose-400' },
  ]);

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
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedAppId, setSelectedAppId] = useState<string>('');
  const [userOptions, setUserOptions] = useState<{ id: string; email: string; nama?: string | null }[]>([]);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [showLiveUsersModal, setShowLiveUsersModal] = useState<boolean>(false);

  // Fetch users list for filter dropdown
  useEffect(() => {
    const fetchUserOptions = async () => {
      try {
        const res = await api.get<any>('/master/users-options');
        if (res.data) {
          setUserOptions(res.data);
        }
      } catch (err) {
        console.error('Error fetching users options:', err);
      }
    };
    fetchUserOptions();
  }, []);

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
          setLastHealthCheck(new Date());

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
          ssl: { status: 'offline', daysLeft: 0 },
          apps: [],
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
        setLastHealthCheck(new Date());
      } finally {
        setIsHealthRefreshing(false);
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, [healthRefreshKey]);

  // Fetch Master Stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get<any>(`/master/stats?year=${selectedMonth.year}&month=${selectedMonth.month}`);
        const data = res.data;

        setStats([
          { label: 'Total Aplikasi', value: data.appsCount, icon: AppWindow, color: 'text-amber-600 dark:text-amber-400' },
          { label: 'Total User', value: data.usersCount, icon: Users, color: 'text-indigo-655 dark:text-indigo-450' },
          { label: 'Login Portal (Hari Ini)', value: data.loginTodayCount ?? data.activeCount, icon: LogIn, color: 'text-emerald-655 dark:text-emerald-400', onlineNow: data.onlineNowCount },
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
        if (selectedUserId) {
          url += `&userId=${encodeURIComponent(selectedUserId)}`;
        }
        if (selectedAppId) {
          url += `&appId=${encodeURIComponent(selectedAppId)}`;
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
          let color = 'text-emerald-600 dark:text-emerald-400';

          if (log.action === 'login') {
            icon = LogIn;
            color = 'text-indigo-600 dark:text-indigo-400';
          } else if (log.action === 'logout') {
            icon = LogOut;
            color = 'text-rose-600 dark:text-rose-400';
          } else if (log.action === 'access_app') {
            icon = ArrowUpRight;
            color = 'text-amber-600 dark:text-amber-400';
          } else if (log.action === 'update_profile_photo') {
            icon = Users;
            color = 'text-cyan-600 dark:text-cyan-400';
          }

          const date = new Date(log.createdAt);
          const absoluteTime = date.toLocaleDateString('id-ID', {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
            timeZone: 'Asia/Jakarta',
          });

          let relativeTime = absoluteTime;

          const userDisplayName = log.userNama || log.email;
          let text = log.details;
          if (log.action === 'login') {
            text = `${userDisplayName}, Login ke Portal SSO`;
          } else if (log.action === 'logout') {
            text = `${userDisplayName}, Logout dari Portal SSO`;
          } else if (log.action === 'access_app') {
            const appName = log.appName || 'Aplikasi';
            text = `${userDisplayName}, Login ke Aplikasi ${appName}`;
          } else if (log.action === 'update_profile_photo') {
            text = `${userDisplayName}, Mengubah foto profil`;
          } else {
            text = `${userDisplayName}, ${log.details}`;
          }

          return {
            icon,
            color,
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
  }, [currentPage, debouncedSearch, selectedUserId, selectedAppId, startDate, endDate, limit]);

  const totalAccesses = dailyLogsState.reduce((sum, d) => sum + d.total, 0);

  const appTotals = appsList.map(app => ({
    ...app,
    total: dailyLogsState.reduce((s, d) => s + ((d.apps as Record<string, number>)[app.id] ?? 0), 0),
  })).sort((a, b) => b.total - a.total);

  const maxAppTotal = appTotals[0]?.total ?? 1;
  const coreServices = healthInfo ? [
    healthInfo.domain.status,
    healthInfo.api.status,
    healthInfo.database.status,
    healthInfo.storage.status,
    healthInfo.ssl.status,
  ] : [];
  const coreOnlineCount = coreServices.filter(status => status === 'online').length;
  const hasCoreIssue = coreServices.includes('offline');
  const hasCoreWarning = coreServices.includes('warning');
  const connectedApps = healthInfo?.apps ?? [];
  const onlineAppsCount = connectedApps.filter(app => app.status === 'online').length;
  const overallStatus = !healthInfo
    ? { label: 'Memeriksa layanan', detail: 'Menunggu hasil pemeriksaan terbaru.', tone: 'slate' }
    : hasCoreIssue
      ? { label: 'Gangguan terdeteksi', detail: 'Ada layanan inti yang tidak dapat dijangkau.', tone: 'rose' }
      : hasCoreWarning
        ? { label: 'Perlu perhatian', detail: 'Portal berjalan, tetapi ada kapasitas atau sertifikat yang perlu ditinjau.', tone: 'amber' }
        : { label: 'Portal beroperasi normal', detail: 'Seluruh layanan inti dapat dijangkau.', tone: 'emerald' };
  const statusTone = overallStatus.tone === 'emerald'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300'
    : overallStatus.tone === 'amber'
      ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300'
      : overallStatus.tone === 'rose'
        ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300'
        : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300';

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-md">

        <div className="relative z-10 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200/40 dark:border-slate-700/50">
              <Building2 className="h-3.5 w-3.5" />
              Admin Panel
            </span>
            <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-semibold ${statusTone}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${overallStatus.tone === 'emerald' ? 'bg-emerald-500' : overallStatus.tone === 'amber' ? 'bg-amber-500' : overallStatus.tone === 'rose' ? 'bg-rose-500' : 'bg-slate-400'} ${overallStatus.tone !== 'slate' ? 'animate-pulse' : ''}`} />
              {overallStatus.label}
            </span>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              {branding.adminHeroTitle}
            </h1>
            <PortalHelpGuide audience="admin" label="Panduan Admin" />
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl font-medium leading-relaxed">
            {branding.adminHeroDescription}
          </p>
        </div>
      </div>

      {/* Stats Cards & Live User Button */}
      <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-slate-900 px-5 py-4 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
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
                {i < arr.length - 1 && <span className="h-4 w-px bg-slate-200 dark:bg-slate-800 shrink-0 hidden sm:inline-block" />}
              </React.Fragment>
            );
          })}
        </div>

        {/* Dedicated Button: Lihat User Online */}
        <button
          type="button"
          onClick={() => setShowLiveUsersModal(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-50 hover:bg-emerald-100/90 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 px-3.5 py-2 text-xs font-bold text-emerald-800 dark:text-emerald-300 border border-emerald-200/90 dark:border-emerald-800/80 transition-all hover:scale-102 active:scale-95 cursor-pointer shadow-2xs shrink-0"
          title="Klik untuk melihat siapa saja yang sedang online & posisi halamannya"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span>Lihat User Online</span>
          <span className="rounded-full bg-emerald-500 px-1.5 py-0.2 text-[10px] font-black text-white">
            {stats.find(s => typeof (s as any).onlineNow === 'number')?.onlineNow ?? 0}
          </span>
        </button>
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
                  <span className="h-2 w-2 rounded-full shrink-0 animate-pulse" style={{ backgroundColor: app.color } as React.CSSProperties} />
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
            <div className="flex flex-col gap-3 px-5 py-3.5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/20 dark:bg-slate-955/5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* Search Text */}
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-slate-550 z-10 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Cari kata kunci log..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0d1218] text-xs font-semibold text-slate-700 dark:text-slate-300 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50 dark:focus:border-amber-500/50 transition-colors min-h-[42px]"
                  />
                </div>

                {/* Filter User Dropdown */}
                <SearchSelect
                  options={[
                    { value: '', label: 'Semua User' },
                    ...userOptions.map(u => ({
                      value: u.id,
                      label: u.nama ? `${u.nama} (${u.email})` : u.email,
                      subLabel: u.email
                    }))
                  ]}
                  value={selectedUserId}
                  onChange={(val: string) => {
                    setSelectedUserId(val);
                    setCurrentPage(1);
                  }}
                  placeholder="Filter User..."
                />

                {/* Filter Aplikasi Dropdown */}
                <SearchSelect
                  options={[
                    { value: '', label: 'Semua Aplikasi' },
                    ...appsList.map(a => ({
                      value: a.id,
                      label: a.name,
                      subLabel: 'Aplikasi SSO'
                    }))
                  ]}
                  value={selectedAppId}
                  onChange={(val: string) => {
                    setSelectedAppId(val);
                    setCurrentPage(1);
                  }}
                  placeholder="Filter Aplikasi..."
                />
              </div>

              {/* Range Date Picker & Reset */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs pt-1 w-full">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
                  {/* Row 1 & 2 on mobile: from label + datepicker from */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 w-full sm:w-auto">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 shrink-0">Dari:</span>
                    <CustomDateTimePicker
                      value={startDate}
                      onChange={setStartDate}
                      className="w-full sm:w-auto"
                    />
                  </div>

                  {/* Row 3 & 4 on mobile: to label + datepicker to */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 w-full sm:w-auto">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 shrink-0">Sampai:</span>
                    <CustomDateTimePicker
                      value={endDate}
                      onChange={setEndDate}
                      className="w-full sm:w-auto"
                    />
                  </div>
                </div>

                {(startDate || endDate || searchQuery || selectedUserId || selectedAppId) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setStartDate('');
                      setEndDate('');
                      setSelectedUserId('');
                      setSelectedAppId('');
                      setCurrentPage(1);
                    }}
                    className="w-full sm:w-auto px-3 py-2 sm:py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-955/20 text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-955/40 transition-all cursor-pointer shadow-xs text-center"
                  >
                    Reset Filter
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
                    <div key={i} className="flex items-center justify-between gap-3.5 px-5 py-3 hover:bg-slate-100/70 dark:hover:bg-slate-800/70 transition-colors">
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
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-amber-500/60 dark:hover:border-amber-500/70 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-all cursor-pointer shadow-2xs group focus:outline-none"
                        >
                          <Eye className="h-3.5 w-3.5 text-slate-400 group-hover:text-amber-500 transition-colors" />
                          <span>Detail</span>
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
            <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-3 px-5 py-3.5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/10 dark:bg-transparent text-center sm:text-left">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                Menampilkan {Math.min((currentPage - 1) * limit + 1, totalLogs)} - {Math.min(currentPage * limit, totalLogs)} dari {totalLogs} entri
              </span>
              <div className="flex items-center justify-center gap-1.5 flex-wrap w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pageNum = idx + 1;
                  if (pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                    const isAct = pageNum === currentPage;
                    return (
                      <button
                        type="button"
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
                  type="button"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* System Status */}
        <div className="relative overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
          <div className="relative z-10 flex flex-col gap-4 border-b border-slate-100 px-5 py-4 dark:border-slate-800/80 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${overallStatus.tone === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' : overallStatus.tone === 'amber' ? 'text-amber-600 dark:text-amber-400' : overallStatus.tone === 'rose' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'}`}>
                {overallStatus.tone === 'rose' ? <OctagonAlert className="h-5 w-5" /> : <MonitorCheck className="h-4.5 w-4.5" />}
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Status Layanan</h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{overallStatus.detail}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-bold ${statusTone}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${overallStatus.tone === 'emerald' ? 'bg-emerald-500' : overallStatus.tone === 'amber' ? 'bg-amber-500' : overallStatus.tone === 'rose' ? 'bg-rose-500' : 'bg-slate-400'} ${overallStatus.tone !== 'slate' ? 'animate-pulse' : ''}`} />
                {overallStatus.label}
              </span>
              <button
                type="button"
                onClick={() => { setIsHealthRefreshing(true); setHealthRefreshKey(value => value + 1); }}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                title="Perbarui status layanan"
                aria-label="Perbarui status layanan"
              >
                <RefreshCw className={`h-4 w-4 ${isHealthRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="relative z-10 grid grid-cols-1 divide-y divide-slate-100 border-b border-slate-100 dark:divide-slate-800 dark:border-slate-800 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <div className="px-5 py-3.5 flex flex-col items-center text-center"><div className="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400"><Server className="h-4 w-4" /><span className="text-[11px] font-semibold">Layanan inti</span></div><p className="mt-1.5 text-xl font-bold tabular-nums text-slate-900 dark:text-white">{healthInfo ? `${coreOnlineCount}/5` : '-'}</p><p className="text-[10px] text-slate-500 dark:text-slate-400">Infrastruktur Portal</p></div>
            <div className="px-5 py-3.5 flex flex-col items-center text-center"><div className="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400"><Wifi className="h-4 w-4" /><span className="text-[11px] font-semibold">Aplikasi terhubung</span></div><p className="mt-1.5 text-xl font-bold tabular-nums text-slate-900 dark:text-white">{healthInfo ? `${onlineAppsCount}/${connectedApps.length}` : '-'}</p><p className="text-[10px] text-slate-500 dark:text-slate-400">URL aktif yang dapat dijangkau</p></div>
            <div className="px-5 py-3.5 flex flex-col items-center text-center"><div className="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400"><Clock3 className="h-4 w-4" /><span className="text-[11px] font-semibold">Pemeriksaan terakhir</span></div><p className="mt-1.5 text-sm font-bold tabular-nums text-slate-900 dark:text-white">{lastHealthCheck ? lastHealthCheck.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Menunggu data'}</p><p className="text-[10px] text-slate-500 dark:text-slate-400">Polling otomatis setiap 30 detik</p></div>
          </div>

          <div className="relative z-10 p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 space-y-0">
            {[
              {
                key: 'domain',
                label: 'Domain Utama',
                host: healthInfo?.domain.host ?? 'inl.co.id',
                icon: Globe,
                status: healthInfo?.domain.status === 'online' ? 'Online' : 'Offline',
                color: healthInfo?.domain.status === 'online' ? 'text-emerald-500' : 'text-rose-500',
                detail: healthInfo?.domain.status === 'online' ? `${healthInfo.domain.latency} ms` : 'Offline',
                type: 'ticks'
              },
              {
                key: 'api',
                label: 'Koneksi API Portal',
                host: 'Portal API',
                icon: Cpu,
                status: !healthInfo
                  ? 'Mengukur...'
                  : healthInfo.api.status === 'online'
                    ? 'Online'
                    : healthInfo.api.status === 'warning'
                      ? 'Sibuk'
                      : 'Offline',
                color: healthInfo?.api.status === 'warning'
                  ? 'text-amber-500 animate-pulse'
                  : healthInfo?.api.status === 'online'
                    ? 'text-emerald-500'
                    : 'text-rose-500',
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
                host: healthInfo?.ssl.host ?? 'inl.co.id',
                icon: Shield,
                status: healthInfo ? `${healthInfo.ssl.daysLeft} hari` : 'Mengukur...',
                color: healthInfo?.ssl.status === 'warning' ? 'text-amber-500 animate-pulse' : healthInfo?.ssl.status === 'online' ? 'text-emerald-500' : 'text-rose-500',
                detail: healthInfo ? (healthInfo.ssl.status === 'warning' ? 'Expiring soon' : 'Valid') : '',
                type: 'progress',
                pct: healthInfo ? Math.min(100, Math.max(0, (healthInfo.ssl.daysLeft / 90) * 100)) : 0
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
                          style={{ width: `${s.pct}%` } as React.CSSProperties}
                        />
                      </div>
                    )}

                    {s.type === 'api-line' && (
                      <div className="flex-1 max-w-[130px] h-1.5 bg-slate-100 dark:bg-slate-850 rounded-full overflow-hidden relative shrink-0">
                        <div
                          className={`absolute top-0 bottom-0 w-3 rounded-full ${healthInfo?.api.status === 'online'
                            ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]'
                            : 'bg-rose-455 shadow-[0_0_6px_rgba(244,63,94,0.8)]'
                            } animate-network-p1`}
                        />
                        <div
                          className={`absolute top-0 bottom-0 w-3 rounded-full ${healthInfo?.api.status === 'online'
                            ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]'
                            : 'bg-rose-455 shadow-[0_0_6px_rgba(244,63,94,0.8)]'
                            } animate-network-p2`}
                        />
                        <div
                          className={`absolute top-0 bottom-0 w-3 rounded-full ${healthInfo?.api.status === 'online'
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

          {/* Aplikasi Terhubung — status keterjangkauan real-time tiap aplikasi SSO */}
          <div className="relative z-10 px-5 pb-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-450">Aplikasi Terhubung</p>
              {healthInfo?.apps && (
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-550">
                  {healthInfo.apps.filter(a => a.status === 'online').length}/{healthInfo.apps.length} online
                </span>
              )}
            </div>
            {!healthInfo?.apps || healthInfo.apps.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-400 dark:text-slate-550">
                {healthInfo ? 'Belum ada aplikasi SSO aktif yang terdaftar.' : 'Memuat status aplikasi...'}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {healthInfo.apps.map(app => (
                  <div
                    key={app.id}
                    className="flex items-center gap-3 py-3 px-3.5 rounded-xl border border-slate-100/70 dark:border-slate-850/60 bg-slate-50/20 dark:bg-slate-950/20 hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-all duration-200"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 overflow-hidden">
                      {app.icon ? (
                        <img src={resolveImageUrl(app.icon)} alt={app.nama} className="h-full w-full object-contain" />
                      ) : (
                        <Globe className="h-4 w-4 text-slate-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-850 dark:text-slate-150 text-xs truncate">{app.nama}</p>
                      <p className="text-[10px] text-slate-455 dark:text-slate-550 font-mono truncate">{app.url.replace(/^https?:\/\//, '')}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${app.status === 'online'
                        ? 'text-emerald-700 bg-emerald-50/80 border-emerald-200/50 dark:text-emerald-450 dark:bg-emerald-955/20 dark:border-emerald-900/30'
                        : 'text-rose-700 bg-rose-50/80 border-rose-200/50 dark:text-rose-455 dark:bg-rose-955/20 dark:border-rose-900/30'
                        }`}>
                        {app.status === 'online' ? 'Online' : 'Offline'}
                      </span>
                      {app.status === 'online' && (
                        <span className="text-[9px] font-mono text-slate-400 dark:text-slate-550">{app.latency} ms</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Detail Modal */}
        <ModalPortal open={!!selectedLog}>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-lg rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0c1017] p-6 shadow-2xl space-y-4 animate-scale-up">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-3.5">
                <div className="flex items-center gap-2.5">

                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                      Detail Log Aktivitas
                    </h3>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                      ID Log: {selectedLog?.raw.id || '-'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedLog(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer focus:outline-none"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {selectedLog && (
                <div className="space-y-4 text-xs">
                  {/* Activity Summary Banner */}
                  <div className="p-3.5 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 flex items-center gap-3">
                    <selectedLog.icon className={`h-6 w-6 shrink-0 ${selectedLog.color}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Aktivitas</p>
                      <p className="font-bold text-slate-900 dark:text-slate-100 text-xs mt-0.5 leading-snug">
                        {selectedLog.text}
                      </p>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Pengguna */}
                    <div className="flex flex-col gap-1 p-3 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Pengguna</span>
                      <p className="font-bold text-slate-900 dark:text-slate-100 truncate">
                        {selectedLog.raw.userNama || selectedLog.raw.email}
                      </p>
                      {selectedLog.raw.userNama && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {selectedLog.raw.email}
                        </p>
                      )}
                    </div>

                    {/* Aplikasi */}
                    <div className="flex flex-col gap-1 p-3 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Layanan / Aplikasi</span>
                      <p className="font-bold text-slate-900 dark:text-slate-100 truncate">
                        {selectedLog.raw.appName || 'Portal SSO'}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {selectedLog.raw.appName ? 'Aplikasi Terdaftar' : 'Sistem Utama'}
                      </p>
                    </div>
                  </div>

                  {/* Kategori Aksi & Waktu */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Jenis Aksi */}
                    <div className="flex flex-col gap-1 p-3 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Jenis Aksi</span>
                      <div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-200/70 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300/60 dark:border-slate-700">
                          {selectedLog.raw.action === 'login'
                            ? 'Login Portal'
                            : selectedLog.raw.action === 'logout'
                              ? 'Logout Portal'
                              : selectedLog.raw.action === 'access_app'
                                ? 'Akses Aplikasi'
                                : selectedLog.raw.action === 'update_profile_photo'
                                  ? 'Ubah Foto Profil'
                                  : selectedLog.raw.action}
                        </span>
                      </div>
                    </div>

                    {/* Waktu Kejadian */}
                    <div className="flex flex-col gap-1 p-3 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Waktu Kejadian</span>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs mt-0.5">
                        {new Date(selectedLog.raw.createdAt).toLocaleString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          timeZone: 'Asia/Jakarta',
                        })}{' '}
                        WIB
                      </p>
                    </div>
                  </div>

                  {/* Keterangan Tambahan */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Keterangan Tambahan</span>
                    <div className="font-medium text-slate-800 dark:text-slate-200 bg-slate-50/80 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200/70 dark:border-slate-800 leading-relaxed whitespace-pre-wrap text-xs">
                      {selectedLog.raw.details || '-'}
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-850">
                <button
                  type="button"
                  onClick={() => setSelectedLog(null)}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-350 hover:bg-slate-50 hover:text-slate-900 dark:hover:bg-slate-850 dark:hover:text-slate-100 transition-all cursor-pointer focus:outline-none"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      </div>

      {/* Live Users Presence Modal */}
      <LiveUsersModal
        open={showLiveUsersModal}
        onClose={() => setShowLiveUsersModal(false)}
      />
    </div>
  );
}
