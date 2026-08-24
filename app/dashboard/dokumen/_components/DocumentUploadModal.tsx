'use client';

import { useEffect, useRef, useState } from 'react';
import { FileUp, Loader2, UploadCloud } from 'lucide-react';
import { DocumentModal, LoadingButton, SecondaryButton, inputClass, labelClass } from './DocumentUi';
import type { DocumentCategory, UnitOption } from '../_lib/types';
import { errorMessage, uploadDocument } from '../_lib/document-api';

import { CustomCategorySelect } from './CustomCategorySelect';
import { UnitSelectSearch } from './UnitSelectSearch';

export function DocumentUploadModal({
  open,
  onClose,
  categories,
  units,
  onUploaded,
  onError,
  initialUnitId = '',
  initialFile = null,
}: {
  open: boolean;
  onClose: () => void;
  categories: DocumentCategory[];
  units: UnitOption[];
  onUploaded: () => void;
  onError: (message: string) => void;
  initialUnitId?: string;
  initialFile?: File | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ categoryId: '', title: '', description: '', ownerUnitId: '' });

  useEffect(() => {
    if (open) {
      if (initialFile) {
        setFile(initialFile);
        const autoTitle = initialFile.name.replace(/\.[^/.]+$/, '');
        setForm(current => ({ ...current, title: autoTitle, ownerUnitId: initialUnitId || current.ownerUnitId }));
      } else if (initialUnitId) {
        setForm(current => ({ ...current, ownerUnitId: initialUnitId }));
      }
    }
  }, [open, initialUnitId, initialFile]);

  const close = () => {
    if (saving) return;
    setFile(null);
    setForm({ categoryId: '', title: '', description: '', ownerUnitId: '' });
    onClose();
  };

  const submit = async () => {
    if (!file || !form.categoryId || !form.title.trim()) {
      onError('Kategori, judul, dan file dokumen wajib diisi.');
      return;
    }
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      onError('Format file dokumen wajib PDF (.pdf).');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      onError('Ukuran file maksimal 50 MB.');
      return;
    }
    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => data.append(key, value));
    data.append('file', file);
    setSaving(true);
    try {
      await uploadDocument(data);
      onUploaded();
      setFile(null);
      setForm({ categoryId: '', title: '', description: '', ownerUnitId: '' });
      onClose();
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
      title="Upload dokumen baru"
      description="File disimpan di storage privat. Format: Khusus PDF (.pdf); maksimal 50 MB."
      width="max-w-2xl"
      footer={<><SecondaryButton onClick={close} disabled={saving}>Batal</SecondaryButton><LoadingButton loading={saving} onClick={submit}><FileUp className="h-4 w-4" /> Upload Dokumen</LoadingButton></>}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <span className={labelClass}>Kategori *</span>
          <CustomCategorySelect
            value={form.categoryId}
            onChange={categoryId => setForm(current => ({ ...current, categoryId }))}
            categories={categories}
            placeholder="Pilih kategori"
          />
        </div>
        <div><span className={labelClass}>Unit Pemilik</span><UnitSelectSearch units={units} value={form.ownerUnitId} onChange={ownerUnitId => setForm(current => ({ ...current, ownerUnitId }))} emptyLabel="Tanpa unit khusus" /></div>
      </div>
      <label className="block mt-[2px]"><span className={labelClass}>Judul *</span><input className={inputClass} value={form.title} maxLength={300} onChange={event => setForm(current => ({ ...current, title: event.target.value }))} placeholder="Nama dokumen yang mudah dikenali" /></label>
      <label className="block mt-[2px]"><span className={labelClass}>Deskripsi</span><textarea className={`${inputClass} h-20 resize-none py-2`} value={form.description} maxLength={5000} onChange={event => setForm(current => ({ ...current, description: event.target.value }))} placeholder="Ringkasan isi atau kegunaan dokumen" /></label>

      <div>
        <span className={labelClass}>File Dokumen (PDF) *</span>
        <input ref={inputRef} type="file" className="hidden" accept=".pdf,application/pdf" onChange={event => setFile(event.target.files?.[0] || null)} />
        <button type="button" onClick={() => inputRef.current?.click()} className="flex min-h-24 w-full items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 px-5 py-4 text-center transition hover:border-amber-400 hover:bg-amber-50/40 dark:border-slate-700 dark:bg-slate-950/40 dark:hover:border-amber-700 dark:hover:bg-amber-950/10">
          {saving ? <Loader2 className="h-6 w-6 animate-spin text-amber-500" /> : <span><UploadCloud className="mx-auto h-5 w-5 text-slate-400" /><span className="mt-1 block text-xs font-bold text-slate-700 dark:text-slate-200">{file?.name || 'Pilih file PDF dari perangkat'}</span><span className="mt-0.5 block text-[11px] text-slate-500 dark:text-slate-400">{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Format khusus .pdf; Maksimal 50 MB'}</span></span>}
        </button>
      </div>
    </DocumentModal>
  );
}
