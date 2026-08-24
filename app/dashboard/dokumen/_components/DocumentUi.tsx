'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, Loader2, SearchX, X } from 'lucide-react';
import { AnimatedModalPortal } from '@/components/ui/AnimatedModalPortal';
import { cn } from '@/lib/utils';
import type { DownloadStatus, PaginationMeta } from '../_lib/types';

export const inputClass = 'h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 disabled:bg-slate-100 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:disabled:bg-slate-800';
export const labelClass = 'mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400';

export function DocumentPageHeader({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="mb-3.5 flex flex-col gap-3 border-b border-slate-200 pb-3.5 dark:border-slate-800 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-xl font-black text-slate-900 dark:text-white sm:text-2xl">{title}</h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">{description}</p>
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}

export function DocumentPanel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <section className={cn('relative overflow-visible rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900', className)}>{children}</section>;
}

export function LoadingButton({ loading, children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={cn('inline-flex h-10 items-center justify-center gap-2 rounded-md bg-amber-500 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60', className)}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

export function IconAction({ label, children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button {...props} title={label} aria-label={label} className={cn('inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white', className)}>
      {children}
    </button>
  );
}

export function DocumentTable({
  headers,
  children,
  loading,
  empty,
  alignLastHeader,
  minWidth = 'min-w-[900px]',
}: {
  headers: string[];
  children: React.ReactNode;
  loading?: boolean;
  empty?: boolean;
  alignLastHeader?: 'start' | 'right';
  minWidth?: string;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);

  const checkScroll = React.useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 3);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 3);
  }, []);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);

    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);

    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
      ro.disconnect();
    };
  }, [checkScroll, children, loading]);

  const scrollByOffset = (offset: number) => {
    containerRef.current?.scrollBy({ left: offset, behavior: 'smooth' });
  };

  return (
    <div className="relative w-full overflow-visible">
      {/* Floating Scroll Control Buttons — High z-index sitting above table flow */}
      {!loading && !empty && canScrollRight && (
        <div className="pointer-events-none absolute -right-3.5 top-2.5 z-40 flex items-center sm:-right-4.5">
          <button
            type="button"
            onClick={() => scrollByOffset(260)}
            className="pointer-events-auto flex h-8.5 w-8.5 items-center justify-center rounded-full border border-amber-500/70 bg-white dark:bg-[#111622] text-amber-600 dark:text-amber-400 shadow-[0_4px_16px_rgba(245,158,11,0.4)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.7)] hover:scale-110 hover:bg-amber-500 hover:text-white dark:hover:bg-amber-500 transition-all duration-200 cursor-pointer"
            aria-label="Scroll kanan"
            title="Geser tabel ke kanan"
          >
            <ChevronRight className="h-4.5 w-4.5 stroke-[2.5]" />
          </button>
        </div>
      )}

      {!loading && !empty && canScrollLeft && (
        <div className="pointer-events-none absolute -left-3.5 top-2.5 z-40 flex items-center sm:-left-4.5">
          <button
            type="button"
            onClick={() => scrollByOffset(-260)}
            className="pointer-events-auto flex h-8.5 w-8.5 items-center justify-center rounded-full border border-amber-500/70 bg-white dark:bg-[#111622] text-amber-600 dark:text-amber-400 shadow-[0_4px_16px_rgba(245,158,11,0.4)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.7)] hover:scale-110 hover:bg-amber-500 hover:text-white dark:hover:bg-amber-500 transition-all duration-200 cursor-pointer"
            aria-label="Scroll kiri"
            title="Geser tabel ke kiri"
          >
            <ChevronLeft className="h-4.5 w-4.5 stroke-[2.5]" />
          </button>
        </div>
      )}

      {/* Left Edge Gradient Fade */}
      {canScrollLeft && (
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-slate-300/60 via-slate-200/20 to-transparent dark:from-[#0e131d]/90 dark:via-[#0e131d]/40 dark:to-transparent transition-opacity duration-300" />
      )}

      {/* Right Edge Gradient Fade */}
      {canScrollRight && (
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-slate-300/60 via-slate-200/20 to-transparent dark:from-[#0e131d]/90 dark:via-[#0e131d]/40 dark:to-transparent transition-opacity duration-300" />
      )}

      {/* Scrollable Container with Custom Table Scrollbar */}
      <div
        ref={containerRef}
        className="overflow-x-auto custom-table-scrollbar overscroll-x-contain"
      >
        <table className={cn("w-full text-left text-sm", minWidth)}>
          <thead className="border-b border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-950/35">
            <tr>
              {headers.map((header, index) => {
                const isLast = index === headers.length - 1;
                const isRightAligned = isLast && alignLastHeader === 'right';
                return (
                  <th
                    key={header}
                    className={cn(
                      'px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400',
                      isRightAligned ? 'text-right' : 'text-left'
                    )}
                  >
                    {header}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {loading ? (
              <tr><td colSpan={headers.length} className="px-4 py-16 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-amber-500" /><span className="mt-2 block text-xs font-semibold text-slate-400">Memuat data...</span></td></tr>
            ) : empty ? (
              <tr><td colSpan={headers.length} className="px-4 py-16 text-center"><SearchX className="mx-auto h-5 w-5 text-slate-400" /><span className="mt-2 block text-xs font-semibold text-slate-500 dark:text-slate-400">Data tidak ditemukan.</span></td></tr>
            ) : children}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function DocumentPagination({
  meta,
  onChange,
  limitOptions,
  onLimitChange,
}: {
  meta: PaginationMeta;
  onChange: (page: number) => void;
  limitOptions?: number[];
  onLimitChange?: (limit: number) => void;
}) {
  if (meta.total <= 0) return null;

  const startItem = Math.min((meta.page - 1) * meta.limit + 1, meta.total);
  const endItem = Math.min(meta.page * meta.limit, meta.total);

  const pages = Array.from({ length: meta.totalPages }, (_, i) => i + 1).filter(
    p => p === 1 || p === meta.totalPages || Math.abs(p - meta.page) <= 1
  );

  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
        <span className="font-medium">
          Menampilkan <span className="font-bold text-slate-700 dark:text-slate-200">{startItem}-{endItem}</span> dari{' '}
          <span className="font-bold text-slate-700 dark:text-slate-200">{meta.total}</span> data
        </span>
        {onLimitChange && limitOptions && (
          <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3 dark:border-slate-800">
            <span className="hidden text-[11px] sm:inline">Per halaman:</span>
            <select
              value={meta.limit}
              onChange={e => onLimitChange(Number(e.target.value))}
              className="h-7 rounded border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 outline-none transition focus:border-amber-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
            >
              {limitOptions.map(opt => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {meta.totalPages > 1 && (
        <div className="flex items-center gap-1">
          <IconAction
            label="Halaman sebelumnya"
            disabled={meta.page <= 1}
            onClick={() => onChange(meta.page - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </IconAction>

          {pages.map((p, idx, arr) => {
            const showEllipsis = idx > 0 && p - arr[idx - 1] > 1;
            return (
              <React.Fragment key={p}>
                {showEllipsis && <span className="px-1 text-xs text-slate-400">...</span>}
                <button
                  type="button"
                  onClick={() => onChange(p)}
                  className={cn(
                    'h-8 min-w-[32px] rounded-md px-2 text-xs font-bold transition',
                    p === meta.page
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
                  )}
                >
                  {p}
                </button>
              </React.Fragment>
            );
          })}

          <IconAction
            label="Halaman berikutnya"
            disabled={meta.page >= meta.totalPages}
            onClick={() => onChange(meta.page + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </IconAction>
        </div>
      )}
    </div>
  );
}



export function DownloadStatusBadge({ status }: { status: DownloadStatus | string }) {
  const label: Record<string, string> = {
    pending: 'Menunggu',
    approved: 'Disetujui',
    rejected: 'Ditolak',
    expired: 'Kedaluwarsa',
    used: 'Telah Diunduh',
  };
  const style: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40',
    approved: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40',
    rejected: 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/40',
    expired: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
    used: 'bg-sky-50 text-sky-700 dark:bg-sky-950/30 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/40',
  };
  return <span className={cn('inline-flex items-center rounded px-2 py-0.5 text-[10px] font-black uppercase tracking-wide', style[status] || style.expired)}>{label[status] || status}</span>;
}

export function DocumentModal({ open, title, description, onClose, children, footer, width = 'max-w-xl' }: { open: boolean; title: string; description?: string; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode; width?: string }) {
  React.useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [open]);

  return (
    <AnimatedModalPortal open={open} onClose={onClose} panelClassName={`w-full ${width}`}>
      <div role="dialog" aria-modal="true" aria-label={title} className="flex max-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div className="pr-4"><h2 className="text-sm font-black text-slate-900 dark:text-white">{title}</h2>{description && <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{description}</p>}</div>
          <IconAction label="Tutup modal" onClick={onClose}><X className="h-4 w-4" /></IconAction>
        </div>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5">{children}</div>
        {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 bg-slate-50/60 px-5 py-3.5 dark:border-slate-800 dark:bg-slate-950/30">{footer}</div>}
      </div>
    </AnimatedModalPortal>
  );
}

export function SecondaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={cn('inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800', props.className)} />;
}

export function DocumentAccessDenied({ title = 'Akses tidak tersedia' }: { title?: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-6 py-16 text-center dark:border-slate-800 dark:bg-slate-900">
      <p className="text-sm font-black text-slate-800 dark:text-slate-100">{title}</p>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Akun Anda tidak memiliki kewenangan untuk membuka bagian ini.</p>
    </div>
  );
}
