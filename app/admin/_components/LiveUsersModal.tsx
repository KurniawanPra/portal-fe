'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AppWindow,
  ChevronLeft,
  ChevronRight,
  Compass,
  Laptop,
  Layers,
  MapPin,
  Monitor,
  RefreshCw,
  Search,
  ShieldAlert,
  Smartphone,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { api } from '@/lib/api';
import { ModalPortal } from '@/components/ui/ModalPortal';
import { cn, resolveImageUrl } from '@/lib/utils';

export interface UserPresence {
  userId: string;
  email: string;
  nama: string;
  nrk?: string | null;
  fotoProfil?: string | null;
  role: string;
  jabatan: string;
  bagian: string;
  appId: string;
  appName: string;
  currentPath: string;
  pageTitle: string;
  device: string;
  browser: string;
  ipAddress: string;
  lastSeenAt: string;
  onlineSince: string;
}

interface LiveUsersModalProps {
  open: boolean;
  onClose: () => void;
}

function getRelativeActiveTime(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));
  if (diffSec < 5) return 'Baru saja';
  if (diffSec < 60) return `${diffSec} detik lalu`;
  const diffMin = Math.floor(diffSec / 60);
  return `${diffMin} menit lalu`;
}

function getDeviceIcon(device: string) {
  if (/android|ios/i.test(device)) {
    return Smartphone;
  }
  if (/mac/i.test(device)) {
    return Laptop;
  }
  return Monitor;
}

