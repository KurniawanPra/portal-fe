'use client';

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  ExternalLink,
  Eye,
  File,
  FileCheck,
  FileCode,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Loader2,
  Maximize2,
  Minimize2,
  Music,
  Presentation,
  Video,
  X,
} from 'lucide-react';
import { AnimatedModalPortal } from '@/components/ui/AnimatedModalPortal';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { IconAction } from './DocumentUi';
import { DocumentDownloadModal } from './DocumentDownloadModal';
import { createDocumentPreviewSession, formatFileSize } from '../_lib/document-api';
import type { DocumentDetail, DownloadAccessStatus } from '../_lib/types';

const DocumentPdfViewer = dynamic(
  () => import('./DocumentPdfViewer').then(module => module.DocumentPdfViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-80 flex-1 items-center justify-center bg-slate-100 dark:bg-slate-950">
        <Loader2 className="h-7 w-7 animate-spin text-amber-500" />
      </div>
    ),
  },
);

export interface DocumentViewModalProps {
  documentId: string | null;
  open: boolean;
  onClose: () => void;
  onDownload?: (docId: string, title: string) => void;
}

export function DocumentViewModal({
  documentId,
  open,
  onClose,
  onDownload,
}: DocumentViewModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [document, setDocument] = useState<DocumentDetail | null>(null);
  const [downloadStatus, setDownloadStatus] = useState<DownloadAccessStatus | null>(null);
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Security & Anti-Screenshot Protection State
  const [isScreenProtected, setIsScreenProtected] = useState(false);
  const [securityToast, setSecurityToast] = useState<string | null>(null);
  const securityToastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Presentation State for PPT/Word/Excel previews
  const [currentSlide, setCurrentSlide] = useState(1);
  const totalSlides = 5;

  const triggerSecurityToast = (msg: string) => {
    setSecurityToast(msg);
    if (securityToastTimeoutRef.current) clearTimeout(securityToastTimeoutRef.current);
    securityToastTimeoutRef.current = setTimeout(() => {
      setSecurityToast(null);
    }, 3500);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    triggerSecurityToast('Klik kanan dinonaktifkan untuk melindungi hak cipta dan keamanan dokumen.');
  };

  // Anti-Screenshot & Window Blur Protection Listeners
  useEffect(() => {
    if (!open) {
      setIsScreenProtected(false);
      setSecurityToast(null);
      return;
    }

    const handleWindowBlur = () => {
      setIsScreenProtected(true);
    };

    const handleWindowFocus = () => {
      setTimeout(() => {
        setIsScreenProtected(false);
      }, 250);
    };

    const handleVisibilityChange = () => {
      if (window.document.hidden) {
        setIsScreenProtected(true);
      } else {
        setTimeout(() => {
          setIsScreenProtected(false);
        }, 250);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Detect PrintScreen
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        setIsScreenProtected(true);
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText('').catch(() => {});
        }
        triggerSecurityToast('Tangkapan layar dinonaktifkan demi perlindungan dokumen.');
        setTimeout(() => setIsScreenProtected(false), 3000);
        return;
      }

      // Detect Print shortcut (Ctrl+P or Cmd+P)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        setIsScreenProtected(true);
        triggerSecurityToast('Pencetakan dokumen dinonaktifkan.');
        setTimeout(() => setIsScreenProtected(false), 3000);
        return;
      }

      // Detect Save shortcut (Ctrl+S or Cmd+S)
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        triggerSecurityToast('Penyimpanan halaman berkas dinonaktifkan.');
        return;
      }

      // Detect Snipping Tool shortcut (Win+Shift+S / Cmd+Shift+S / Cmd+Shift+4)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        setIsScreenProtected(true);
        triggerSecurityToast('Tangkapan layar dinonaktifkan demi perlindungan dokumen.');
        setTimeout(() => setIsScreenProtected(false), 3000);
        return;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen') {
        setIsScreenProtected(true);
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText('').catch(() => {});
        }
        triggerSecurityToast('Tangkapan layar dinonaktifkan demi perlindungan dokumen.');
        setTimeout(() => setIsScreenProtected(false), 3000);
      }
    };

    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    window.document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);

    return () => {
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      window.document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open || !documentId) {
      setDocument(null);
      setDownloadStatus(null);
      setError(null);
      setTextContent(null);
      setBlobUrl(null);
      return;
    }

    let active = true;
    const fetchDocumentData = async () => {
      setLoading(true);
      setError(null);
      setTextContent(null);
      setBlobUrl(null);
      setCurrentSlide(1);

      try {
        const [detailRes, statusRes, previewSession] = await Promise.all([
          api.get<DocumentDetail>(`/documents/${documentId}`),
          api.get<DownloadAccessStatus>(`/documents/${documentId}/access-status`).catch(() => ({ data: null })),
          createDocumentPreviewSession(documentId),
        ]);
        if (!active) return;
        setDocument(detailRes.data);
        setDownloadStatus(statusRes.data);
        setBlobUrl(`${previewSession.url}?v=${Date.now()}`);
      } catch (err: unknown) {
        if (!active) return;
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat dokumen.');
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchDocumentData();

    return () => {
      active = false;
    };
  }, [open, documentId]);

  if (!open) return null;

  const handleDownloadClick = () => {
    if (!document) return;

    if (downloadStatus?.request?.downloadToken) {
      onClose();
      router.push(`/dashboard/dokumen/approved?documentId=${encodeURIComponent(document.id)}`);
      return;
    }

    if (onDownload) {
      onDownload(document.id, document.title);
    } else {
      setDownloadModalOpen(true);
    }
  };

  const mime = document?.mimeType.toLowerCase() || '';
  const title = document?.title || '';
  const ext = title.split('.').pop()?.toLowerCase() || '';

  const isPdf = mime === 'application/pdf' || ext === 'pdf';
  const isImage = mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext);
  const isPpt = mime.includes('presentation') || mime.includes('powerpoint') || ['ppt', 'pptx', 'odp'].includes(ext);
  const isWord = mime.includes('word') || mime.includes('document') || ['doc', 'docx', 'odt'].includes(ext);
  const isExcel = mime.includes('sheet') || mime.includes('excel') || ['xls', 'xlsx', 'ods', 'csv'].includes(ext);
  const isAudio = mime.startsWith('audio/') || ['mp3', 'wav', 'ogg'].includes(ext);
  const isVideo = mime.startsWith('video/') || ['mp4', 'webm'].includes(ext);

  const isApproved = Boolean(document?.access.canManage || (downloadStatus?.request?.status === 'approved' && downloadStatus?.request?.downloadToken));
  const isPending = downloadStatus?.request?.status === 'pending';

  return (
    <AnimatedModalPortal
      open={open}
      onClose={onClose}
      panelClassName={cn(
        'w-[calc(100vw-1.5rem)] sm:w-[calc(100vw-3rem)] md:w-[calc(100vw-4.5rem)] max-w-none',
        isFullscreen ? 'h-[calc(100dvh-1rem)]' : 'h-[calc(100dvh-2rem)] sm:h-[calc(100dvh-3rem)]',
      )}
    >
      {/* Topmost Floating Security Toast Notification */}
      {securityToast && (
        <div
          role="alert"
          style={{ zIndex: 2147483647 }}
          className="fixed top-6 left-1/2 -translate-x-1/2 rounded-full border border-slate-700/80 bg-slate-900/95 px-5 py-2.5 text-xs font-semibold text-white shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-none"
        >
          <span>{securityToast}</span>
        </div>
      )}

      <div
        role="dialog"
        aria-modal="true"
        aria-label={title || 'View Dokumen'}
        onContextMenu={handleContextMenu}
        onDragStart={e => e.preventDefault()}
        className="relative flex h-full w-full flex-col overflow-hidden rounded-md sm:rounded-lg border border-slate-200 bg-white shadow-2xl transition-all select-none dark:border-slate-800 dark:bg-slate-900"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/90 px-4 py-3 sm:px-5 sm:py-3.5 dark:border-slate-800 dark:bg-slate-950/50">
          <div className="flex min-w-0 items-center gap-3">
            {isPdf && <FileText className="h-5 w-5 shrink-0 text-rose-500" />}
            {isPpt && <Presentation className="h-5 w-5 shrink-0 text-amber-500" />}
            {isWord && <FileText className="h-5 w-5 shrink-0 text-blue-500" />}
            {isExcel && <FileSpreadsheet className="h-5 w-5 shrink-0 text-emerald-500" />}
            {isImage && <ImageIcon className="h-5 w-5 shrink-0 text-purple-500" />}
            {!isPdf && !isPpt && !isWord && !isExcel && !isImage && <File className="h-5 w-5 shrink-0 text-slate-500" />}

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-base font-black text-slate-900 dark:text-white">{title || 'Memuat Dokumen...'}</h2>
              </div>
              {document && (
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {document.categoryName} · Versi {document.version} · {formatFileSize(document.fileSize)}
                </p>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {/* Tombol Buka Tab Baru sengaja ditiadakan untuk perlindungan dokumen */}

            {document && (
              isApproved ? (
                <button
                  type="button"
                  onClick={handleDownloadClick}
                  className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Buka Unduhan</span>
                </button>
              ) : isPending ? (
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-900 cursor-not-allowed shadow-2xs dark:border-amber-700 dark:bg-amber-950/70 dark:text-amber-300"
                  title="Pengajuan unduh sedang diproses oleh administrator"
                >
                  <Clock className="h-3.5 w-3.5 animate-pulse text-amber-600 dark:text-amber-400" />
                  <span>Menunggu Persetujuan</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleDownloadClick}
                  className="inline-flex items-center gap-1.5 rounded-md bg-amber-500 hover:bg-amber-600 active:bg-amber-700 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition active:scale-95 dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-slate-950 cursor-pointer"
                >
                  <FileCheck className="h-3.5 w-3.5 text-white dark:text-slate-950" />
                  <span>Minta Persetujuan Unduh</span>
                </button>
              )
            )}

            <IconAction label={isFullscreen ? 'Kecilkan' : 'Perbesar'} onClick={() => setIsFullscreen(!isFullscreen)}>
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </IconAction>

            <IconAction label="Tutup Modal" onClick={onClose}>
              <X className="h-4 w-4" />
            </IconAction>
          </div>
        </div>

        {/* Modal Main Content Canvas with Anti-Screenshot Blur Protection */}
        <div
          onContextMenu={handleContextMenu}
          onDragStart={e => e.preventDefault()}
          className={cn(
            'relative min-h-0 flex-1 overflow-hidden bg-slate-100/70 dark:bg-slate-950/60 flex flex-col select-none',
            !isPdf && 'overflow-auto p-4',
          )}
        >
          {/* Anti-Screenshot Protective Sensor Blur Overlay */}
          {isScreenProtected && (
            <div
              className="absolute inset-0 z-40 flex items-center justify-center bg-slate-950/15 dark:bg-black/25 backdrop-blur-xl transition-all duration-300 select-none cursor-pointer"
              onClick={() => setIsScreenProtected(false)}
            >
              <div className="rounded-lg bg-slate-900/85 px-4 py-2 text-xs font-medium text-white shadow-xl backdrop-blur-md ring-1 ring-white/10 text-center">
                Dokumen dilindungi. Klik layar untuk melanjutkan membaca.
              </div>
            </div>
          )}

          {/* Document Content Canvas Container */}
          <div
            className={cn(
              'flex flex-1 flex-col min-h-0 transition-all duration-300',
              isScreenProtected && 'filter blur-[28px] opacity-70 pointer-events-none select-none',
            )}
          >
            {loading ? (
              <div className="flex h-full min-h-80 flex-col items-center justify-center gap-3 py-20 text-slate-500">
                <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Membuka sesi pratinjau dokumen...
                </p>
              </div>
            ) : error ? (
              <div className="mx-auto flex max-w-md flex-col items-center justify-center py-20 text-center">
                <AlertCircle className="h-10 w-10 text-rose-500" />
                <h3 className="mt-3 text-base font-bold text-slate-800 dark:text-slate-100">Gagal Membuka File</h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{error}</p>
                {document && onDownload && (
                  <button
                    type="button"
                    onClick={() => onDownload(document.id, document.title)}
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-amber-600"
                  >
                    <Download className="h-4 w-4" /> Unduh Berkas Langsung
                  </button>
                )}
              </div>
            ) : isPdf && blobUrl ? (
              <DocumentPdfViewer url={blobUrl} title={title} />
            ) : isImage && blobUrl ? (
              <div className="flex h-full items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={blobUrl}
                  alt={title}
                  draggable={false}
                  onContextMenu={handleContextMenu}
                  className="max-h-full max-w-full rounded-lg object-contain shadow-lg pointer-events-none select-none"
                />
              </div>
            ) : isPpt ? (
              <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white shadow-md dark:border-slate-800 dark:bg-slate-900">
                {/* PPT Presentation Navigation Header */}
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-950/30">
                  <div className="flex items-center gap-2">
                    <Presentation className="h-4 w-4 text-amber-500" />
                    <span className="text-xs font-black uppercase text-slate-700 dark:text-slate-200">Pratinjau Presentasi PowerPoint</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={currentSlide <= 1}
                      onClick={() => setCurrentSlide(s => Math.max(1, s - 1))}
                      className="inline-flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-xs font-bold tabular-nums text-slate-600 dark:text-slate-300">
                      Slide {currentSlide} dari {totalSlides}
                    </span>
                    <button
                      type="button"
                      disabled={currentSlide >= totalSlides}
                      onClick={() => setCurrentSlide(s => Math.min(totalSlides, s + 1))}
                      className="inline-flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* PPT Slide Screen Canvas Mockup */}
                <div className="flex flex-1 items-center justify-center p-6 bg-slate-950/90 text-white">
                  <div className="relative aspect-video w-full max-w-3xl overflow-hidden rounded-lg bg-gradient-to-br from-amber-600 via-amber-700 to-amber-900 p-8 text-white shadow-2xl flex flex-col justify-between select-none">
                    <div className="flex items-center justify-between border-b border-white/20 pb-4">
                      <span className="text-xs font-black uppercase tracking-wider text-amber-200">PT Industri Nabati Lestari</span>
                      <span className="rounded bg-white/20 px-2 py-0.5 text-[10px] font-bold">SLIDE {currentSlide}</span>
                    </div>

                    <div className="my-auto space-y-3">
                      <h3 className="text-2xl font-black leading-tight tracking-tight drop-shadow">{title}</h3>
                      <p className="text-xs leading-relaxed text-amber-100/90">
                        {currentSlide === 1 && `Dokumen presentasi resmi untuk unit ${document?.ownerUnitName || 'PT INL'}.`}
                        {currentSlide === 2 && 'Ikhtisar Eksekutif & Poin-poin Utama Pembahasan.'}
                        {currentSlide === 3 && 'Analisis Kinerja, Indikator Kunci & Metrik Evaluasi.'}
                        {currentSlide === 4 && 'Rencana Strategis Implementasi & Langkah Lanjutan.'}
                        {currentSlide === 5 && 'Kesimpulan & Dokumen Lampiran Pendukung.'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-amber-200/70 border-t border-white/10 pt-3">
                      <span>Versi {document?.version}</span>
                      <span>Kategori: {document?.categoryName}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : isWord ? (
              <div className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900 select-none">
                <div className="border-b border-slate-200 pb-4 dark:border-slate-800">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                    <FileText className="h-3.5 w-3.5" /> Dokumen Word ({ext.toUpperCase()})
                  </span>
                  <h3 className="mt-3 text-xl font-black text-slate-900 dark:text-white">{title}</h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Pemilik: {document?.ownerUnitName || 'Umum'} · Kategori: {document?.categoryName} · Versi {document?.version}
                  </p>
                </div>

                <div className="mt-6 space-y-4 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">Pratinjau Dokumen:</p>
                  <p>Dokumen ini telah diunggah dan diverifikasi ke dalam sistem SSO Portal PT Industri Nabati Lestari.</p>
                  <div className="rounded-lg bg-slate-50 p-4 border border-slate-100 dark:bg-slate-800/50 dark:border-slate-800">
                    <p className="font-bold text-slate-800 dark:text-slate-200">Informasi Berkas:</p>
                    <ul className="mt-2 space-y-1 text-slate-600 dark:text-slate-400">
                      <li>· Ukuran Berkas: {formatFileSize(document?.fileSize || 0)}</li>
                      <li>· Tipe MIME: {document?.mimeType}</li>
                      <li>· Diunggah Oleh: {document?.uploadedByName || 'Sistem'}</li>
                    </ul>
                  </div>
                  <p className="text-slate-500 italic">Gunakan tombol &quot;Unduh&quot; di atas untuk membuka dokumen penuh secara lengkap menggunakan Microsoft Word.</p>
                </div>
              </div>
            ) : isExcel ? (
              <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white shadow-md dark:border-slate-800 dark:bg-slate-900 select-none">
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-950/40">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs font-black uppercase text-slate-700 dark:text-slate-200">Pratinjau Spreadsheet Excel</span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-500">{formatFileSize(document?.fileSize || 0)}</span>
                </div>
                <div className="flex-1 overflow-auto p-4">
                  <table className="w-full border-collapse border border-slate-200 text-left text-xs dark:border-slate-700">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-800">
                        <th className="border border-slate-200 px-3 py-2 text-center text-slate-400 dark:border-slate-700">#</th>
                        <th className="border border-slate-200 px-3 py-2 font-bold text-slate-700 dark:border-slate-700 dark:text-slate-200">Kolom A</th>
                        <th className="border border-slate-200 px-3 py-2 font-bold text-slate-700 dark:border-slate-700 dark:text-slate-200">Kolom B</th>
                        <th className="border border-slate-200 px-3 py-2 font-bold text-slate-700 dark:border-slate-700 dark:text-slate-200">Kolom C</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {[1, 2, 3, 4, 5].map(row => (
                        <tr key={row} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="border border-slate-200 px-3 py-2 text-center text-slate-400 dark:border-slate-700">{row}</td>
                          <td className="border border-slate-200 px-3 py-2 font-semibold text-slate-800 dark:border-slate-700 dark:text-slate-200">Data Baris {row}</td>
                          <td className="border border-slate-200 px-3 py-2 text-slate-600 dark:border-slate-700 dark:text-slate-300">{document?.categoryName}</td>
                          <td className="border border-slate-200 px-3 py-2 text-slate-600 dark:border-slate-700 dark:text-slate-300">Status Aktif</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : textContent !== null ? (
              <div className="h-full rounded-xl border border-slate-200 bg-slate-950 p-4 shadow-md dark:border-slate-800 overflow-auto select-none">
                <pre className="text-xs font-mono text-emerald-400 whitespace-pre-wrap leading-relaxed">
                  <code>{textContent}</code>
                </pre>
              </div>
            ) : isAudio && blobUrl ? (
              <div className="flex h-full flex-col items-center justify-center p-8 select-none">
                <Music className="h-16 w-16 text-amber-500 mb-4 animate-bounce" />
                <audio src={blobUrl} controls className="w-full max-w-md" />
              </div>
            ) : isVideo && blobUrl ? (
              <div className="flex h-full items-center justify-center select-none">
                <video src={blobUrl} controls className="max-h-full max-w-full rounded-lg shadow-xl" />
              </div>
            ) : (
              <div className="mx-auto flex max-w-md flex-col items-center justify-center py-16 text-center select-none">
                <File className="h-14 w-14 text-slate-400" />
                <h3 className="mt-3 text-base font-bold text-slate-800 dark:text-slate-100">{title}</h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Format berkas ini ({ext.toUpperCase()}) tidak mendukung preview langsung pada browser.
                </p>
                {document && onDownload && (
                  <button
                    type="button"
                    onClick={() => onDownload(document.id, document.title)}
                    className="mt-5 inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-amber-600 active:scale-95"
                  >
                    <Download className="h-4 w-4" /> Unduh Berkas Sekarang
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/80 px-5 py-3 dark:border-slate-800 dark:bg-slate-950/40">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {document?.ownerUnitName ? `Unit: ${document.ownerUnitName}` : 'Dokumen Umum'}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-300 bg-white px-4 py-1.5 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>

      {/* Global CSS for Anti-Print */}
      <style jsx global>{`
        @media print {
          body {
            display: none !important;
          }
        }
      `}</style>

      <DocumentDownloadModal
        open={downloadModalOpen}
        documentId={document?.id || null}
        documentTitle={document?.title || ''}
        categoryName={document?.categoryName}
        version={document?.version}
        fileSize={document?.fileSize}
        mimeType={document?.mimeType}
        onClose={() => setDownloadModalOpen(false)}
        onConfirmDownload={async (reason) => {
          await api.post(`/documents/${document?.id}/download-request`, { reason });
          setDownloadModalOpen(false);
          if (documentId) {
            const updatedStatus = await api.get<DownloadAccessStatus>(`/documents/${documentId}/access-status`);
            setDownloadStatus(updatedStatus.data);
          }
        }}
      />
    </AnimatedModalPortal>
  );
}

