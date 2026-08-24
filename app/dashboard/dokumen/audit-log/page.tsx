'use client';

import { useEffect, useRef, useState } from 'react';
import { Calendar, CalendarDays, Check, ChevronDown, Code, Globe, Laptop, RefreshCw, Search, X } from 'lucide-react';
import { api } from '@/lib/api';
import { AppToast } from '@/components/ui/AppToast';
import { CustomDateRangePicker } from '@/components/ui/CustomDateRangePicker';
import { cn } from '@/lib/utils';
import {
  DocumentAccessDenied,
  DocumentModal,
  DocumentPageHeader,
  DocumentPagination,
  DocumentPanel,
  DocumentTable,
  SecondaryButton,
  inputClass,
} from '../_components/DocumentUi';
import { useDocumentToast } from '../_components/useDocumentToast';
import { errorMessage, formatDocumentDate } from '../_lib/document-api';
import type { DocumentAudit, DocumentCapabilities, PaginationMeta } from '../_lib/types';

const emptyMeta: PaginationMeta = { page: 1, limit: 25, total: 0, totalPages: 0 };
const actions = ['view', 'download_request', 'download_approved', 'download_rejected', 'downloaded', 'uploaded', 'edited', 'revised', 'deleted'];
const actionLabels: Record<string, string> = {
  view: 'Melihat Detail Dokumen',
  download_request: 'Mengajukan Izin Unduh',
  download_approved: 'Menyetujui Izin Unduh',
  download_rejected: 'Menolak Izin Unduh',
  downloaded: 'Mengunduh File Dokumen',
  uploaded: 'Mengunggah Dokumen Baru',
  edited: 'Mengubah Informasi Dokumen',
  revised: 'Mengunggah Revisi Dokumen',
  deleted: 'Menonaktifkan Dokumen',
};

