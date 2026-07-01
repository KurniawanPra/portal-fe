'use client';

import React from 'react';
import {
  ToggleLeft, ToggleRight, Search, Plus, Loader2, X, ChevronDown, CheckCircle2, AlertCircle, Pencil, Trash2
} from 'lucide-react';
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';
import { ModalPortal } from '@/components/ui/ModalPortal';
import { SearchSelect } from '@/components/ui/SearchSelect';
import { cn } from '@/lib/utils';

// ─── Shared Styles ────────────────────────────────────────────────────────────
export const inputCls = 'w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 px-3.5 py-2 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-slate-450 dark:focus:border-slate-700 transition-colors duration-150';
export const searchInputCls = 'w-full rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0a0f1a] pr-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10 transition-all';
export const labelCls = 'mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400';

// ─── Toast utility ────────────────────────────────────────────────────────────
export function Toast({ toast }: { toast: { type: 'ok' | 'err'; text: string } | null }) {
  if (!toast) return null;
  return (
    <div className={`fixed top-6 right-6 z-[99999] flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-semibold shadow-2xl backdrop-blur-xl animate-fade-up ${
      toast.type === 'ok'
        ? 'bg-[#0f1a10]/95 border-emerald-500/30 text-emerald-300'
        : 'bg-[#1a0f10]/95 border-rose-500/30    text-rose-300'
    }`}>
      {toast.type === 'ok' ? (
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
      ) : (
        <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
      )}
      {toast.text}
    </div>
  );
}

// ─── Search Input component ───────────────────────────────────────────────────
export function SearchInput({
  placeholder = 'Cari...',
  value,
  onChange,
  className = '',
}: {
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("relative w-full sm:w-72", className)}>
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`${searchInputCls} pl-10`}
      />
    </div>
  );
}

