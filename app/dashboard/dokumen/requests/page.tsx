'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Clock3, ExternalLink, RefreshCw, Search } from 'lucide-react';
import { api } from '@/lib/api';
import { AppToast } from '@/components/ui/AppToast';
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
import type { DownloadRequest, DownloadStatus, PaginationMeta } from '../_lib/types';

const emptyMeta: PaginationMeta = { page: 1, limit: 10, total: 0, totalPages: 0 };

export default function DocumentRequestsPage() {
  const notice = useDocumentToast();
  const [rows, setRows] = useState<DownloadRequest[]>([]);
  const [meta, setMeta] = useState(emptyMeta);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [loading, setLoading] = useState(true);

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
        scope: 'pending',
      });
      if (search) params.set('search', search);

      const response = await api.get<DownloadRequest[]>(`/documents/download-requests/mine?${params}`);
      setRows(response.data);
      setMeta(response.meta || emptyMeta);
    } catch (error) {
      notice.error(errorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [page, limit, search]);

  const pendingCount = meta.total;

  return (
    <div className="pb-8">
      <AppToast toast={notice.toast} />
      <DocumentPageHeader
        title="Menunggu Persetujuan"
        description="Daftar pengajuan izin unduh dokumen yang saat ini sedang dalam proses peninjauan oleh atasan atau administrator."
        action={
          <SecondaryButton onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </SecondaryButton>
        }
      />

      {/* Lifecycle Helper Banner */}
      <div className="mb-4 flex items-start gap-3 rounded-lg border border-amber-200/80 bg-amber-50/70 p-3 text-xs text-amber-900 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-300">
        <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="leading-relaxed">
          <p className="font-semibold">Alur Persetujuan Unduh:</p>
          <p className="mt-0.5 text-amber-800 dark:text-amber-400/90">
            Setelah pengajuan <strong className="font-bold">disetujui</strong>, berkas akan masuk ke tab <strong className="font-bold">Dokumen Disetujui</strong> dan siap diunduh 1x. Jika pengajuan <strong className="font-bold">ditolak</strong> atau <strong className="font-bold">telah diunduh</strong>, berkas akan otomatis tercatat pada tab <strong className="font-bold">Riwayat Persetujuan</strong>.
          </p>
        </div>
      </div>

      <DocumentPanel>
        {/* Search & Status Toolbar */}
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Cari judul dokumen atau alasan pengajuan..."
              className={`${inputClass} pl-9`}
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <Clock3 className="h-3.5 w-3.5 text-amber-500" />
              <span>{pendingCount} dokumen menunggu persetujuan</span>
            </div>
          </div>
        </div>

        <DocumentTable
          headers={['Dokumen', 'Alasan Pengajuan', 'Approver', 'Status', 'Tanggal Pengajuan', 'Aksi']}
          loading={loading}
          empty={!rows.length}
        >
          {rows.map(item => (
            <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/35">
              <td className="px-4 py-3.5">
                <Link
                  href={`/dashboard/dokumen/${item.documentId}`}
                  className="font-bold text-slate-800 hover:text-amber-600 dark:text-slate-100 dark:hover:text-amber-400"
                >
                  {item.documentTitle}
                </Link>
                <span className="mt-0.5 block text-[10px] font-black uppercase text-slate-400">
                  {item.categoryName}
                </span>
              </td>
              <td className="max-w-[240px] px-4 py-3.5 text-xs text-slate-600 dark:text-slate-300">
                <span className="line-clamp-2">{item.reason || 'Tidak ada alasan tambahan'}</span>
              </td>
              <td className="px-4 py-3.5 text-xs text-slate-500 dark:text-slate-400">
                {item.approverName || '-'}
              </td>
              <td className="px-4 py-3.5">
                <DownloadStatusBadge status={item.status as DownloadStatus} />
                {item.status === 'rejected' && item.rejectionReason && (
                  <span className="mt-1 block max-w-[180px] text-[10px] italic text-rose-500 dark:text-rose-400 line-clamp-1">
                    {item.rejectionReason}
                  </span>
                )}
              </td>
              <td className="px-4 py-3.5 text-xs text-slate-500 dark:text-slate-400">
                {formatDocumentDate(item.createdAt)}
              </td>
              <td className="px-4 py-3.5 text-left">
                <Link
                  href={`/dashboard/dokumen/${item.documentId}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
                >
                  <span>Lihat</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
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
  );
}