function CustomActionSelect({
  value,
  onChange,
  actionsList,
  labelsMap,
}: {
  value: string;
  onChange: (val: string) => void;
  actionsList: string[];
  labelsMap: Record<string, string>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedLabel = value ? labelsMap[value] || value : 'Semua aksi';

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          inputClass,
          "flex items-center justify-between gap-2 text-left cursor-pointer transition-all duration-200 select-none",
          isOpen && "border-amber-500 ring-2 ring-amber-500/15"
        )}
      >
        <span className="truncate font-medium text-slate-800 dark:text-slate-100">
          {selectedLabel}
        </span>
        <ChevronDown className={cn("h-4 w-4 text-slate-400 shrink-0 transition-transform duration-200", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl border border-slate-200/90 bg-white p-1.5 shadow-xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in zoom-in-95 duration-150 max-h-60 overflow-y-auto">
          <button
            type="button"
            onClick={() => { onChange(''); setIsOpen(false); }}
            className={cn(
              "w-full rounded-lg px-3 py-2 text-left text-xs font-semibold transition-colors flex items-center justify-between cursor-pointer",
              value === ''
                ? "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 font-bold"
                : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            )}
          >
            <span>Semua aksi</span>
            {value === '' && <Check className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />}
          </button>

          {actionsList.map((act) => {
            const isSelected = value === act;
            return (
              <button
                key={act}
                type="button"
                onClick={() => { onChange(act); setIsOpen(false); }}
                className={cn(
                  "w-full rounded-lg px-3 py-2 text-left text-xs font-semibold transition-colors flex items-center justify-between cursor-pointer mt-0.5",
                  isSelected
                    ? "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 font-bold"
                    : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                )}
              >
                <span>{labelsMap[act] || act}</span>
                {isSelected && <Check className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ActionBadge({ action }: { action: string }) {
  const label = actionLabels[action] || action;

  const styleMap: Record<string, string> = {
    view: 'bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/50',
    download_request: 'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50',
    download_approved: 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50',
    download_rejected: 'bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/50',
    downloaded: 'bg-teal-50 text-teal-700 border-teal-200/80 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800/50',
    uploaded: 'bg-indigo-50 text-indigo-700 border-indigo-200/80 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/50',
    edited: 'bg-purple-50 text-purple-700 border-purple-200/80 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/50',
    deleted: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  };

  const style = styleMap[action] || 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300';

  return (
    <span className={cn('inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-bold shadow-2xs whitespace-nowrap', style)}>
      {label}
    </span>
  );
}

function parseUserAgent(ua?: string): { browser: string; os: string } {
  if (!ua) return { browser: '', os: '' };
  let browser = '';
  let os = '';

  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Macintosh') || ua.includes('Mac OS')) os = 'macOS';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  else if (ua.includes('Linux')) os = 'Linux';

  if (ua.includes('Edg/')) browser = 'Edge';
  else if (ua.includes('Chrome/')) browser = 'Chrome';
  else if (ua.includes('Firefox/')) browser = 'Firefox';
  else if (ua.includes('Safari/')) browser = 'Safari';

  return { browser, os };
}

function ReadableMetadata({
  metadata,
  onInspectJson,
}: {
  metadata?: Record<string, any> | null;
  onInspectJson: (data: Record<string, any>) => void;
}) {
  if (!metadata || Object.keys(metadata).length === 0) {
    return <span className="text-xs text-slate-400 italic">Tanpa rincian tambahan</span>;
  }

  const { ip, userAgent, reason, rejectionReason, validityDays, version } = metadata;
  const { browser, os } = parseUserAgent(userAgent);

  return (
    <div className="space-y-1 text-xs">
      {/* 1. Alasan / Catatan Penolakan / Masa Berlaku / Versi */}
      {reason && (
        <div className="text-slate-700 dark:text-slate-200 font-medium">
          <span className="font-bold text-slate-500 dark:text-slate-400">Alasan: </span>
          <span className="italic">&ldquo;{reason}&rdquo;</span>
        </div>
      )}
      {rejectionReason && (
        <div className="text-rose-600 dark:text-rose-400 font-medium">
          <span className="font-bold text-rose-500">Catatan Penolakan: </span>
          <span>&ldquo;{rejectionReason}&rdquo;</span>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-1.5">
        {validityDays !== undefined && (
          <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50">
            Akses: {validityDays} Hari
          </span>
        )}
        {version !== undefined && (
          <span className="inline-flex items-center gap-1 rounded bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700 border border-purple-200/80 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/50">
            Revisi Versi: v{version}
          </span>
        )}
      </div>

      {/* 2. Device & IP Info */}
      {(ip || browser || os) && (
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
          {ip && (
            <span className="inline-flex items-center gap-1 font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">
              <Globe className="h-3 w-3 text-slate-400 shrink-0" /> {ip}
            </span>
          )}
          {(browser || os) && (
            <span className="inline-flex items-center gap-1 font-medium text-[11px]">
              <Laptop className="h-3 w-3 text-slate-400 shrink-0" /> {browser} {os ? `(${os})` : ''}
            </span>
          )}
        </div>
      )}

      {/* 3. Tombol buka JSON Mentah jika admin membutuhkan audit teknis */}
      <div className="pt-0.5">
        <button
          type="button"
          onClick={() => onInspectJson(metadata)}
          className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 hover:underline cursor-pointer"
        >
          <Code className="h-3 w-3" />
          <span>Lihat Data JSON Mentah</span>
        </button>
      </div>
    </div>
  );
}

function formatSingleDateMask(input: string, prevValue: string = ''): string {
  const isDeleting = input.length < prevValue.length;
  const digits = input.replace(/\D/g, '').slice(0, 8);

  if (!digits) return '';

  if (isDeleting && prevValue.endsWith('/') && input.length === prevValue.length - 1) {
    if (digits.length === 2) return digits;
    if (digits.length === 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }

  if (digits.length < 2) return digits;
  if (digits.length === 2) return isDeleting ? digits : `${digits}/`;

  if (digits.length < 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  if (digits.length === 4) return isDeleting ? `${digits.slice(0, 2)}/${digits.slice(2)}` : `${digits.slice(0, 2)}/${digits.slice(2)}/`;

  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
}

function dmyToYmd(dmy: string): string {
  const parts = dmy.split('/');
  if (parts.length === 3 && parts[2].length === 4) {
    const [d, m, y] = parts.map(Number);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31 && y >= 1900 && y <= 2100) {
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
  }
  return '';
}

function ymdToDmy(ymd: string): string {
  if (!ymd) return '';
  const parts = ymd.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }
  return '';
}

function formatDateIndonesian(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return dateStr;
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function DocumentAuditLogPage() {
  const [capabilities, setCapabilities] = useState<DocumentCapabilities | null>(null);
  const [rows, setRows] = useState<DocumentAudit[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(emptyMeta);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [action, setAction] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  const [rawJsonInspect, setRawJsonInspect] = useState<Record<string, any> | null>(null);

  const notice = useDocumentToast();

  const [startInput, setStartInput] = useState('');
  const [endInput, setEndInput] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const startRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => { setPage(1); setSearch(searchInput.trim()); }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const load = async () => {
    setLoading(true);
    try {
      const capabilityResponse = await api.get<DocumentCapabilities>('/documents/capabilities');
      setCapabilities(capabilityResponse.data);
      if (!capabilityResponse.data.canViewAudit) return;
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search) params.set('search', search);
      if (action) params.set('action', action);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      const response = await api.get<DocumentAudit[]>(`/documents/audit-log?${params}`);
      setRows(response.data);
      setMeta(response.meta || emptyMeta);
    } catch (error) {
      notice.error(errorMessage(error));
    } finally {
      setLoading(false);
    }
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [page, limit, search, action, startDate, endDate]);

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };

  const handleStartInputChange = (val: string) => {
    const formatted = formatSingleDateMask(val, startInput);
    setStartInput(formatted);
    const ymd = dmyToYmd(formatted);
    setStartDate(ymd);
    setPage(1);
    if (formatted.length === 10) {
      endRef.current?.focus();
    }
  };

  const handleEndInputChange = (val: string) => {
    const formatted = formatSingleDateMask(val, endInput);
    setEndInput(formatted);
    const ymd = dmyToYmd(formatted);
    setEndDate(ymd);
    setPage(1);
  };

  const handleClearDates = () => {
    setStartDate('');
    setEndDate('');
    setStartInput('');
    setEndInput('');
    setPage(1);
  };

  const applyPreset = (type: 'today' | '7days' | '30days' | 'month') => {
    const now = new Date();
    const formatYMD = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const todayYmd = formatYMD(now);
    let startYmd = todayYmd;

    if (type === 'today') {
      startYmd = todayYmd;
    } else if (type === '7days') {
      const s = new Date(now);
      s.setDate(now.getDate() - 6);
      startYmd = formatYMD(s);
    } else if (type === '30days') {
      const s = new Date(now);
      s.setDate(now.getDate() - 29);
      startYmd = formatYMD(s);
    } else if (type === 'month') {
      const s = new Date(now.getFullYear(), now.getMonth(), 1);
      startYmd = formatYMD(s);
    }

    setStartDate(startYmd);
    setEndDate(todayYmd);
    setStartInput(ymdToDmy(startYmd));
    setEndInput(ymdToDmy(todayYmd));
    setPage(1);
  };

  return (
    <div className="pb-8">
      <AppToast toast={notice.toast} />
      <DocumentPageHeader title="Audit Log Dokumen" description="Jejak aktivitas dokumen internal yang tidak dapat diubah dari antarmuka." action={<SecondaryButton onClick={load} disabled={loading}><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh</SecondaryButton>} />
      {capabilities && !capabilities.canViewAudit ? <DocumentAccessDenied /> : (
        <DocumentPanel>
          <div className="flex flex-col gap-3.5 border-b border-slate-200 p-4 dark:border-slate-800">
            {/* Baris 1: Pencarian & Filter Aksi */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  className={`${inputClass} pl-9`}
                  value={searchInput}
                  onChange={event => setSearchInput(event.target.value)}
                  placeholder="Cari dokumen, karyawan..."
                />
              </div>
              <CustomActionSelect
                value={action}
                onChange={val => { setPage(1); setAction(val); }}
                actionsList={actions}
                labelsMap={actionLabels}
              />
            </div>

            {/* Baris 2: Input Tanggal Template (Dari s/d Sampai) & Kalender */}
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative flex items-center flex-1">
                  <span className="pointer-events-none absolute left-3 text-[10px] font-black uppercase text-amber-600 dark:text-amber-400">
                    Dari:
                  </span>
                  <input
                    ref={startRef}
                    type="text"
                    maxLength={10}
                    value={startInput}
                    onChange={e => handleStartInputChange(e.target.value)}
                    placeholder="00/00/0000"
                    className={`${inputClass} pl-12 font-mono font-bold text-xs tracking-wider`}
                  />
                </div>

                <span className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center px-1">
                  s/d
                </span>

                <div className="relative flex items-center flex-1">
                  <span className="pointer-events-none absolute left-3 text-[10px] font-black uppercase text-amber-600 dark:text-amber-400">
                    Sampai:
                  </span>
                  <input
                    ref={endRef}
                    type="text"
                    maxLength={10}
                    value={endInput}
                    onChange={e => handleEndInputChange(e.target.value)}
                    placeholder="00/00/0000"
                    className={`${inputClass} pl-[58px] font-mono font-bold text-xs tracking-wider`}
                  />
                </div>

                {(startInput || endInput || startDate || endDate) && (
                  <button
                    type="button"
                    onClick={handleClearDates}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-400 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition cursor-pointer"
                    title="Reset Filter Tanggal"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="shrink-0">
                <CustomDateRangePicker
                  startDate={startDate}
                  endDate={endDate}
                  placeholder="Kalender"
                  onChange={(start, end) => {
                    setStartDate(start);
                    setEndDate(end);
                    setStartInput(ymdToDmy(start));
                    setEndInput(ymdToDmy(end));
                    setPage(1);
                  }}
                />
              </div>
            </div>

            {/* Baris 3: Presets & Indikator Hasil Read-Only */}
            <div className="flex flex-col gap-2.5 pt-1 sm:flex-row sm:items-center sm:justify-between border-t border-slate-100 dark:border-slate-800/60">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => applyPreset('today')}
                  className="rounded-md border border-slate-200 bg-slate-100/80 px-2.5 py-1 text-xs font-bold text-slate-700 hover:border-amber-400 hover:bg-amber-50 hover:text-amber-800 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:border-amber-500/50 dark:hover:bg-amber-950/50 dark:hover:text-amber-300 transition cursor-pointer"
                >
                  Hari ini
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('7days')}
                  className="rounded-md border border-slate-200 bg-slate-100/80 px-2.5 py-1 text-xs font-bold text-slate-700 hover:border-amber-400 hover:bg-amber-50 hover:text-amber-800 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:border-amber-500/50 dark:hover:bg-amber-950/50 dark:hover:text-amber-300 transition cursor-pointer"
                >
                  7 Hari
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('30days')}
                  className="rounded-md border border-slate-200 bg-slate-100/80 px-2.5 py-1 text-xs font-bold text-slate-700 hover:border-amber-400 hover:bg-amber-50 hover:text-amber-800 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:border-amber-500/50 dark:hover:bg-amber-950/50 dark:hover:text-amber-300 transition cursor-pointer"
                >
                  30 Hari
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('month')}
                  className="rounded-md border border-slate-200 bg-slate-100/80 px-2.5 py-1 text-xs font-bold text-slate-700 hover:border-amber-400 hover:bg-amber-50 hover:text-amber-800 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:border-amber-500/50 dark:hover:bg-amber-950/50 dark:hover:text-amber-300 transition cursor-pointer"
                >
                  Bulan Ini
                </button>
              </div>

              {(startDate || endDate) ? (
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-800 dark:text-amber-300 border border-amber-500/20 shadow-2xs">
                    <span>Hasil Filter:</span>
                    <span className="font-extrabold">
                      {startDate === endDate ? formatDateIndonesian(startDate) : `${formatDateIndonesian(startDate)} s/d ${formatDateIndonesian(endDate)}`}
                    </span>
                  </span>
                </div>
              ) : (
                <div className="text-[11px] font-semibold text-slate-400 italic">
                  Menampilkan seluruh riwayat log
                </div>
              )}
            </div>
          </div>

          <DocumentTable
            headers={['Waktu WIB', 'Aksi', 'Dokumen Terkait', 'Pelaksana (Karyawan)', 'NRK', 'Detail & Perangkat (Metadata)']}
            loading={loading}
            empty={!rows.length}
            alignLastHeader="start"
          >
            {rows.map(item => (
              <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/35">
                <td className="whitespace-nowrap px-4 py-3.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {formatDocumentDate(item.createdAt)}
                </td>
                <td className="px-4 py-3.5">
                  <ActionBadge action={item.action} />
                </td>
                <td className="px-4 py-3.5 text-xs font-bold text-slate-800 dark:text-slate-100">
                  {item.documentTitle}
                </td>
                <td className="px-4 py-3.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                  {item.employeeName}
                </td>
                <td className="px-4 py-3.5 text-xs font-mono font-medium text-slate-500 dark:text-slate-400">
                  {item.employeeNrk}
                </td>
                <td className="max-w-[320px] px-4 py-3.5">
                  <ReadableMetadata metadata={item.metadata} onInspectJson={setRawJsonInspect} />
                </td>
              </tr>
            ))}
          </DocumentTable>
          <DocumentPagination
            meta={meta}
            onChange={setPage}
            limitOptions={[10, 25, 50, 100]}
            onLimitChange={handleLimitChange}
          />
        </DocumentPanel>
      )}

      {/* Raw JSON Inspect Modal */}
      <DocumentModal
        open={!!rawJsonInspect}
        onClose={() => setRawJsonInspect(null)}
        title="Metadata JSON Audit Log"
        description="Struktur data mentah (raw JSON) dari aktivitas audit ini."
        footer={
          <SecondaryButton onClick={() => setRawJsonInspect(null)}>
            Tutup
          </SecondaryButton>
        }
      >
        <pre className="max-h-80 overflow-y-auto rounded-lg border border-slate-200 bg-slate-900 p-4 text-xs font-mono text-amber-300 dark:border-slate-800">
          {JSON.stringify(rawJsonInspect, null, 2)}
        </pre>
      </DocumentModal>
    </div>
  );
}
