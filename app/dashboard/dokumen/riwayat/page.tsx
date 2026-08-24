'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Clock3,
  ExternalLink,
  Eye,
  FileCheck,
  History,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { api } from '@/lib/api';
import { AppToast } from '@/components/ui/AppToast';
import { CustomCategorySelect } from '../_components/CustomCategorySelect';
import {
  DocumentPageHeader,
  DocumentPagination,
  DocumentPanel,
  DocumentTable,
  DownloadStatusBadge,
  SecondaryButton,
  inputClass,
} from '../_components/DocumentUi';
import { useDocumentToast } from '../_components/useDocumentToast';
import { errorMessage, formatDocumentDate } from '../_lib/document-api';
import type { DocumentCategory, DownloadRequest, PaginationMeta } from '../_lib/types';

const emptyMeta: PaginationMeta = { page: 1, limit: 10, total: 0, totalPages: 0 };

function DocumentHistoryContent() {
  const notice = useDocumentToast();
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [rows, setRows] = useState<DownloadRequest[]>([]);
  const [meta, setMeta] = useState(emptyMeta);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [categoryId, setCategoryId] = useState('');
  const [loading, setLoading] = useState(true);

  // Quick summary counts
  const [summaryCounts, setSummaryCounts] = useState({
    total: 0,
    used: 0,
    rejected: 0,
    expired: 0,
  });

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

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        scope: 'history',
      });
      if (statusFilter) params.set('status', statusFilter);
      if (search) params.set('search', search);
      if (categoryId) params.set('categoryId', categoryId);

      const response = await api.get<DownloadRequest[]>(`/documents/download-requests/mine?${params}`);
      setRows(response.data);
      setMeta(response.meta || emptyMeta);

      // Load overall history stats for badges
      api.get<DownloadRequest[]>('/documents/download-requests/mine?scope=history&limit=500')
        .then(allRes => {
          const all = allRes.data || [];
          setSummaryCounts({
            total: all.length,
            used: all.filter(r => r.status === 'used' || r.downloadedAt).length,
            rejected: all.filter(r => r.status === 'rejected').length,
            expired: all.filter(r => r.status === 'expired').length,
          });
        })
        .catch(() => undefined);
    } catch (error) {
      notice.error(errorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [page, limit, search, statusFilter, categoryId]);

  return (
    <div className="pb-8">
      <AppToast toast={notice.toast} />

      <DocumentPageHeader
        title="Riwayat Persetujuan"
        description="Arsip riwayat permohonan izin unduh dokumen Anda yang telah selesai diproses (telah diunduh, ditolak, atau kedaluwarsa)."
        action={
          <SecondaryButton onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </SecondaryButton>
        }
      />

      {/* Summary KPI Cards */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <button
          type="button"
          onClick={() => { setStatusFilter(''); setPage(1); }}
          className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
            statusFilter === ''
              ? 'border-amber-400 bg-amber-50/70 shadow-xs dark:border-amber-500/50 dark:bg-amber-950/40'
              : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/60'
          }`}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
            <History className="h-4.5 w-4.5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Riwayat</span>
            <p className="text-base font-black text-slate-900 dark:text-white">{summaryCounts.total}</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => { setStatusFilter('used'); setPage(1); }}
          className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
            statusFilter === 'used'
              ? 'border-sky-400 bg-sky-50/70 shadow-xs dark:border-sky-500/50 dark:bg-sky-950/40'
              : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/60'
          }`}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300">
            <CheckCircle2 className="h-4.5 w-4.5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Telah Diunduh</span>
            <p className="text-base font-black text-sky-700 dark:text-sky-300">{summaryCounts.used}</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => { setStatusFilter('rejected'); setPage(1); }}
          className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
            statusFilter === 'rejected'
              ? 'border-rose-400 bg-rose-50/70 shadow-xs dark:border-rose-500/50 dark:bg-rose-950/40'
              : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/60'
          }`}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
            <XCircle className="h-4.5 w-4.5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Ditolak</span>
            <p className="text-base font-black text-rose-700 dark:text-rose-300">{summaryCounts.rejected}</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => { setStatusFilter('expired'); setPage(1); }}
          className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
            statusFilter === 'expired'
              ? 'border-slate-400 bg-slate-100 shadow-xs dark:border-slate-600 dark:bg-slate-800'
              : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/60'
          }`}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <Clock className="h-4.5 w-4.5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Kedaluwarsa</span>
            <p className="text-base font-black text-slate-700 dark:text-slate-300">{summaryCounts.expired}</p>
          </div>
        </button>
      </div>

      <DocumentPanel>
        {/* Search & Filter Toolbar */}
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Cari dokumen, alasan, approver, atau catatan..."
              className={`${inputClass} pl-9`}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:w-auto">
            <select
              className={`${inputClass} sm:w-44`}
              value={statusFilter}
              onChange={e => {
                setPage(1);
                setStatusFilter(e.target.value);
              }}
            >
              <option value="">Semua Status</option>
              <option value="used">Telah Diunduh</option>
              <option value="rejected">Ditolak</option>
              <option value="expired">Kedaluwarsa</option>
            </select>

            <div className="w-full sm:w-56">
              <CustomCategorySelect
                categories={categories}
                value={categoryId}
                onChange={val => {
                  setCategoryId(val);
                  setPage(1);
                }}
              />
            </div>
          </div>
        </div>

        <DocumentTable
          headers={['Dokumen', 'Keperluan Pengajuan', 'Pemeriksa / Approver', 'Status & Keterangan', 'Waktu', 'Aksi']}
          loading={loading}
          empty={!rows.length}
        >
          {rows.map(item => {
            const isUsed = item.status === 'used' || Boolean(item.downloadedAt);
            const isRejected = item.status === 'rejected';
            const isExpired = item.status === 'expired';

            return (
              <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/35">
                {/* Dokumen */}
                <td className="px-4 py-3.5">
                  <Link
                    href={`/dashboard/dokumen/${item.documentId}`}
                    className="font-bold text-slate-800 hover:text-amber-600 dark:text-slate-100 dark:hover:text-amber-400"
                  >
                    {item.documentTitle}
                  </Link>
                  <span className="mt-0.5 block text-[10px] font-semibold text-slate-400">
                    {item.categoryName} {item.ownerUnitName ? `· ${item.ownerUnitName}` : ''}
                  </span>
                </td>

                {/* Keperluan / Alasan */}
                <td className="max-w-[220px] px-4 py-3.5 text-xs text-slate-600 dark:text-slate-300">
                  <span className="line-clamp-2">{item.reason || 'Kebutuhan Pekerjaan'}</span>
                </td>

                {/* Pemeriksa / Approver */}
                <td className="px-4 py-3.5 text-xs">
                  <div className="font-semibold text-slate-700 dark:text-slate-200">
                    {item.approverName || 'Administrator Portal'}
                  </div>
                  {item.updatedAt && (
                    <span className="text-[10px] text-slate-400">
                      Diproses: {formatDocumentDate(item.updatedAt)}
                    </span>
                  )}
                </td>

                {/* Status & Keterangan */}
                <td className="px-4 py-3.5">
                  <DownloadStatusBadge status={item.status} />
                  {isUsed && item.downloadedAt && (
                    <span className="mt-1 block text-[10px] text-sky-600 dark:text-sky-400">
                      Diunduh: {formatDocumentDate(item.downloadedAt)}
                    </span>
                  )}
                  {isRejected && item.rejectionReason && (
                    <span className="mt-1 block max-w-[200px] text-[10px] italic text-rose-500 dark:text-rose-400 line-clamp-2">
                      Alasan: {item.rejectionReason}
                    </span>
                  )}
                  {isExpired && (
                    <span className="mt-1 block text-[10px] text-slate-400">
                      Izin telah kedaluwarsa
                    </span>
                  )}
                </td>

                {/* Waktu Pengajuan */}
                <td className="px-4 py-3.5 text-xs text-slate-500 dark:text-slate-400">
                  {formatDocumentDate(item.createdAt)}
                </td>

                {/* Aksi */}
                <td className="px-4 py-3.5 text-left">
                  <Link
                    href={`/dashboard/dokumen/${item.documentId}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Lihat Dokumen</span>
                  </Link>
                </td>
              </tr>
            );
          })}
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
  );
}

export default function DocumentHistoryPage() {
  return (
    <Suspense fallback={<div className="min-h-48 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-900" />}>
      <DocumentHistoryContent />
    </Suspense>
  );
}
