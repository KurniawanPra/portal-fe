'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Clock, Download, ExternalLink, RefreshCw, Search, ShieldCheck, User } from 'lucide-react';
import { api } from '@/lib/api';
import { AppToast } from '@/components/ui/AppToast';
import { CustomCategorySelect } from '../_components/CustomCategorySelect';
import {
  DocumentPageHeader,
  DocumentPagination,
  DocumentPanel,
  DocumentTable,
  DownloadStatusBadge,
  LoadingButton,
  SecondaryButton,
  inputClass,
} from '../_components/DocumentUi';
import { useDocumentToast } from '../_components/useDocumentToast';
import { downloadDocumentToken, errorMessage, formatDocumentDate } from '../_lib/document-api';
import type { DocumentCategory, DownloadRequest, PaginationMeta } from '../_lib/types';

const emptyMeta: PaginationMeta = { page: 1, limit: 10, total: 0, totalPages: 0 };

function ApprovedDocumentsContent() {
  const searchParams = useSearchParams();
  const selectedDocumentId = searchParams.get('documentId');
  const notice = useDocumentToast();
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [rows, setRows] = useState<DownloadRequest[]>([]);
  const [meta, setMeta] = useState(emptyMeta);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

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
        scope: 'approved',
      });
      if (search) params.set('search', search);
      if (categoryId) params.set('categoryId', categoryId);
      if (selectedDocumentId) params.set('documentId', selectedDocumentId);
      const response = await api.get<DownloadRequest[]>(`/documents/download-requests/mine?${params}`);
      setRows(response.data);
      setMeta(response.meta || emptyMeta);
    } catch (error) {
      notice.error(errorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [page, limit, search, categoryId, selectedDocumentId]);

  const handleDownload = async (item: DownloadRequest) => {
    if (!item.downloadToken) {
      notice.error('Token download tidak tersedia atau sudah pernah digunakan.');
      return;
    }
    setDownloadingId(item.id);
    try {
      await downloadDocumentToken(item.downloadToken, item.documentTitle);
      notice.success('Dokumen ber-watermark berhasil diunduh. Berkas kini tercatat di Riwayat Persetujuan.');
      window.dispatchEvent(new Event('document-approvals-changed'));
      await load();
    } catch (error) {
      notice.error(errorMessage(error));
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="pb-8">
      <AppToast toast={notice.toast} />

      <DocumentPageHeader
        title="Dokumen Disetujui (Siap Download)"
        description="Daftar pengajuan dokumen Anda yang telah disetujui administrator dan siap untuk diunduh."
        action={
          <SecondaryButton onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </SecondaryButton>
        }
      />

      <DocumentPanel>
        {/* Search & Filter Toolbar */}
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Cari judul dokumen, keperluan..."
              className={`${inputClass} pl-9`}
            />
          </div>

          <div className="flex items-center gap-2 sm:w-64">
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

        <DocumentTable
          headers={['Dokumen', 'Disetujui Oleh & Waktu', 'Keperluan / Alasan', 'Status Token', 'Aksi']}
          loading={loading}
          empty={!rows.length}
        >
          {rows.map(item => {
            const isTokenValid = Boolean(item.downloadToken) && item.status === 'approved' && !item.downloadedAt && (!item.tokenExpiresAt || new Date(item.tokenExpiresAt) > new Date());
            return (
              <tr
                key={item.id}
                className={selectedDocumentId === item.documentId
                  ? 'bg-amber-50/80 ring-1 ring-inset ring-amber-300 dark:bg-amber-500/[0.08] dark:ring-amber-500/30'
                  : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/35'}
              >
                {/* Document info */}
                <td className="px-4 py-3.5">
                  <Link
                    href={`/dashboard/dokumen/${item.documentId}`}
                    className="font-bold text-amber-700 transition hover:underline dark:text-amber-400"
                  >
                    {item.documentTitle}
                  </Link>
                  <span className="mt-0.5 block text-[10px] font-semibold text-slate-400">
                    {item.categoryName} {item.ownerUnitName ? `· ${item.ownerUnitName}` : ''}
                  </span>
                </td>

                {/* Approved By & Timestamp */}
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{item.approverName || 'Administrator Portal'}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-400">
                    <Clock className="h-3 w-3 shrink-0" />
                    <span>Disetujui: {formatDocumentDate(item.updatedAt || item.createdAt)}</span>
                  </div>
                </td>

                {/* Purpose / Reason */}
                <td className="px-4 py-3.5 text-xs text-slate-600 dark:text-slate-300">
                  <p className="max-w-xs line-clamp-2 leading-relaxed">
                    {item.reason || 'Kebutuhan Pekerjaan'}
                  </p>
                </td>

                {/* Token Status */}
                <td className="px-4 py-3.5 text-xs">
                  {isTokenValid ? (
                    <div>
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                        <ShieldCheck className="h-3 w-3 text-emerald-600" /> Siap Diunduh (1x Akses)
                      </span>
                    </div>
                  ) : item.downloadedAt ? (
                    <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      <CheckCircle2 className="h-3 w-3 text-slate-400" /> Telah Diunduh ({formatDocumentDate(item.downloadedAt)})
                    </span>
                  ) : (
                    <DownloadStatusBadge status={item.status} />
                  )}
                </td>

                {/* Download Action */}
                <td className="px-4 py-3.5 text-left">
                  {isTokenValid ? (
                    <LoadingButton
                      loading={downloadingId === item.id}
                      onClick={() => handleDownload(item)}
                      className="border border-emerald-300 bg-emerald-50/50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100/70 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300 dark:hover:bg-emerald-900/50"
                    >
                      <Download className="h-3.5 w-3.5" /> Unduh Berkas
                    </LoadingButton>
                  ) : (
                    <Link
                      href={`/dashboard/dokumen/${item.documentId}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400"
                    >
                      Detail <ExternalLink className="h-3 w-3" />
                    </Link>
                  )}
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

export default function ApprovedDocumentsPage() {
  return (
    <Suspense fallback={<div className="min-h-48 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-900" />}>
      <ApprovedDocumentsContent />
    </Suspense>
  );
}
