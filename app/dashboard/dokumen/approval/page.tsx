'use client';

import { useEffect, useRef, useState } from 'react';
import { Calendar, Check, Clock3, History, RefreshCw, Search, ShieldAlert, X } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { AppToast } from '@/components/ui/AppToast';
import { CustomDateRangePicker } from '@/components/ui/CustomDateRangePicker';
import { CustomCategorySelect } from '../_components/CustomCategorySelect';
import {
  DocumentAccessDenied,
  DocumentModal,
  DocumentPageHeader,
  DocumentPagination,
  DocumentPanel,
  DocumentTable,
  DownloadStatusBadge,
  IconAction,
  LoadingButton,
  SecondaryButton,
  inputClass,
  labelClass,
} from '../_components/DocumentUi';
import { useDocumentToast } from '../_components/useDocumentToast';
import { errorMessage, formatDocumentDate } from '../_lib/document-api';
import type { DocumentCapabilities, DocumentCategory, DownloadRequest, DownloadStatus, PaginationMeta } from '../_lib/types';

const emptyMeta: PaginationMeta = { page: 1, limit: 20, total: 0, totalPages: 0 };

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

export default function DocumentApprovalPage() {
  const notice = useDocumentToast();
  const [tab, setTab] = useState<'active' | 'history'>('active');
  const [capabilities, setCapabilities] = useState<DocumentCapabilities | null>(null);
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [rows, setRows] = useState<DownloadRequest[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(emptyMeta);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const [limit, setLimit] = useState(10);
  const [activeSearchInput, setActiveSearchInput] = useState('');
  const [activeSearch, setActiveSearch] = useState('');

  // Tab 1 state
  const [activeStatus, setActiveStatus] = useState<DownloadStatus>('pending');

  // Tab 2 Audit History state
  const [historyStatus, setHistoryStatus] = useState<string>('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [startInput, setStartInput] = useState('');
  const [endInput, setEndInput] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const startRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLInputElement>(null);

  // Action targets
  const [actionId, setActionId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<DownloadRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    api.get<DocumentCategory[]>('/documents/categories')
      .then(res => setCategories(res.data))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      setActiveSearch(activeSearchInput.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [activeSearchInput]);

  const loadData = async () => {
    setLoading(true);
    try {
      const capabilityResponse = await api.get<DocumentCapabilities>('/documents/capabilities');
      setCapabilities(capabilityResponse.data);

      if (tab === 'active') {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
          status: activeStatus,
        });
        if (activeSearch) params.set('search', activeSearch);
        const requestResponse = await api.get<DownloadRequest[]>(
          `/documents/download-requests/pending?${params.toString()}`
        );
        setRows(requestResponse.data);
        setMeta(requestResponse.meta || emptyMeta);
      } else {
        // Tab 2 History Audit
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (historyStatus) params.set('status', historyStatus);
        if (search) params.set('search', search);
        if (categoryId) params.set('categoryId', categoryId);
        if (startDate) params.set('startDate', startDate);
        if (endDate) params.set('endDate', endDate);

        // Fetch processed download requests history
        const requestResponse = await api.get<DownloadRequest[]>(
          `/documents/download-requests/pending?${params.toString()}`
        );
        setRows(requestResponse.data);
        setMeta(requestResponse.meta || emptyMeta);
      }
    } catch (error) {
      notice.error(errorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadData();
  }, [tab, page, limit, activeStatus, activeSearch, historyStatus, search, categoryId, startDate, endDate]);

  const decide = async (item: DownloadRequest, action: 'approve' | 'reject') => {
    if (action === 'reject' && !rejectionReason.trim()) return notice.error('Alasan penolakan wajib diisi.');
    setActionId(item.id);
    try {
      await api.post(`/documents/download-requests/${item.id}/${action}`, action === 'reject' ? { rejectionReason: rejectionReason.trim() } : {});
      notice.success(action === 'approve' ? 'Permintaan download disetujui.' : 'Permintaan download ditolak.');
      setRejectTarget(null);
      setRejectionReason('');
      window.dispatchEvent(new Event('document-approvals-changed'));
      await loadData();
    } catch (error) {
      notice.error(errorMessage(error));
    } finally {
      setActionId(null);
    }
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
    setStartInput('');
    setEndInput('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const formatYMD = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const applyPreset = (type: 'today' | '7days' | '30days' | 'month') => {
    const now = new Date();
    const todayYmd = formatYMD(now);
    let startYmd = todayYmd;

    if (type === '7days') {
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
      <DocumentPageHeader
        title="Persetujuan Akses"
        description="Monitoring & persetujuan izin unduh dokumen karyawan serta audit riwayat persetujuan."
        action={
          <SecondaryButton onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </SecondaryButton>
        }
      />

      {capabilities && !capabilities.canApproveDownload ? (
        <DocumentAccessDenied title="Halaman ini hanya dapat diakses administrator" />
      ) : (
        <div className="space-y-4">
          {/* Tab Selection */}
          <div className="flex border-b border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => { setTab('active'); setPage(1); }}
              className={cn(
                'flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition cursor-pointer',
                tab === 'active'
                  ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              )}
            >
              <Clock3 className="h-4 w-4" />
              <span>Permintaan Aktif</span>
              {capabilities?.pendingApprovalCount ? (
                <span className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-extrabold text-white animate-pulse">
                  {capabilities.pendingApprovalCount}
                </span>
              ) : null}
            </button>

            <button
              type="button"
              onClick={() => { setTab('history'); setPage(1); }}
              className={cn(
                'flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition cursor-pointer',
                tab === 'history'
                  ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              )}
            >
              <History className="h-4 w-4" />
              <span>Riwayat Persetujuan & Audit</span>
            </button>
          </div>

          <DocumentPanel>
            {/* Tab 1 Active Controls */}
            {tab === 'active' && (
              <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    className={`${inputClass} pl-9`}
                    value={activeSearchInput}
                    onChange={event => setActiveSearchInput(event.target.value)}
                    placeholder="Cari dokumen, pemohon, NRK..."
                  />
                </div>
                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <ShieldAlert className="h-4 w-4 text-amber-500" />
                    <span>{meta.total} permintaan</span>
                  </div>
                  <select
                    className={`${inputClass} sm:w-48`}
                    value={activeStatus}
                    onChange={event => { setPage(1); setActiveStatus(event.target.value as DownloadStatus); }}
                  >
                    <option value="pending">Menunggu Action</option>
                    <option value="approved">Aktif (Disetujui)</option>
                  </select>
                </div>
              </div>
            )}

            {/* Tab 2 Audit History Filters */}
            {tab === 'history' && (
              <div className="flex flex-col gap-3.5 border-b border-slate-200 p-4 dark:border-slate-800">
                {/* Row 1: Search, Category, Status */}
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      className={`${inputClass} pl-9`}
                      value={searchInput}
                      onChange={event => setSearchInput(event.target.value)}
                      placeholder="Cari dokumen, pemohon, alasan..."
                    />
                  </div>

                  <CustomCategorySelect
                    value={categoryId}
                    onChange={val => { setPage(1); setCategoryId(val); }}
                    categories={categories}
                    placeholder="Semua kategori"
                  />

                  <select
                    className={inputClass}
                    value={historyStatus}
                    onChange={event => { setPage(1); setHistoryStatus(event.target.value); }}
                  >
                    <option value="">Semua status audit</option>
                    <option value="approved">Disetujui</option>
                    <option value="rejected">Ditolak</option>
                    <option value="expired">Kedaluwarsa</option>
                  </select>
                </div>

                {/* Row 2: Date Inputs & Calendar */}
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

                {/* Row 3: Presets & Result Badge */}
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
                      Menampilkan seluruh riwayat audit persetujuan
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Table View */}
            <DocumentTable
              headers={['Dokumen', 'Pemohon', 'Unit Pemilik', 'Alasan', 'Status', 'Diajukan', 'Aksi / Detail']}
              loading={loading}
              empty={!rows.length}
            >
              {rows.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/35">
                  <td className="px-4 py-3.5">
                    <span className="font-bold text-slate-800 dark:text-slate-100">{item.documentTitle}</span>
                    <span className="mt-0.5 block text-[10px] font-black uppercase text-slate-400">{item.categoryName}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{item.requesterName}</span>
                    <span className="mt-0.5 block text-[10px] text-slate-400">{item.requesterNrk}</span>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-slate-500 dark:text-slate-400">{item.ownerUnitName || 'Semua unit'}</td>
                  <td className="max-w-[240px] px-4 py-3.5 text-xs text-slate-500 dark:text-slate-400">
                    <span className="line-clamp-2">{item.reason || 'Tidak ada alasan tambahan'}</span>
                  </td>
                  <td className="px-4 py-3.5"><DownloadStatusBadge status={item.status} /></td>
                  <td className="px-4 py-3.5 text-xs text-slate-500 dark:text-slate-400">{formatDocumentDate(item.createdAt)}</td>
                  <td className="px-4 py-3.5 text-left">
                    {item.status === 'pending' ? (
                      <div className="inline-flex gap-1">
                        <IconAction
                          label="Setujui"
                          disabled={!!actionId}
                          onClick={() => decide(item, 'approve')}
                          className="text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                        >
                          {actionId === item.id ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        </IconAction>
                        <IconAction
                          label="Tolak"
                          disabled={!!actionId}
                          onClick={() => { setRejectTarget(item); setRejectionReason(''); }}
                          className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-950/30"
                        >
                          <X className="h-4 w-4" />
                        </IconAction>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">
                        {item.status === 'approved' ? 'Disetujui' : item.status === 'rejected' ? 'Ditolak' : 'Kedaluwarsa'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </DocumentTable>
            <DocumentPagination
              meta={meta}
              onChange={setPage}
              limitOptions={[10, 25, 50]}
              onLimitChange={newLimit => {
                setLimit(newLimit);
                setPage(1);
              }}
            />
          </DocumentPanel>
        </div>
      )}

      {/* Reject Modal */}
      <DocumentModal
        open={!!rejectTarget}
        onClose={() => !actionId && setRejectTarget(null)}
        title="Tolak permintaan download"
        description={rejectTarget?.documentTitle}
        footer={
          <>
            <SecondaryButton onClick={() => setRejectTarget(null)} disabled={!!actionId}>
              Batal
            </SecondaryButton>
            <LoadingButton
              loading={actionId === rejectTarget?.id}
              onClick={() => rejectTarget && decide(rejectTarget, 'reject')}
              className="bg-rose-600 hover:bg-rose-700"
            >
              Tolak Permintaan
            </LoadingButton>
          </>
        }
      >
        <label>
          <span className={labelClass}>Alasan Penolakan *</span>
          <textarea
            className={`${inputClass} h-28 resize-none py-2.5`}
            value={rejectionReason}
            maxLength={2000}
            onChange={event => setRejectionReason(event.target.value)}
            placeholder="Jelaskan alasan permintaan tidak dapat disetujui"
          />
        </label>
      </DocumentModal>
    </div>
  );
}
