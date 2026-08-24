'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Loader2,
  Palette,
  RotateCcw,
  Save,
  Type,
} from 'lucide-react';
import { ModalPortal } from '@/components/ui/ModalPortal';
import { api } from '@/lib/api';
import {
  cachePortalBranding,
  type PortalBranding,
  usePortalBranding,
} from '@/lib/portal-branding';

type BrandingField = {
  key: keyof PortalBranding;
  label: string;
  helper: string;
  placement: string;
  maxLength: number;
  multiline?: boolean;
};

const fields: BrandingField[] = [
  {
    key: 'portalName',
    label: 'Nama utama portal',
    helper: 'Nama yang tampil sebagai judul utama pada halaman login.',
    placement: 'Halaman Login',
    maxLength: 120,
  },
  {
    key: 'adminPanelName',
    label: 'Nama Admin Panel',
    helper: 'Label identitas yang tampil di bawah nama perusahaan pada sidebar admin.',
    placement: 'Sidebar Admin',
    maxLength: 100,
  },
  {
    key: 'adminHeroTitle',
    label: 'Judul dashboard admin',
    helper: 'Headline utama yang menyambut administrator setelah masuk.',
    placement: 'Dashboard Admin',
    maxLength: 160,
  },
  {
    key: 'adminHeroDescription',
    label: 'Deskripsi dashboard admin',
    helper: 'Penjelasan singkat mengenai fungsi dan cakupan portal.',
    placement: 'Dashboard Admin',
    maxLength: 700,
    multiline: true,
  },
];

