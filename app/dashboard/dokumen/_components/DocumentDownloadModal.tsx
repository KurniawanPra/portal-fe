'use client';

import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Loader2,
  QrCode,
  ShieldCheck,
  UserCheck,
  X,
} from 'lucide-react';
import { AnimatedModalPortal } from '@/components/ui/AnimatedModalPortal';
import { api } from '@/lib/api';
import { formatFileSize } from '../_lib/document-api';
import { IconAction, inputClass, labelClass } from './DocumentUi';

export interface DocumentDownloadModalProps {
  open: boolean;
  documentId: string | null;
  documentTitle: string;
  categoryName?: string;
  version?: number;
  fileSize?: number;
  mimeType?: string;
  confidentialityLevel?: number;
  onClose: () => void;
  onConfirmDownload: (reason: string, watermarkStyle: string) => Promise<void>;
}

export function DocumentDownloadModal({
  open,
  documentId,
  documentTitle,
  categoryName,
  version = 1,
  fileSize = 0,
  mimeType,
  confidentialityLevel = 1,
  onClose,
  onConfirmDownload,
}: DocumentDownloadModalProps) {
  const [reason, setReason] = useState('');
  const watermarkStyle = 'official_bottom_right';
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<{ nama?: string; name?: string; username?: string; role?: string } | null>(null);
  const [currentTimeStr, setCurrentTimeStr] = useState('');

  useEffect(() => {
    if (!open) {
      setReason('');
      setSubmitting(false);
      return;
    }
    api.get<{ nama?: string; name?: string; username?: string; role?: string }>('/auth/me')
      .then(res => setUser(res.data))
      .catch(() => setUser(null));

    setCurrentTimeStr(
      new Date().toLocaleString('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    );
  }, [open]);

  if (!open || !documentId) return null;

  const isPdf = (mimeType || '').includes('pdf') || documentTitle.toLowerCase().endsWith('.pdf');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onConfirmDownload(reason.trim(), watermarkStyle);
      onClose();
    } catch {
      // Parent handler displays the API error; keep this modal open for retry.
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatedModalPortal open={open} onClose={onClose} panelClassName="w-full max-w-xl">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Unduh Dokumen"
        className="flex max-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 bg-slate-50/80 px-5 py-4 dark:border-slate-800 dark:bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-emerald-600 dark:text-emerald-400">
              <Download className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">Minta Persetujuan Unduh Dokumen</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Isi alasan pengajuan unduh dokumen untuk dikirim ke administrator.</p>
            </div>
          </div>
          <IconAction label="Tutup modal" onClick={onClose}>
            <X className="h-4 w-4" />
          </IconAction>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 py-5 space-y-4">
          {/* Target Document Card */}
          <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-950/30">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                <FileText className="h-4 w-4 shrink-0 text-amber-500" />
                <span className="truncate">{documentTitle}</span>
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              {categoryName ? `${categoryName} · ` : ''}Versi {version} · {formatFileSize(fileSize)}
            </p>
          </div>

          {/* Reason Input Field */}
          <div>
            <label className={labelClass}>
              Alasan Membutuhkan Download Berkas <span className="text-amber-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              className={`${inputClass} h-auto py-2.5 resize-none`}
              placeholder="Jelaskan secara singkat keperluan Anda mengunduh dokumen ini..."
              value={reason}
              onChange={e => setReason(e.target.value)}
            />
          </div>

          {/* Single Official Verification Badge Info */}
          <div className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 dark:border-slate-800 dark:bg-slate-950/40">
            <ShieldCheck className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="text-xs text-slate-700 dark:text-slate-300">
              <span className="font-bold text-slate-900 dark:text-slate-100">Verifikasi Digital: </span>
              {isPdf
                ? 'Berkas PDF akan diberi watermark INL dan ditambahkan satu lembar verifikasi berisi kode QR di bagian akhir dokumen.'
                : 'Berkas yang diunduh akan diberi tanda verifikasi digital secara otomatis.'}
            </div>
          </div>

          {/* Watermark & Verification Preview */}
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col items-center justify-center text-center">
            <p className="mb-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400">Pratinjau Watermark &amp; Lembar Verifikasi</p>
            <div className="inline-flex flex-col items-center px-4 py-3">
              <div className="flex h-16 w-16 items-center justify-center text-slate-800 dark:text-slate-100">
                <QrCode className="h-14 w-14 text-slate-800 dark:text-slate-200" />
              </div>
              <span className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                QR verifikasi dicetak pada lembar tambahan
              </span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
            <button
              type="button"
              disabled={submitting}
              onClick={onClose}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting || !reason.trim()}
              className="inline-flex items-center gap-2 rounded-md bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Memproses Pengajuan...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" /> Kirim Permintaan Unduh
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </AnimatedModalPortal>
  );
}
