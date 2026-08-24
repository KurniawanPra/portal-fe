'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Clock, ExternalLink, Eye, FileCheck, FileText, History, Loader2, Pencil, Power, Send, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { AppToast } from '@/components/ui/AppToast';
import {
  DocumentModal,
  DocumentPageHeader,
  DocumentPanel,
  DownloadStatusBadge,
  LoadingButton,
  SecondaryButton,
  inputClass,
  labelClass,
} from '../_components/DocumentUi';
import { useDocumentToast } from '../_components/useDocumentToast';
import { UnitSelectSearch } from '../_components/UnitSelectSearch';
import { DocumentRevisionModal } from '../_components/DocumentRevisionModal';
import { DocumentRevisionTimeline } from '../_components/DocumentRevisionTimeline';
import { DocumentViewModal } from '../_components/DocumentViewModal';
import { DocumentDownloadModal } from '../_components/DocumentDownloadModal';
import { errorMessage, formatDocumentDate, formatFileSize } from '../_lib/document-api';
import type { DocumentCategory, DocumentDetail, DocumentVersion, DownloadAccessStatus, UnitOption } from '../_lib/types';

export default function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const notice = useDocumentToast();
  const [document, setDocument] = useState<DocumentDetail | null>(null);
  const [downloadStatus, setDownloadStatus] = useState<DownloadAccessStatus | null>(null);
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);
  const [requestReason, setRequestReason] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [revisionOpen, setRevisionOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [revisions, setRevisions] = useState<DocumentVersion[]>([]);
  const [loadingRevisions, setLoadingRevisions] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', description: '', categoryId: '', ownerUnitId: '' });

  const load = async () => {
    setLoading(true);
    setLoadingRevisions(true);
    try {
      const [detailResponse, revisionResponse] = await Promise.all([
        api.get<DocumentDetail>(`/documents/${id}`),
        api.get<DocumentVersion[]>(`/documents/${id}/revisions`).catch(() => ({ data: [] })),
      ]);
      setDocument(detailResponse.data);
      setRevisions(revisionResponse.data || []);
      setEditForm({
        title: detailResponse.data.title,
        description: detailResponse.data.description || '',
        categoryId: detailResponse.data.categoryId,
        ownerUnitId: detailResponse.data.ownerUnitId || '',
      });
      const referenceRequests: Promise<unknown>[] = [];
      if (detailResponse.data.access.canEdit) {
        referenceRequests.push(Promise.all([
          api.get<DocumentCategory[]>('/documents/categories'),
          api.get<UnitOption[]>('/org/unit?limit=1000'),
        ]).then(([categoryResponse, unitResponse]) => { setCategories(categoryResponse.data); setUnits(unitResponse.data); }));
      }
      if (detailResponse.data.access.canView) {
        referenceRequests.push(api.get<DownloadAccessStatus>(`/documents/${id}/access-status`).then(response => setDownloadStatus(response.data)));
      }
      await Promise.all(referenceRequests);
    } catch (error) {
      notice.error(errorMessage(error));
    } finally {
      setLoading(false);
      setLoadingRevisions(false);
    }
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [id]);

  const goToApprovedDownload = () => {
    router.push(`/dashboard/dokumen/approved?documentId=${encodeURIComponent(id)}`);
  };

  const handleConfirmDownloadModal = async (reason: string) => {
    setWorking(true);
    try {
      const response = await api.post<{ requestId: string; status: string; downloadToken: string | null; tokenExpiresAt: string | null }>(`/documents/${id}/download-request`, { reason: reason.trim() || null });
      if (response.data.downloadToken) {
        router.push(`/dashboard/dokumen/approved?documentId=${encodeURIComponent(id)}`);
      } else {
        notice.success('Permintaan download dikirim kepada administrator.');
        window.dispatchEvent(new Event('document-approvals-changed'));
        const statusResponse = await api.get<DownloadAccessStatus>(`/documents/${id}/access-status`);
        setDownloadStatus(statusResponse.data);
      }
    } catch (error) {
      notice.error(errorMessage(error));
      throw error;
    } finally {
      setWorking(false);
    }
  };

  const submitRequest = async () => {
    setWorking(true);
    try {
      const response = await api.post<{ requestId: string; status: string; downloadToken: string | null; tokenExpiresAt: string | null }>(`/documents/${id}/download-request`, { reason: requestReason.trim() || null });
      setRequestOpen(false);
      setRequestReason('');
      if (response.data.downloadToken) {
        router.push(`/dashboard/dokumen/approved?documentId=${encodeURIComponent(id)}`);
      } else {
        notice.success('Permintaan download dikirim kepada administrator.');
        const statusResponse = await api.get<DownloadAccessStatus>(`/documents/${id}/access-status`);
        setDownloadStatus(statusResponse.data);
      }
    } catch (error) {
      notice.error(errorMessage(error));
    } finally {
      setWorking(false);
    }
  };

  const saveEdit = async () => {
    if (!editForm.title.trim() || !editForm.categoryId) return notice.error('Judul dan kategori wajib diisi.');
    setWorking(true);
    try {
      await api.put(`/documents/${id}`, {
        title: editForm.title.trim(),
        description: editForm.description.trim() || null,
        categoryId: editForm.categoryId,
        ownerUnitId: editForm.ownerUnitId || null,
      });
      notice.success('Metadata dokumen berhasil diperbarui.');
      setEditOpen(false);
      await load();
    } catch (error) {
      notice.error(errorMessage(error));
    } finally {
      setWorking(false);
    }
  };

  const remove = async () => {
    setWorking(true);
    try {
      await api.delete(`/documents/${id}`);
      notice.success('Dokumen berhasil dinonaktifkan.');
      router.push('/dashboard/dokumen');
    } catch (error) {
      notice.error(errorMessage(error));
    } finally {
      setWorking(false);
    }
  };

  const reactivate = async () => {
    setWorking(true);
    try {
      await api.post(`/documents/${id}/reactivate`, {});
      notice.success('Dokumen berhasil diaktifkan kembali.');
      await load();
    } catch (error) {
      notice.error(errorMessage(error));
    } finally {
      setWorking(false);
    }
  };

  const handleActivateVersion = async (versionNumber: number) => {
    try {
      await api.post(`/documents/${id}/revisions/${versionNumber}/activate`, {});
      notice.success(`Versi v${versionNumber} berhasil diaktifkan sebagai versi utama dokumen.`);
      await load();
    } catch (error) {
      notice.error(errorMessage(error));
    }
  };

  const request = downloadStatus?.request;
  const canUseApprovedToken = request?.status === 'approved' && request.downloadToken && !request.downloadedAt;
  const canRequestAgain = !request || request.status === 'rejected' || request.status === 'expired' || Boolean(request.downloadedAt);

  if (loading && !document) return <div className="flex min-h-[55vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-amber-500" /></div>;
  if (!document) return <div className="pb-8"><AppToast toast={notice.toast} /><DocumentPageHeader title="Detail Dokumen" description="Dokumen tidak dapat ditampilkan." /></div>;

  return (
    <div className="pb-8">
      <AppToast toast={notice.toast} />
      <Link href="/dashboard/dokumen" className="mb-4 inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"><ArrowLeft className="h-4 w-4" /> Kembali ke daftar</Link>
      <DocumentPageHeader
        title={document.title}
        description={`${document.categoryName} · Versi ${document.version} ${!document.isActive ? '· (NONAKTIF)' : ''}`}
        action={<>
          {document.access.canView && (
            <SecondaryButton onClick={() => setViewOpen(true)} className="border-sky-300 bg-sky-50 text-sky-700 hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-950/60 dark:text-sky-300 dark:hover:bg-sky-900/80">
              <Eye className="h-4 w-4 text-sky-600 dark:text-sky-400" /> Lihat Dokumen
            </SecondaryButton>
          )}
          {document.access.canEdit && (
            <SecondaryButton onClick={() => setRevisionOpen(true)} className="border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-300 dark:hover:bg-amber-950/30">
              <History className="h-4 w-4" /> Revisi Dokumen
            </SecondaryButton>
          )}
          {document.access.canEdit && <SecondaryButton onClick={() => setEditOpen(true)}><Pencil className="h-4 w-4" /> Edit</SecondaryButton>}
          {document.access.canEdit && (
            document.isActive ? (
              <SecondaryButton onClick={() => setDeleteOpen(true)} className="text-rose-600 dark:text-rose-400"><Trash2 className="h-4 w-4" /> Nonaktifkan</SecondaryButton>
            ) : (
              <LoadingButton loading={working} onClick={reactivate} className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"><Power className="h-4 w-4" /> Aktifkan Kembali</LoadingButton>
            )
          )}
        </>}
      />

      {!document.isActive && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-800/80 dark:bg-amber-950/40">
          <div className="flex items-center gap-3">
            <Power className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-amber-900 dark:text-amber-200">Status Dokumen Nonaktif</h3>
              <p className="mt-0.5 text-xs font-semibold text-amber-700 dark:text-amber-300">Dokumen ini sedang dinonaktifkan. Karyawan biasa tidak dapat meminta token download untuk dokumen nonaktif.</p>
            </div>
          </div>
          {document.access.canEdit && (
            <LoadingButton loading={working} onClick={reactivate} className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 shrink-0">
              <Power className="h-4 w-4" /> Aktifkan Kembali Dokumen
            </LoadingButton>
          )}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <DocumentPanel>
            <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800"><h2 className="text-sm font-black text-slate-900 dark:text-white">Informasi dokumen</h2></div>
            <div className="grid gap-px bg-slate-200 dark:bg-slate-800 sm:grid-cols-2">
              {[
                ['Kategori', document.categoryName],
                ['Unit pemilik', document.ownerUnitName || 'Umum (seluruh organisasi)'],
                ['Versi aktif', `v${document.version}`],
                ['Ukuran file', formatFileSize(document.fileSize)],
                ['Format file', 'Dokumen PDF (.pdf)'],
                ['Diunggah oleh', document.uploadedByName],
                ['Dibuat tanggal', formatDocumentDate(document.createdAt)],
              ].map(([label, value]) => <div key={String(label)} className="bg-white px-5 py-4 dark:bg-slate-900"><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</p><div className="mt-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200">{value}</div></div>)}
            </div>
            {document.description && (
              <div className="border-t border-slate-200 px-5 py-4 dark:border-slate-800">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Deskripsi / Catatan Dokumen</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">{document.description}</p>
              </div>
            )}
          </DocumentPanel>

          <DocumentRevisionTimeline
            versions={revisions}
            currentVersion={document.version}
            canManageVersion={document.access.canEdit}
            documentTitle={document.title}
            onActivateVersion={handleActivateVersion}
          />
        </div>

        <div className="space-y-4">
          <DocumentPanel className="p-5">
            <h2 className="text-sm font-black text-slate-900 dark:text-white">Peninjauan &amp; Akses Download</h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Lihat dokumen langsung secara instan dengan stempel watermark resmi, atau ajukan permintaan download berkas.</p>

            <div className="mt-4 space-y-2">
              {document.access.canView && (
                <button
                  type="button"
                  onClick={() => setViewOpen(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-sky-300 bg-sky-50 px-4 py-2.5 text-xs font-bold text-sky-800 transition hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-950/60 dark:text-sky-300 dark:hover:bg-sky-900/80"
                >
                  <Eye className="h-4 w-4" /> Lihat / Preview Dokumen
                </button>
              )}

              {canUseApprovedToken ? (
                <LoadingButton loading={false} onClick={goToApprovedDownload} className="w-full bg-emerald-600 hover:bg-emerald-700 font-bold shadow-xs">
                  <ExternalLink className="h-4 w-4" /> Buka Unduhan
                </LoadingButton>
              ) : request?.status === 'pending' ? (
                <button
                  type="button"
                  disabled
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-amber-300 bg-amber-100 px-4 py-2.5 text-xs font-bold text-amber-900 shadow-2xs dark:border-amber-700 dark:bg-amber-950/70 dark:text-amber-300 cursor-not-allowed"
                >
                  <Clock className="h-4 w-4 animate-pulse text-amber-600 dark:text-amber-400" />
                  Menunggu Persetujuan
                </button>
              ) : (
                canRequestAgain && document.isActive && (
                  <button
                    type="button"
                    onClick={() => setDownloadModalOpen(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-600 active:bg-amber-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm shadow-amber-500/25 transition focus:outline-none dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-slate-950 cursor-pointer"
                  >
                    <FileCheck className="h-4 w-4 text-white dark:text-slate-950" /> Minta Persetujuan Unduh
                  </button>
                )
              )}
            </div>

            {request && (
              <div className="mt-4 rounded-lg bg-slate-50 p-3 text-xs dark:bg-slate-800/60">
                <div className="flex items-center justify-between"><span className="font-bold text-slate-700 dark:text-slate-200">Status Permintaan</span><DownloadStatusBadge status={request.status} /></div>
                <p className="mt-2 text-slate-500 dark:text-slate-400">Diajukan: {formatDocumentDate(request.createdAt)}</p>
                {request.rejectionReason && <p className="mt-1 font-semibold text-rose-600 dark:text-rose-400">Alasan penolakan: {request.rejectionReason}</p>}
              </div>
            )}
          </DocumentPanel>
        </div>
      </div>

      <DocumentViewModal
        open={viewOpen}
        documentId={document.id}
        onClose={() => setViewOpen(false)}
        onDownload={() => {
          setViewOpen(false);
          setDownloadModalOpen(true);
        }}
      />

      <DocumentDownloadModal
        open={downloadModalOpen}
        documentId={document.id}
        documentTitle={document.title}
        categoryName={document.categoryName}
        version={document.version}
        fileSize={document.fileSize}
        mimeType={document.mimeType}
        onClose={() => setDownloadModalOpen(false)}
        onConfirmDownload={handleConfirmDownloadModal}
      />

      <DocumentModal open={requestOpen} onClose={() => !working && setRequestOpen(false)} title="Request download" description={document.title} footer={<><SecondaryButton onClick={() => setRequestOpen(false)} disabled={working}>Batal</SecondaryButton><LoadingButton loading={working} onClick={submitRequest}>Kirim Permintaan</LoadingButton></>}><label><span className={labelClass}>Alasan atau kebutuhan</span><textarea className={`${inputClass} h-28 resize-none py-2.5`} value={requestReason} maxLength={2000} onChange={event => setRequestReason(event.target.value)} placeholder="Opsional" /></label></DocumentModal>

      <DocumentModal open={editOpen} onClose={() => !working && setEditOpen(false)} title="Edit metadata dokumen" width="max-w-2xl" footer={<><SecondaryButton onClick={() => setEditOpen(false)} disabled={working}>Batal</SecondaryButton><LoadingButton loading={working} onClick={saveEdit}>Simpan Perubahan</LoadingButton></>}>
        <label><span className={labelClass}>Judul *</span><input className={inputClass} value={editForm.title} onChange={event => setEditForm(current => ({ ...current, title: event.target.value }))} /></label>
        <label className="block mt-[2px]"><span className={labelClass}>Deskripsi</span><textarea className={`${inputClass} h-20 resize-none py-2`} value={editForm.description} onChange={event => setEditForm(current => ({ ...current, description: event.target.value }))} /></label>
        <div className="grid gap-4 sm:grid-cols-2 mt-[2px]"><label><span className={labelClass}>Kategori *</span><select className={inputClass} value={editForm.categoryId} onChange={event => setEditForm(current => ({ ...current, categoryId: event.target.value }))}>{categories.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><div><span className={labelClass}>Unit Pemilik</span><UnitSelectSearch units={units} value={editForm.ownerUnitId} onChange={ownerUnitId => setEditForm(current => ({ ...current, ownerUnitId }))} emptyLabel="Tanpa unit khusus" /></div></div>
      </DocumentModal>

      <DocumentModal open={deleteOpen} onClose={() => !working && setDeleteOpen(false)} title="Nonaktifkan dokumen" description="File tidak dihapus secara hard delete dan jejak audit tetap disimpan." footer={<><SecondaryButton onClick={() => setDeleteOpen(false)} disabled={working}>Batal</SecondaryButton><LoadingButton loading={working} onClick={remove} className="bg-rose-600 hover:bg-rose-700">Nonaktifkan</LoadingButton></>}><p className="text-sm text-slate-600 dark:text-slate-300">Dokumen tidak akan muncul lagi pada daftar akses karyawan.</p></DocumentModal>

      <DocumentRevisionModal
        open={revisionOpen}
        onClose={() => setRevisionOpen(false)}
        documentId={document.id}
        currentVersion={document.version}
        documentTitle={document.title}
        onRevised={async () => {
          notice.success(`Dokumen berhasil direvisi ke versi v${document.version + 1}.`);
          await load();
        }}
        onError={msg => notice.error(msg)}
      />
    </div>
  );
}
