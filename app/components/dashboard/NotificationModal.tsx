'use client';

import React from 'react';
import {
  X,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Info,
  Bell,
  BellOff,
  Trash2,
  CheckCheck,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type NotificationCategory = 'security' | 'warning' | 'success' | 'info';

export interface Notification {
  id: string;
  category: NotificationCategory;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkAllRead: () => void;
  onClearAll: () => void;
  onToggleRead: (id: string) => void;
}

const categoryConfig: Record<
  NotificationCategory,
  { icon: React.ComponentType<{ className?: string }>; bg: string; text: string; dot: string }
> = {
  security: {
    icon: ShieldAlert,
    bg: 'bg-rose-100/80 dark:bg-rose-950/30',
    text: 'text-rose-600 dark:text-rose-400',
    dot: 'bg-rose-500',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-amber-100/80 dark:bg-amber-950/30',
    text: 'text-amber-600 dark:text-amber-400',
    dot: 'bg-amber-500',
  },
  success: {
    icon: CheckCircle2,
    bg: 'bg-emerald-100/80 dark:bg-emerald-950/30',
    text: 'text-emerald-600 dark:text-emerald-400',
    dot: 'bg-emerald-500',
  },
  info: {
    icon: Info,
    bg: 'bg-cyan-100/80 dark:bg-cyan-950/30',
    text: 'text-cyan-600 dark:text-cyan-400',
    dot: 'bg-cyan-500',
  },
};

function NotificationItem({
  notification,
  onToggleRead,
}: {
  notification: Notification;
  onToggleRead: (id: string) => void;
}) {
  const config = categoryConfig[notification.category];
  const Icon = config.icon;

  return (
    <button
      type="button"
      onClick={() => onToggleRead(notification.id)}
      className={cn(
        'group relative w-full text-left flex items-start gap-3.5 rounded-2xl p-3.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500/25 cursor-pointer',
        notification.isRead
          ? 'bg-transparent hover:bg-slate-50/60 dark:hover:bg-slate-800/20'
          : 'bg-white/70 dark:bg-slate-800/40 shadow-sm hover:bg-white/90 dark:hover:bg-slate-800/60'
      )}
    >
      {/* Unread Indicator */}
      {!notification.isRead && (
        <span
          className={cn(
            'absolute left-2 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full shrink-0',
            config.dot
          )}
        />
      )}

      {/* Category Icon */}
      <div
        className={cn(
          'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105',
          config.bg
        )}
      >
        <Icon className={cn('h-4.5 w-4.5', config.text)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-xs font-bold leading-tight truncate transition-colors',
            notification.isRead
              ? 'text-slate-500 dark:text-slate-400'
              : 'text-slate-800 dark:text-slate-100'
          )}
        >
          {notification.title}
        </p>
        <p
          className={cn(
            'mt-0.5 text-[11px] leading-snug font-medium line-clamp-2',
            notification.isRead
              ? 'text-slate-400 dark:text-slate-500'
              : 'text-slate-500 dark:text-slate-400'
          )}
        >
          {notification.message}
        </p>
        <span className="mt-1.5 flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
          <Clock className="h-2.5 w-2.5" />
          {notification.timestamp}
        </span>
      </div>
    </button>
  );
}

export default function NotificationModal({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
  onClearAll,
  onToggleRead,
}: NotificationModalProps) {
  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const hasNotifications = notifications.length > 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-slate-900/10 dark:bg-slate-950/30 backdrop-blur-[2px] transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Notifikasi"
        className={cn(
          'fixed z-50 top-[5.5rem] right-4 sm:right-6 lg:right-8 w-[calc(100vw-2rem)] max-w-sm',
          'animate-notification-slide-in'
        )}
        style={{
          animation: 'notif-slide-in 0.22s cubic-bezier(0.22,1,0.36,1) both',
        }}
      >
        {/* Notification Panel */}
        <div className="relative flex flex-col overflow-hidden rounded-3xl border border-white/70 dark:border-slate-700/50 bg-white/85 dark:bg-[#151b26]/90 backdrop-blur-2xl shadow-2xl shadow-slate-900/10 dark:shadow-slate-950/40 max-h-[min(75vh,540px)]">

          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100/80 dark:border-slate-800/50 px-5 py-4 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/15 dark:bg-amber-500/10">
                <Bell className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 leading-none">
                  Notifikasi
                </h2>
                {unreadCount > 0 ? (
                  <p className="mt-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                    {unreadCount} belum dibaca
                  </p>
                ) : (
                  <p className="mt-0.5 text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                    Semua sudah dibaca
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500/25 cursor-pointer"
              aria-label="Tutup notifikasi"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Action Buttons */}
          {hasNotifications && (
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100/60 dark:border-slate-800/40 shrink-0">
              <button
                type="button"
                onClick={onMarkAllRead}
                disabled={unreadCount === 0}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              >
                <CheckCheck className="h-3 w-3" />
                Tandai Semua Dibaca
              </button>

              <div className="flex-1" />

              <button
                type="button"
                onClick={onClearAll}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-600 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              >
                <Trash2 className="h-3 w-3" />
                Hapus Semua
              </button>
            </div>
          )}

          {/* Notification List */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {hasNotifications ? (
              <div className="flex flex-col gap-1 p-3">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onToggleRead={onToggleRead}
                  />
                ))}
              </div>
            ) : (
              /* Premium Empty State */
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                <div className="relative mb-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100/80 dark:bg-slate-800/50">
                    <BellOff className="h-7 w-7 text-slate-300 dark:text-slate-600" />
                  </div>
                  <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-emerald-400 dark:bg-emerald-500 flex items-center justify-center">
                    <CheckCircle2 className="h-3 w-3 text-white" />
                  </div>
                </div>
                <p className="text-sm font-black text-slate-700 dark:text-slate-200">
                  Semua bersih!
                </p>
                <p className="mt-1 text-xs font-medium text-slate-400 dark:text-slate-500 max-w-[200px]">
                  Tidak ada notifikasi baru. Kamu sudah up to date.
                </p>
              </div>
            )}
          </div>

          {/* Footer Watermark */}
          <div className="border-t border-slate-100/60 dark:border-slate-800/40 px-5 py-3 shrink-0">
            <p className="text-center text-[9px] font-bold uppercase tracking-widest text-slate-300 dark:text-slate-600">
              Portal SSO — PT Industri Nabati Lestari
            </p>
          </div>
        </div>
      </div>

      {/* Keyframe animation injection */}
      <style>{`
        @keyframes notif-slide-in {
          from {
            opacity: 0;
            transform: translateY(-10px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </>
  );
}