export function LiveUsersModal({ open, onClose }: LiveUsersModalProps) {
  const [users, setUsers] = useState<UserPresence[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedApp, setSelectedApp] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchLiveUsers = async () => {
    try {
      const res = await api.get<{ liveUsers: UserPresence[]; totalOnline: number }>('/presence/live');
      if (res.data?.liveUsers) {
        setUsers(res.data.liveUsers);
      }
    } catch (err) {
      console.error('Failed to load live users presence:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetchLiveUsers();

    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchLiveUsers();
    }, 5_000);

    return () => clearInterval(interval);
  }, [open, autoRefresh]);

  // Reset page when search or tab filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedApp, pageSize]);

  // Unique apps for tab filters
  const appOptions = useMemo(() => {
    const apps = new Map<string, string>();
    users.forEach(u => {
      if (u.appId && u.appName) {
        apps.set(u.appId, u.appName);
      }
    });
    return Array.from(apps.entries()).map(([id, name]) => ({ id, name }));
  }, [users]);

  // Filtered users list
  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter(u => {
      const matchApp = selectedApp === 'all' || u.appId === selectedApp;
      const matchQuery =
        !q ||
        u.nama.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.nrk && u.nrk.toLowerCase().includes(q)) ||
        u.jabatan.toLowerCase().includes(q) ||
        u.bagian.toLowerCase().includes(q) ||
        u.pageTitle.toLowerCase().includes(q) ||
        u.currentPath.toLowerCase().includes(q);
      return matchApp && matchQuery;
    });
  }, [users, search, selectedApp]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedUsers = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, safePage, pageSize]);

  const startRecord = filteredUsers.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endRecord = Math.min(safePage * pageSize, filteredUsers.length);

  if (!open) return null;

  return (
    <ModalPortal open={open}>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-fade-in"
          onClick={onClose}
        />

        {/* Modal Window */}
        <div className="relative z-10 flex max-h-[88vh] w-full max-w-3xl flex-col rounded-2xl border border-slate-200/90 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900 dark:text-white">
                  Live User Presence Monitor
                </h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-black text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {users.length} Online
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pantau posisi halaman dan aplikasi yang sedang aktif dibuka pengguna saat ini.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchLiveUsers}
                disabled={loading}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                title="Segarkan data sekarang"
              >
                <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin text-amber-500')} />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Filter Toolbar */}
          <div className="flex flex-col gap-2.5 border-b border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800/80 dark:bg-slate-955/40 sm:flex-row sm:items-center sm:justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Cari nama, email, jabatan, atau halaman..."
                className="w-full rounded-xl border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              />
            </div>

            {/* App Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedApp('all')}
                className={cn(
                  'rounded-lg px-2.5 py-1 text-xs font-bold transition-all',
                  selectedApp === 'all'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'
                )}
              >
                Semua ({users.length})
              </button>
              {appOptions.map(app => {
                const count = users.filter(u => u.appId === app.id).length;
                return (
                  <button
                    key={app.id}
                    type="button"
                    onClick={() => setSelectedApp(app.id)}
                    className={cn(
                      'rounded-lg px-2.5 py-1 text-xs font-bold transition-all',
                      selectedApp === app.id
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'
                    )}
                  >
                    {app.name} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* User List Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading && users.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
                <RefreshCw className="h-6 w-6 animate-spin text-amber-500 mb-2" />
                <p className="text-xs font-semibold">Memeriksa aktivitas pengguna...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-10 w-10 text-slate-300 dark:text-slate-700 mb-2" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Tidak ada pengguna aktif ditemukan
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {search ? 'Coba sesuaikan kata kunci pencarian Anda.' : 'Belum ada pengguna lain yang sedang aktif.'}
                </p>
              </div>
            ) : (
              paginatedUsers.map(user => {
                const DeviceIcon = getDeviceIcon(user.device);
                const isSuperAdmin = user.role === 'super_admin';

                return (
                  <div
                    key={user.userId}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs transition-all hover:border-amber-300 hover:shadow-xs dark:border-slate-800 dark:bg-slate-900/90 dark:hover:border-amber-500/40"
                  >
                    {/* Left: User Identity */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative h-10 w-10 shrink-0">
                        {user.fotoProfil ? (
                          <img
                            src={resolveImageUrl(user.fotoProfil)}
                            alt={user.nama}
                            className="h-10 w-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                            onError={e => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-xs font-black text-white shadow-xs">
                            {user.nama.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 dark:text-white text-xs truncate">
                            {user.nama}
                          </span>
                          {isSuperAdmin && (
                            <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[9px] font-black uppercase text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/60">
                              Admin
                            </span>
                          )}
                          {user.nrk && (
                            <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                              #{user.nrk}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {user.jabatan} · <span className="font-semibold text-slate-600 dark:text-slate-300">{user.bagian}</span>
                        </p>
                      </div>
                    </div>

                    {/* Middle: Active App & Location */}
                    <div className="flex flex-col gap-1 min-w-0 sm:max-w-xs">
                      <div className="flex items-center gap-1.5">
                        <span className={cn(
                          'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold',
                          user.appId === 'portal'
                            ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300'
                        )}>
                          <AppWindow className="h-3 w-3" />
                          {user.appName}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-medium text-slate-700 dark:text-slate-200 truncate">
                        <MapPin className="h-3 w-3 shrink-0 text-amber-500" />
                        <span className="truncate font-semibold" title={user.currentPath}>
                          {user.pageTitle}
                        </span>
                      </div>
                    </div>

                    {/* Right: Device & Activity Time */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-800 text-[10px]">
                      <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500">
                        <DeviceIcon className="h-3.5 w-3.5" />
                        <span>{user.device} · {user.browser}</span>
                      </div>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {getRelativeActiveTime(user.lastSeenAt)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer with Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/70 px-6 py-3 dark:border-slate-800 dark:bg-slate-900/70 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">Live Sync (5s)</span>
              </div>
              <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">|</span>
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                {filteredUsers.length > 0
                  ? `Menampilkan ${startRecord}–${endRecord} dari ${filteredUsers.length} online`
                  : '0 online'}
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Page size selector */}
              {filteredUsers.length > 10 && (
                <div className="flex items-center gap-1 text-[11px]">
                  <span className="text-slate-400">Baris:</span>
                  <select
                    value={pageSize}
                    onChange={e => setPageSize(Number(e.target.value))}
                    className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-xs font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              )}

              {/* Prev / Next Page controls */}
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={safePage <= 1}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    title="Halaman sebelumnya"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>

                  <span className="px-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                    {safePage} / {totalPages}
                  </span>

                  <button
                    type="button"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={safePage >= totalPages}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    title="Halaman berikutnya"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={onClose}
                className="rounded-lg bg-slate-200 px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