export default function PortalBrandingSettingsPage() {
  const { branding, isLoading } = usePortalBranding();
  const [form, setForm] = useState<PortalBranding>(branding);
  const [isSaving, setIsSaving] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    setForm(branding);
  }, [branding]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 4500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!restoreConfirmOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isRestoring) setRestoreConfirmOpen(false);
    };

    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isRestoring, restoreConfirmOpen]);

  const isDirty = useMemo(
    () => fields.some(field => form[field.key] !== branding[field.key]),
    [branding, form],
  );

  const isValid = useMemo(
    () => fields.every(field => form[field.key].trim().length > 0),
    [form],
  );

  const updateField = (key: keyof PortalBranding, value: string) => {
    setForm(current => ({ ...current, [key]: value }));
  };

  const saveChanges = async () => {
    if (!isValid || !isDirty) return;
    setIsSaving(true);
    setNotice(null);

    try {
      const response = await api.put<PortalBranding>('/settings/branding', form);
      cachePortalBranding(response.data);
      setNotice({ type: 'success', message: 'Identitas portal berhasil diperbarui.' });
    } catch (error) {
      setNotice({
        type: 'error',
        message: error instanceof Error ? error.message : 'Identitas portal gagal diperbarui.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const restoreDefaults = async () => {
    setIsRestoring(true);
    setNotice(null);

    try {
      const response = await api.post<PortalBranding>('/settings/branding/restore', {});
      cachePortalBranding(response.data);
      setRestoreConfirmOpen(false);
      setNotice({ type: 'success', message: 'Identitas portal telah dikembalikan ke default.' });
    } catch (error) {
      setNotice({
        type: 'error',
        message: error instanceof Error ? error.message : 'Pengaturan default gagal dipulihkan.',
      });
    } finally {
      setIsRestoring(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
          Memuat identitas portal...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">
      <section className="rounded-xl border border-slate-200 bg-white px-5 py-5 dark:border-slate-800 dark:bg-slate-900 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-amber-700 dark:text-amber-400">
              <Palette className="h-3.5 w-3.5" />
              Pengaturan Portal
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">
              Identitas & Penamaan Portal
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400">
              Kelola teks utama yang menjadi identitas InTes. Perubahan diterapkan pada pengalaman login dan area administrasi.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
            <button
              type="button"
              onClick={() => setRestoreConfirmOpen(true)}
              disabled={isSaving || isRestoring}
              className="inline-flex h-10 w-full sm:w-auto items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-xs font-extrabold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800 cursor-pointer"
            >
              {isRestoring ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
              Restore to Default
            </button>
            <button
              type="button"
              onClick={saveChanges}
              disabled={!isDirty || !isValid || isSaving || isRestoring}
              className="inline-flex h-10 w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-xs font-extrabold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400 cursor-pointer"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Simpan Perubahan
            </button>
          </div>
        </div>
      </section>

      {notice && (
        <div
          role="status"
          className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm font-semibold ${
            notice.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300'
              : 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300'
          }`}
        >
          {notice.type === 'success' ? (
            <CheckCircle2 className="mt-0.5 h-4.5 w-4.5 shrink-0" />
          ) : (
            <AlertCircle className="mt-0.5 h-4.5 w-4.5 shrink-0" />
          )}
          {notice.message}
        </div>
      )}

      <div>
        <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <Type className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <div>
                <h2 className="text-sm font-black text-slate-900 dark:text-white">Teks identitas</h2>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Semua field wajib diisi.</p>
              </div>
            </div>
            {isDirty && (
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                Belum disimpan
              </span>
            )}
          </div>

          <div className="space-y-5">
            {fields.map(field => {
              const value = form[field.key];
              const sharedClassName =
                'w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-500/10 dark:border-slate-700 dark:bg-slate-950/60 dark:text-white dark:focus:border-amber-500 dark:focus:bg-slate-950';

              return (
                <div key={field.key}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <label htmlFor={field.key} className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                      {field.label}
                    </label>
                    <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                      {field.placement}
                    </span>
                  </div>

                  {field.multiline ? (
                    <textarea
                      id={field.key}
                      value={value}
                      maxLength={field.maxLength}
                      rows={5}
                      onChange={event => updateField(field.key, event.target.value)}
                      className={`${sharedClassName} resize-y leading-relaxed`}
                    />
                  ) : (
                    <input
                      id={field.key}
                      type="text"
                      value={value}
                      maxLength={field.maxLength}
                      onChange={event => updateField(field.key, event.target.value)}
                      className={sharedClassName}
                    />
                  )}

                  <div className="mt-1.5 flex items-start justify-between gap-3">
                    <p className="text-[11px] font-medium leading-relaxed text-slate-500 dark:text-slate-400">
                      {field.helper}
                    </p>
                    <span className="shrink-0 text-[10px] font-bold tabular-nums text-slate-400">
                      {value.length}/{field.maxLength}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 border-t border-slate-100 pt-4 dark:border-slate-800">
            <div className="flex items-start gap-3">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="text-xs font-black text-slate-800 dark:text-slate-200">Pengaturan bawaan tetap tersedia</p>
                <p className="mt-1 text-[11px] font-medium leading-relaxed text-slate-500 dark:text-slate-400">
                  Gunakan Restore to Default untuk mengembalikan seluruh teks ke identitas resmi InTes.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <ModalPortal open={restoreConfirmOpen}>
        <div
          className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px]"
          onClick={() => {
            if (!isRestoring) setRestoreConfirmOpen(false);
          }}
        />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="restore-branding-title"
            aria-describedby="restore-branding-description"
            className="pointer-events-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
          >
            <RotateCcw className="h-7 w-7 text-amber-600 dark:text-amber-400" />
            <h2
              id="restore-branding-title"
              className="mt-4 text-lg font-black tracking-tight text-slate-950 dark:text-white"
            >
              Kembalikan pengaturan awal?
            </h2>
            <p
              id="restore-branding-description"
              className="mt-2 text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400"
            >
              Nama portal, judul Admin Panel, dan deskripsi dashboard akan diganti dengan teks bawaan InTes.
            </p>
            <p className="mt-4 border-l-2 border-amber-500 pl-3 text-xs font-semibold leading-relaxed text-slate-600 dark:text-slate-300">
              Perubahan kustom yang saat ini tersimpan akan diganti.
            </p>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRestoreConfirmOpen(false)}
                disabled={isRestoring}
                className="h-10 rounded-lg border border-slate-300 px-4 text-xs font-extrabold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={restoreDefaults}
                disabled={isRestoring}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-amber-500 px-4 text-xs font-extrabold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isRestoring ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                {isRestoring ? 'Memulihkan...' : 'Ya, kembalikan'}
              </button>
            </div>
          </section>
        </div>
      </ModalPortal>
    </div>
  );
}
