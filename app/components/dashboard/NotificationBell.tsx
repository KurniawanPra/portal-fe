'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck, CircleCheck, FileDown, Loader2, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface PortalNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  entityType: string | null;
  entityId: string | null;
  isRead: boolean;
  createdAt: string;
}

function notificationHref(item: PortalNotification) {
  if (item.entityType === 'document_download_request') {
    return item.type === 'document_download_request'
      ? '/dashboard/dokumen/approval'
      : '/dashboard/dokumen';
  }
  return '/dashboard';
}

export default function NotificationBell() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<PortalNotification[]>([]);
  const [unread, setUnread] = useState(0);

  const load = async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const [notifRes, capRes] = await Promise.all([
        api.get<PortalNotification[]>('/notifications?limit=8'),
        api.get<{ pendingApprovalCount?: number }>('/documents/capabilities').catch(() => ({ data: { pendingApprovalCount: 0 } })),
      ]);
      const notifs = [...(notifRes.data || [])];
      const pendingCount = capRes.data?.pendingApprovalCount || 0;
      const dbUnread = Number((notifRes.meta as typeof notifRes.meta & { unread?: number })?.unread || 0);

      if (pendingCount > 0) {
        const alertItem: PortalNotification = {
          id: 'pending-approval-alert-item',
          type: 'document_download_request',
          title: `Persetujuan Akses Dokumen (${pendingCount} Pengajuan)`,
          message: `Ada ${pendingCount} permintaan unduh dokumen yang memerlukan persetujuan atau penolakan dari Anda.`,
          entityType: 'document_download_request',
          entityId: null,
          isRead: false,
          createdAt: new Date().toISOString(),
        };
        if (!notifs.some(n => n.id === alertItem.id)) {
          notifs.unshift(alertItem);
        }
      }

      setItems(notifs);
      setUnread(dbUnread + pendingCount);
    } catch {
      // Notification failure must not block the navbar.
    } finally {
      if (!quiet) setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const timer = window.setInterval(() => load(true), 15_000);
    const handleApprovalChanged = () => load(true);
    window.addEventListener('document-approvals-changed', handleApprovalChanged);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('document-approvals-changed', handleApprovalChanged);
    };
  }, []);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  const markRead = async (item: PortalNotification) => {
    if (item.isRead) return;
    setItems(current => current.map(row => row.id === item.id ? { ...row, isRead: true } : row));
    setUnread(current => Math.max(0, current - 1));
    try {
      await api.put(`/notifications/${item.id}/read`, {});
    } catch {
      load(true);
    }
  };

  const markAllRead = async () => {
    setItems(current => current.map(item => ({ ...item, isRead: true })));
    setUnread(0);
    try {
      await api.put('/notifications/read-all', {});
    } catch {
      load(true);
    }
  };

  const deleteItem = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    const target = items.find(row => row.id === id);
    setItems(current => current.filter(row => row.id !== id));
    if (target && !target.isRead) {
      setUnread(current => Math.max(0, current - 1));
    }
    try {
      await api.delete(`/notifications/${id}`);
    } catch {
      load(true);
    }
  };

  const clearAll = async () => {
    setItems([]);
    setUnread(0);
    try {
      await api.delete('/notifications/clear-all');
    } catch {
      load(true);
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(value => !value)}
        aria-label={`Notifikasi${unread ? `, ${unread} belum dibaca` : ''}`}
        className={cn(
          'relative flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-300',
          open
            ? 'border-amber-400 bg-amber-500/10 text-amber-600 dark:border-amber-500/50 dark:bg-amber-500/15 dark:text-amber-400 shadow-[inset_2px_2px_5px_rgba(245,158,11,0.2),inset_-2px_-2px_5px_rgba(255,255,255,0.9)] dark:shadow-[inset_2px_2px_6px_rgba(0,0,0,0.6)]'
            : 'border-white/90 bg-gradient-to-br from-slate-50 via-white to-slate-100/90 text-slate-600 dark:border-white/[0.08] dark:from-[#161d2a] dark:to-[#0f141f] dark:text-slate-300 shadow-[4px_4px_10px_rgba(163,177,198,0.45),-4px_-4px_10px_rgba(255,255,255,1),inset_0_1px_1px_rgba(255,255,255,0.9)] dark:shadow-[4px_4px_12px_rgba(4,7,13,0.85),-3px_-3px_10px_rgba(35,46,68,0.4),inset_0_1px_1px_rgba(255,255,255,0.12)] hover:scale-[1.05]',
        )}
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-black leading-none text-white ring-2 ring-white dark:ring-slate-900">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Mobile backdrop to easily dismiss */}
          <div
            aria-hidden="true"
            className="fixed inset-0 z-[190] bg-slate-900/20 backdrop-blur-xs sm:hidden"
            onClick={() => setOpen(false)}
          />

          <div className="fixed left-3 right-3 top-[4.5rem] z-[200] max-w-none overflow-hidden rounded-3xl border border-white/90 dark:border-white/[0.1] bg-gradient-to-br from-white via-slate-50 to-slate-100/95 dark:from-[#181e2d] dark:via-[#131824] dark:to-[#0e121c] backdrop-blur-2xl shadow-[8px_8px_32px_rgba(163,177,198,0.65),-6px_-6px_22px_rgba(255,255,255,1)] dark:shadow-[8px_8px_35px_rgba(4,7,13,0.95),-6px_-6px_22px_rgba(36,48,72,0.45)] sm:absolute sm:left-auto sm:right-0 sm:top-13 sm:w-[23rem] origin-top-right transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] animate-in fade-in-0 zoom-in-95 slide-in-from-top-2">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">Notifikasi</p>
                <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{unread} belum dibaca</p>
              </div>
              <div className="flex items-center gap-2">
                {unread > 0 && (
                  <button type="button" onClick={markAllRead} className="flex items-center gap-1 text-[11px] font-bold text-amber-700 hover:text-amber-800 dark:text-amber-400">
                    <CheckCheck className="h-3.5 w-3.5" /> Dibaca
                  </button>
                )}
                {items.length > 0 && (
                  <button type="button" onClick={clearAll} className="flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400">
                    <Trash2 className="h-3.5 w-3.5" /> Hapus Semua
                  </button>
                )}
              </div>
            </div>

            <div className="relative">
              <div className="max-h-[calc(100dvh-11rem)] sm:max-h-[24rem] overflow-y-auto hide-scrollbar">
                {loading ? (
                  <div className="flex items-center justify-center gap-2 px-4 py-12 text-xs text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin" /> Memuat notifikasi...
                  </div>
                ) : items.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    <CircleCheck className="mx-auto h-6 w-6 text-emerald-500" />
                    <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">Belum ada notifikasi baru.</p>
                  </div>
                ) : items.map(item => (
                  <div
                    key={item.id}
                    className={cn(
                      'group relative flex items-start justify-between gap-2 border-b border-slate-100 px-4 py-3.5 transition-colors last:border-0 dark:border-slate-800',
                      item.isRead ? 'hover:bg-slate-50 dark:hover:bg-slate-800/60' : 'bg-amber-50/50 hover:bg-amber-50 dark:bg-amber-950/10 dark:hover:bg-amber-950/20',
                    )}
                  >
                    <Link
                      href={notificationHref(item)}
                      onClick={() => { markRead(item); setOpen(false); }}
                      className="flex flex-1 items-start gap-3 min-w-0"
                    >
                      <FileDown className={cn('mt-0.5 h-4 w-4 shrink-0', item.isRead ? 'text-slate-400' : 'text-amber-600 dark:text-amber-400')} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-bold text-slate-800 dark:text-slate-100">{item.title}</span>
                        <span className="mt-1 block text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">{item.message}</span>
                        <span className="mt-1.5 block text-[10px] font-medium text-slate-400">
                          {new Date(item.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                        </span>
                      </span>
                    </Link>
                    <button
                      type="button"
                      title="Hapus notifikasi ini"
                      onClick={(e) => deleteItem(e, item.id)}
                      className="shrink-0 rounded p-1 text-slate-400 opacity-0 transition-opacity hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100 dark:text-slate-500 dark:hover:bg-rose-950/30 dark:hover:text-rose-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Bottom Blur Mask Indicator if Scrollable */}
              {items.length > 3 && (
                <div className="pointer-events-none absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-white via-white/80 to-transparent dark:from-[#0e121c] dark:via-[#0e121c]/80 backdrop-blur-[2px] z-20 flex items-end justify-center pb-1 text-[9.5px] font-extrabold uppercase tracking-wider text-amber-600/90 dark:text-amber-400/90 animate-pulse">
                  ↓ Gulir ke bawah
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
