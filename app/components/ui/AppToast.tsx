'use client';

import { AlertCircle, CheckCircle2 } from 'lucide-react';

export type AppToastState = { type: 'ok' | 'err'; text: string } | null;

export function AppToast({ toast }: { toast: AppToastState }) {
  if (!toast) return null;

  const isSuccess = toast.type === 'ok';
  const Icon = isSuccess ? CheckCircle2 : AlertCircle;
  const title = isSuccess ? 'Berhasil' : 'Tindakan gagal';

  return (
    <div
      role="status"
      aria-live={isSuccess ? 'polite' : 'assertive'}
      style={{ zIndex: 2147483647, top: 'calc(env(safe-area-inset-top, 0px) + 18px)', right: 'max(16px, env(safe-area-inset-right, 0px))' }}
      className={`fixed w-[min(23rem,calc(100vw-2rem))] overflow-hidden rounded-xl border bg-white shadow-[0_16px_38px_rgba(15,23,42,0.16)] animate-fade-up dark:bg-slate-900 text-left ${
        isSuccess ? 'border-emerald-200/90 dark:border-emerald-900/70' : 'border-rose-200/90 dark:border-rose-900/70'
      }`}
    >
      <div className="flex items-start px-4 py-3.5 text-left">
        <Icon className={`h-6 w-6 shrink-0 mt-1.5 mr-3 ${isSuccess ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`} />
        <div className="min-w-0 flex-1 pt-0.5 text-left">
          <p className="text-xs font-bold text-slate-900 dark:text-white text-left">{title}</p>
          <p className="mt-1 break-words text-xs leading-relaxed text-slate-600 dark:text-slate-300 text-left">{toast.text}</p>
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-1 overflow-hidden pointer-events-none rounded-b-xl">
        <span
          className={`block h-full w-full animate-toast-progress ${isSuccess ? 'bg-emerald-500' : 'bg-rose-500'}`}
          style={{ transformOrigin: 'left center' }}
        />
      </div>
    </div>
  );
}
