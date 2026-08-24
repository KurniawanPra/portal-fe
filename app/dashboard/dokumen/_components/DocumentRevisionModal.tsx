'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Clock, FileCheck, History, Loader2, UploadCloud } from 'lucide-react';
import { api } from '@/lib/api';
import { DocumentModal, LoadingButton, SecondaryButton, inputClass, labelClass } from './DocumentUi';
import { errorMessage, formatDocumentDate } from '../_lib/document-api';

interface DocumentRevisionModalProps {
  open: boolean;
  onClose: () => void;
  documentId: string;
  currentVersion: number;
  documentTitle: string;
  onRevised: () => void;
  onError: (message: string) => void;
}

export function DocumentRevisionModal({
  open,
  onClose,
  documentId,
  currentVersion,
  documentTitle,
  onRevised,
  onError,
}: DocumentRevisionModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [changelog, setChangelog] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  const nextVersion = currentVersion + 1;

  useEffect(() => {
    if (open) {
      setCurrentTime(formatDocumentDate(new Date().toISOString()));
      setFile(null);
      setChangelog('');
      setConfirmed(false);
    }
  }, [open]);

  const close = () => {
    if (saving) return;
    setFile(null);
    setChangelog('');
    setConfirmed(false);
    onClose();
  };

  const submit = async () => {
    if (!file) {
      onError('File dokumen revisi baru wajib dipilih.');
      return;
    }
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      onError('Format file dokumen wajib PDF (.pdf).');
      return;
    }
    if (!changelog.trim()) {
      onError('Catatan revisi (commit message) wajib diisi.');
      return;
    }
    if (!confirmed) {
      onError('Silakan beri centang pada konfirmasi revisi dokumen.');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      onError('Ukuran file maksimal 50 MB.');
      return;
    }

    const data = new FormData();
    data.append('file', file);
    data.append('changelog', changelog.trim());

    setSaving(true);
    try {
      await api.post(`/documents/${documentId}/revisions`, data);
      onRevised();
      close();
    } catch (error) {
      onError(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <DocumentModal
      open={open}
      onClose={close}
      title="Revisi Dokumen (Upload Versi Baru)"
      description={`Merevisi "${documentTitle}"`}
      footer={
        <>
          <SecondaryButton onClick={close} disabled={saving}>
            Batal
          </SecondaryButton>
          <LoadingButton loading={saving} disabled={!file || !changelog.trim() || !confirmed} onClick={submit}>
            <FileCheck className="h-4 w-4" /> Simpan & Commit Revisi
          </LoadingButton>
        </>
      }
    >
      {/* Revision Meta Header Banner */}
      <div className="mb-4 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 dark:border-slate-800 dark:bg-slate-800">
        <div className="bg-amber-50/80 p-3 dark:bg-amber-950/30">
          <p className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-300">Versi Otomatis</p>
          <p className="mt-1 flex items-center gap-1.5 text-sm font-black text-amber-900 dark:text-amber-100">
            <History className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <span>Revisi Ke-{nextVersion} (v{nextVersion})</span>
          </p>
        </div>
        <div className="bg-white p-3 dark:bg-slate-900">
          <p className="text-[10px] font-black uppercase text-slate-400">Tanggal & Jam Revisi</p>
          <p className="mt-1 flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            <span>{currentTime || 'Sekarang'}</span>
          </p>
        </div>
      </div>

      {/* Changelog / Commit Message Input */}
      <label>
        <span className={labelClass}>Catatan Revisi / Commit Message *</span>
        <textarea
          className={`${inputClass} h-24 resize-none py-2.5`}
          value={changelog}
          maxLength={1000}
          onChange={event => setChangelog(event.target.value)}
          placeholder="Jelaskan perubahan pada revisi ini (misal: Pembaruan Bab 3 dan lampiran sertifikasi ISO)..."
        />
      </label>

      {/* File Upload Dropzone */}
      <div>
        <span className={labelClass}>File Dokumen Baru (Revisi v{nextVersion} - Khusus PDF) *</span>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,application/pdf"
          onChange={event => setFile(event.target.files?.[0] || null)}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex min-h-24 w-full items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-center transition hover:border-amber-400 hover:bg-amber-50/40 dark:border-slate-700 dark:bg-slate-950/40 dark:hover:border-amber-700 dark:hover:bg-amber-950/10"
        >
          {saving ? (
            <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
          ) : (
            <div>
              <UploadCloud className="mx-auto h-5 w-5 text-slate-400" />
              <span className="mt-1.5 block text-xs font-bold text-slate-700 dark:text-slate-200">
                {file?.name || 'Pilih file PDF revisi baru'}
              </span>
              <span className="mt-0.5 block text-[10px] text-slate-400">
                {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Khusus format PDF (.pdf); maksimal 50 MB'}
              </span>
            </div>
          )}
        </button>
      </div>

      {/* Confirmation Checkbox */}
      <label className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50/60 p-3 cursor-pointer transition hover:bg-amber-50/30 dark:border-slate-800 dark:bg-slate-950/40 dark:hover:bg-amber-950/20">
        <div
          className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all ${
            confirmed
              ? 'border-amber-500 bg-amber-500 text-white shadow-xs'
              : 'border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900'
          }`}
        >
          {confirmed && <Check className="h-3 w-3 stroke-[3] text-white" />}
        </div>
        <input
          type="checkbox"
          checked={confirmed}
          onChange={event => setConfirmed(event.target.checked)}
          className="sr-only"
        />
        <span className="text-xs font-medium leading-relaxed text-slate-700 dark:text-slate-200">
          Saya mengonfirmasi ingin merevisi dokumen ini. Versi file akan diperbarui ke <strong className="font-bold text-amber-700 dark:text-amber-400">v{nextVersion}</strong> dan catatan revisi akan dicatat pada riwayat commit log.
        </span>
      </label>
    </DocumentModal>
  );
}