// ─── Table Actions component (Edit & Delete) ──────────────────────────────────
export function TableActions({
  onEdit,
  onDelete,
  editDisabled = false,
  deleteDisabled = false,
}: {
  onEdit?: () => void;
  onDelete?: () => void;
  editDisabled?: boolean;
  deleteDisabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-end gap-1.5">
      {onEdit && (
        <button
          type="button"
          disabled={editDisabled}
          onClick={onEdit}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-450 transition-all cursor-pointer focus:outline-none disabled:opacity-50"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      )}
      {onDelete && (
        <button
          type="button"
          disabled={deleteDisabled}
          onClick={onDelete}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-450 transition-all cursor-pointer focus:outline-none disabled:opacity-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

// ─── Table Card shell ─────────────────────────────────────────────────────────
export function TableCard({ children }: { accentColor?: string; children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      {children}
    </div>
  );
}

// ─── Toggle Button ────────────────────────────────────────────────────────────
export function ActiveToggle({ value, onChange, disabled }: { value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      disabled={disabled}
      type="button"
      onClick={() => onChange(!value)}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide transition-all duration-200 cursor-pointer focus:outline-none disabled:opacity-50 ${value ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-200/15 hover:bg-emerald-100/40' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-100'}`}
    >
      {value ? <ToggleRight className="h-3.5 w-3.5 text-emerald-500" /> : <ToggleLeft className="h-3.5 w-3.5" />}
      {value ? 'Aktif' : 'Nonaktif'}
    </button>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
export function DeleteModal({ open, name, onCancel, onConfirm, deleting }: { open: boolean; name: string; onCancel: () => void; onConfirm: () => void; deleting?: boolean }) {
  return (
    <DeleteConfirmModal
      isOpen={open}
      onClose={onCancel}
      onConfirm={onConfirm}
      name={name}
      deleting={deleting}
    />
  );
}

// ─── Crud Header Component ────────────────────────────────────────────────────
export function CrudHeader({
  searchPlaceholder,
  searchValue,
  onSearchChange,
  addButtonText,
  onAddClick,
}: {
  searchPlaceholder: string;
  searchValue: string;
  onSearchChange: (v: string) => void;
  addButtonText?: string;
  onAddClick?: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 px-5 py-4 border-b border-slate-100 dark:border-white/[0.06] sm:flex-row sm:items-center sm:justify-between flex-wrap">
      <div className="relative w-full sm:w-72">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={e => onSearchChange(e.target.value)}
          className={`${searchInputCls} pl-10`}
        />
      </div>
      {addButtonText && onAddClick && (
        <PrimaryButton onClick={onAddClick}>
          <Plus className="h-4 w-4" /> {addButtonText}
        </PrimaryButton>
      )}
    </div>
  );
}

// ─── Primary Button ───────────────────────────────────────────────────────────
/**
 * Amber/yellow primary action button — use for all "Tambah" / main CTA buttons
 * across admin pages (Organisasi, Employee, User, Aplikasi, Master Data).
 */
export function PrimaryButton({
  onClick,
  children,
  disabled,
  type = 'button',
  className = '',
}: {
  onClick?: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  type?: 'button' | 'submit';
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`cursor-pointer inline-flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 active:bg-amber-700 px-3.5 py-2 text-xs font-semibold text-white shadow-sm shadow-amber-500/25 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-amber-500/30 ${className}`}
    >
      {children}
    </button>
  );
}

export function FilterDropdown<T extends string>({
  value,
  onChange,
  options,
  searchable = false,
  className = '',
}: {
  value: T;
  onChange: (v: T) => void;
  options: { label: string; value: T }[];
  searchable?: boolean;
  className?: string;
}) {
  return (
    <SearchSelect
      searchable={searchable}
      options={options.map(opt => ({ value: opt.value, label: opt.label }))}
      value={value}
      onChange={val => onChange(val as T)}
      placeholder=""
      className={cn("w-40", className)}
    />
  );
}

// ─── Crud Table Component ─────────────────────────────────────────────────────
export function CrudTable<T>({
  headers,
  loading,
  loadingText = 'Memuat data...',
  emptyText = 'Tidak ada data.',
  data,
  renderRow,
  containerClassName = '',
}: {
  headers: string[];
  loading: boolean;
  loadingText?: string;
  emptyText?: string;
  data: T[];
  renderRow: (item: T, index: number) => React.ReactNode;
  containerClassName?: string;
}) {
  return (
    <div className={cn("overflow-x-auto", containerClassName)}>
      {loading ? (
        <div className="flex items-center justify-center py-20 gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          <span className="text-sm font-semibold text-slate-400">{loadingText}</span>
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-150 dark:border-white/[0.04] bg-slate-50/20 dark:bg-white/[0.01]">
              {headers.map((h, i) => (
                <th
                  key={h}
                  className={`px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 ${
                    i === headers.length - 1 ? 'text-right' : 'text-left'
                  }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/[0.03]">
            {data.length === 0 ? (
              <tr>
                <td colSpan={headers.length} className="px-5 py-10 text-center text-sm font-semibold text-slate-400 dark:text-slate-500">
                  {emptyText}
                </td>
              </tr>
            ) : (
              data.map((item, idx) => renderRow(item, idx))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ─── Crud Pagination Component ────────────────────────────────────────────────
export function CrudPagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: React.Dispatch<React.SetStateAction<number>>;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 dark:border-white/[0.04] bg-slate-50/20 dark:bg-white/[0.01]">
      <span className="text-[10px] font-bold text-slate-555 dark:text-slate-400">
        Halaman {currentPage} dari {totalPages}
      </span>
      <div className="flex items-center gap-1.5">
        <button
          disabled={currentPage === 1}
          type="button"
          onClick={() => onPageChange(p => Math.max(p - 1, 1))}
          className="px-2.5 py-1.5 rounded-lg border border-slate-200/80 dark:border-white/[0.06] bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-all text-[11px] font-bold text-slate-600 dark:text-slate-400 cursor-pointer focus:outline-none"
        >
          Sebelumnya
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter(page => {
            return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;
          })
          .map((page, idx, arr) => {
            const showEllipsis = idx > 0 && page - arr[idx - 1] > 1;
            return (
              <React.Fragment key={page}>
                {showEllipsis && <span className="px-1 text-slate-400 dark:text-slate-600 text-xs">...</span>}
                <button
                  type="button"
                  onClick={() => onPageChange(page)}
                  className={`rounded-lg px-2.5 py-1.5 text-[11px] font-black transition-all cursor-pointer focus:outline-none ${
                    currentPage === page
                      ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/20'
                      : 'border border-slate-200/80 dark:border-white/[0.06] bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {page}
                </button>
              </React.Fragment>
            );
          })}

        <button
          disabled={currentPage === totalPages}
          type="button"
          onClick={() => onPageChange(p => Math.min(p + 1, totalPages))}
          className="px-2.5 py-1.5 rounded-lg border border-slate-200/80 dark:border-white/[0.06] bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-all text-[11px] font-bold text-slate-600 dark:text-slate-400 cursor-pointer focus:outline-none"
        >
          Selanjutnya
        </button>
      </div>
    </div>
  );
}

export { CrudPagination as Pagination };

// ─── Form Modal Component ─────────────────────────────────────────────────────
export function FormModal({
  open,
  title,
  onClose,
  onSave,
  saving,
  icon: Icon,
  isEdit = false,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  onSave: () => void | Promise<void>;
  saving: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  isEdit?: boolean;
  children: React.ReactNode;
}) {
  return (
    <ModalPortal open={open}>
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm z-[60]" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none z-[70]">
        <div className="pointer-events-auto w-full max-w-sm animate-fade-up">
          <div className="relative overflow-hidden rounded-xl border border-slate-205 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl">
            
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-150 dark:border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                {/* {Icon && (
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                    <Icon className="h-4 w-4 text-slate-700 dark:text-slate-300" />
                  </div>
                )} */}
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  {title}
                </h2>
              </div>
              <button onClick={onClose} type="button" className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer focus:outline-none">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-5 space-y-4">
              {children}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2.5 border-t border-slate-150 dark:border-white/[0.06] px-5 py-3.5 bg-slate-50/50 dark:bg-slate-950/30">
              <button
                disabled={saving}
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-200 dark:border-slate-800 px-4 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer focus:outline-none"
              >
                Batal
              </button>
              <button
                disabled={saving}
                type="button"
                onClick={onSave}
                className={cn(
                  "cursor-pointer inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold disabled:opacity-50 transition-colors text-white focus:outline-none focus:ring-2",
                  isEdit
                    ? "bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-sm shadow-indigo-500/25 focus:ring-indigo-500/30"
                    : "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-sm shadow-emerald-500/25 focus:ring-emerald-500/30"
                )}
              >
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Simpan
              </button>
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}

// ─── Secondary Button ──────────────────────────────────────────────────────────
export function SecondaryButton({
  onClick,
  children,
  disabled,
  type = 'button',
  className = '',
}: {
  onClick?: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  type?: 'button' | 'submit';
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`cursor-pointer rounded-xl border border-slate-250 dark:border-white/[0.08] px-4 py-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04] hover:text-slate-700 dark:hover:text-slate-200 transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}

// ─── Danger Button ─────────────────────────────────────────────────────────────
export function DangerButton({
  onClick,
  children,
  disabled,
  type = 'button',
  className = '',
}: {
  onClick?: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  type?: 'button' | 'submit';
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`cursor-pointer rounded-xl bg-rose-500/90 hover:bg-rose-500 px-4 py-2.5 text-sm font-bold text-white transition-all shadow-lg shadow-rose-500/20 flex items-center justify-center gap-1.5 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}
