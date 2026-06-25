'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  LayoutGrid, Plus, Search, Pencil, Trash2, ExternalLink,
  X, CheckCircle2, AlertCircle, Globe, Lock, Layers, ToggleLeft, ToggleRight, Loader2, ChevronDown
} from 'lucide-react';
import { ModalPortal } from '@/components/ui/ModalPortal';
import { LiquidButton } from '@/components/animate-ui/components/buttons/liquid';
import { api } from '@/lib/api';

// ─── Types ───────────────────────────────────────────────────────────────────
type AuthMode = 'sso' | 'independent';

interface Aplikasi {
  id: string;
  nama: string;
  url: string;
  auth_mode: AuthMode;
  deskripsi: string;
  kategori: string;
  is_active: boolean;
  urutan: number;
  dibuat_pada: string;
}

interface ApiAplikasi {
  id: string;
  nama: string;
  url: string;
  authMode: AuthMode;
  icon: string | null;
  deskripsi: string | null;
  urutan: number;
  isActive: boolean;
  createdAt: string;
}

const AUTH_MODES: AuthMode[] = ['sso', 'independent'];
const KATEGORIS = ['Produktivitas', 'Komunikasi', 'Operasional', 'SDM', 'Media', 'Keuangan', 'Lainnya'];

const AUTH_BADGE: Record<AuthMode, string> = {
  sso: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border-emerald-500/20',
  independent: 'bg-indigo-500/10  text-indigo-600  dark:text-indigo-400  border-indigo-500/20',
};

type FormData = Omit<Aplikasi, 'id' | 'dibuat_pada'>;
const emptyForm: FormData = { nama: '', url: '', auth_mode: 'sso', deskripsi: '', kategori: 'Produktivitas', is_active: true, urutan: 1 };

// ─── Shared Input styles ──────────────────────────────────────────────────────
const inputCls = 'w-full rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0a0f1a] px-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10 transition-all duration-200';
const labelCls = 'mb-1.5 block text-[10px] font-black uppercase tracking-widest text-slate-550 dark:text-slate-400';

export default function ManajemenAplikasiPage() {
  const [apps, setApps] = useState<Aplikasi[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState<'Semua' | 'Aktif' | 'Non-Aktif'>('Semua');

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Aplikasi | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<Aplikasi | null>(null);
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const showToast = (type: 'ok' | 'err', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3200);
  };

  const fetchData = useCallback(async () => {
    try {
      const res = await api.get<ApiAplikasi[]>('/apps?limit=200');
      const mapped = (res.data || []).map((app) => ({
        id: app.id,
        nama: app.nama,
        url: app.url,
        auth_mode: app.authMode,
        kategori: app.icon || 'Lainnya',
        deskripsi: app.deskripsi || '',
        urutan: app.urutan,
        is_active: app.isActive,
        dibuat_pada: app.createdAt ? app.createdAt.slice(0, 10) : '-'
      }));
      setApps(mapped);
    } catch (err) {
      showToast('err', err instanceof Error ? err.message : 'Gagal memuat data aplikasi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = apps
    .filter(a => {
      const q = search.toLowerCase();
      const matchSearch = a.nama.toLowerCase().includes(q) || a.kategori.toLowerCase().includes(q) || a.url.toLowerCase().includes(q);
      const matchStatus = filterActive === 'Semua' || (filterActive === 'Aktif' ? a.is_active : !a.is_active);
      return matchSearch && matchStatus;
    })
    .sort((a, b) => a.urutan - b.urutan);

  const openCreate = useCallback(() => { setEditTarget(null); setForm(emptyForm); setModalOpen(true); }, []);
  const openEdit   = useCallback((app: Aplikasi) => { setEditTarget(app); setForm({ nama: app.nama, url: app.url, auth_mode: app.auth_mode, deskripsi: app.deskripsi, kategori: app.kategori, is_active: app.is_active, urutan: app.urutan }); setModalOpen(true); }, []);
  
  const handleSave = useCallback(async () => {
    if (!form.nama.trim()) { showToast('err', 'Nama aplikasi wajib diisi.'); return; }
    if (!form.url.trim()) { showToast('err', 'URL aplikasi wajib diisi.'); return; }
    if (!form.kategori.trim()) { showToast('err', 'Kategori wajib diisi.'); return; }
    if (!form.deskripsi.trim()) { showToast('err', 'Deskripsi wajib diisi.'); return; }
    if (form.urutan <= 0) { showToast('err', 'Urutan tampil harus lebih dari 0.'); return; }
    setSaving(true);
    try {
      const payload = {
        nama: form.nama,
        url: form.url,
        authMode: form.auth_mode,
        icon: form.kategori,
        deskripsi: form.deskripsi,
        urutan: form.urutan,
        isActive: form.is_active
      };

      if (editTarget) {
        await api.put(`/apps/${editTarget.id}`, payload);
        showToast('ok', `"${form.nama}" berhasil diperbarui.`);
      } else {
        await api.post('/apps', payload);
        showToast('ok', `"${form.nama}" berhasil ditambahkan.`);
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      showToast('err', err instanceof Error ? err.message : 'Gagal menyimpan.');
    } finally {
      setSaving(false);
    }
  }, [form, editTarget, fetchData]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/apps/${deleteTarget.id}`);
      showToast('ok', `"${deleteTarget.nama}" dihapus dari portal.`);
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      showToast('err', err instanceof Error ? err.message : 'Gagal menghapus.');
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, fetchData]);

  const toggleActive = useCallback(async (app: Aplikasi) => {
    try {
      await api.put(`/apps/${app.id}`, { isActive: !app.is_active });
      showToast('ok', `Status "${app.nama}" diperbarui.`);
      fetchData();
    } catch (err) {
      showToast('err', err instanceof Error ? app instanceof Error ? app.message : 'Gagal' : 'Gagal memperbarui status.');
    }
  }, [fetchData]);

  const totalActive = apps.filter(a => a.is_active).length;

  return (
    <div className="space-y-6">

      {/* ── Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[99999] flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-semibold shadow-2xl backdrop-blur-xl animate-fade-up ${
          toast.type === 'ok'
            ? 'bg-[#0f1a10]/95 border-emerald-500/30 text-emerald-300'
            : 'bg-[#1a0f10]/95 border-rose-500/30    text-rose-300'
        }`}>
          {toast.type === 'ok' ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" /> : <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />}
          {toast.text}
        </div>
      )}

      {/* ── Page Header ───────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2.5">
            <LayoutGrid className="h-6 w-6 text-amber-550 dark:text-amber-400" />
            Manajemen Aplikasi
          </h1>
          <p className="mt-1 text-sm font-semibold text-slate-550 dark:text-slate-400">
            Kelola aplikasi yang terintegrasi dengan Portal SSO PT INL.
          </p>
        </div>
        <LiquidButton variant="outline" size="sm" onClick={openCreate} className="cursor-pointer flex items-center gap-2 font-bold">
          <Plus className="h-4 w-4" />
          Tambah Aplikasi
        </LiquidButton>
      </div>

      {/* ── Stat Strip — flat inline, no cards ─────────────────────── */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        {[
          { label: 'Total Aplikasi', value: apps.length,              icon: Layers,      color: 'text-amber-500 dark:text-amber-400'   },
          { label: 'Aktif',          value: totalActive,               icon: ToggleRight, color: 'text-emerald-500 dark:text-emerald-450' },
          { label: 'Nonaktif',       value: apps.length - totalActive, icon: ToggleLeft,  color: 'text-rose-500 dark:text-rose-400'    },
          { label: 'Pakai SSO',      value: apps.filter(a => a.auth_mode === 'sso').length, icon: Lock, color: 'text-indigo-500 dark:text-indigo-400' },
        ].map((s, i, arr) => {
          const Icon = s.icon;
          return (
            <React.Fragment key={s.label}>
              <div className="flex items-center gap-2">
                <Icon className={`h-4 w-4 shrink-0 ${s.color}`} />
                <span className={`text-sm font-black ${s.color}`}>{s.value}</span>
                <span className="text-xs font-bold text-slate-500">{s.label}</span>
              </div>
              {i < arr.length - 1 && <span className="h-3.5 w-px bg-slate-200 dark:bg-white/[0.1] shrink-0" />}
            </React.Fragment>
          );
        })}
      </div>

      {/* ── Table Card ────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-white/[0.06] bg-white dark:bg-[#0f1623] shadow-lg">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />

        {/* Toolbar */}
        <div className="flex flex-col gap-3 px-5 py-4 border-b border-slate-100 dark:border-white/[0.06] sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari nama, kategori, atau URL..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={`${inputCls} pl-10`}
            />
          </div>
          <div className="flex items-center gap-1.5">
            {(['Semua', 'Aktif', 'Non-Aktif'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilterActive(f)}
                className={`rounded-lg px-3 py-1.5 text-[11px] font-black uppercase tracking-wide transition-all duration-150 cursor-pointer focus:outline-none ${
                  filterActive === f
                    ? 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 dark:border-amber-500/30'
                    : 'text-slate-550 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 border border-transparent'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20 gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-amber-550" />
              <span className="text-sm font-semibold text-slate-400">Memuat data aplikasi...</span>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-white/[0.04]">
                  {['#', 'Aplikasi', 'Kategori', 'Auth Mode', 'Dibuat', 'Status', 'Aksi'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 last:text-right">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.03]">
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="px-5 py-12 text-center text-sm font-semibold text-slate-450 dark:text-slate-500">Tidak ada aplikasi yang sesuai.</td></tr>
                ) : filtered.map(app => (
                  <tr key={app.id} className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors duration-150">
                    <td className="px-5 py-3.5 text-xs font-bold text-slate-450 dark:text-slate-600">{app.urutan}</td>
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">{app.nama}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Globe className="h-3 w-3 text-slate-400 dark:text-slate-500 shrink-0" />
                        <a href={app.url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-slate-550 hover:text-amber-550 dark:hover:text-amber-400 transition-colors truncate max-w-[180px]">
                          {app.url}
                        </a>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="rounded-lg bg-slate-100 dark:bg-white/[0.06] px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:text-slate-400">{app.kategori}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide ${AUTH_BADGE[app.auth_mode]}`}>
                        {app.auth_mode === 'sso' ? 'SSO' : 'Independent'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs font-bold text-slate-500">
                      {app.dibuat_pada !== '-' ? new Date(app.dibuat_pada).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => toggleActive(app)}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide transition-all duration-200 cursor-pointer focus:outline-none ${
                          app.is_active
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border-emerald-500/20 hover:bg-emerald-500/20'
                            : 'bg-slate-100 dark:bg-white/[0.04] text-slate-500 border-slate-200 dark:border-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.08]'
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${app.is_active ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-slate-500'}`} />
                        {app.is_active ? 'Aktif' : 'Nonaktif'}
                      </button>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <a href={app.url} target="_blank" rel="noopener noreferrer"
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:text-slate-800 dark:hover:text-slate-350 transition-all">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                        <button onClick={() => openEdit(app)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:bg-amber-500/10 hover:text-amber-500 transition-all cursor-pointer focus:outline-none">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => setDeleteTarget(app)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:bg-rose-500/10 hover:text-rose-500 transition-all cursor-pointer focus:outline-none">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="px-5 py-3 border-t border-slate-100 dark:border-white/[0.04] text-[11px] font-bold text-slate-455 dark:text-slate-500">
          {filtered.length} dari {apps.length} aplikasi
        </div>
      </div>

      {/* ── Create / Edit Modal — via Portal */}
      <ModalPortal open={modalOpen}>
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
          onClick={() => setModalOpen(false)}
        />
        {/* Panel */}
        <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
          <div className="pointer-events-auto w-full max-w-lg animate-fade-up">
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0d1218] shadow-2xl">
              {/* Top accent */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-150 dark:border-white/[0.06]">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20">
                    {editTarget ? <Pencil className="h-4 w-4 text-amber-550 dark:text-amber-455" /> : <Plus className="h-4 w-4 text-amber-550 dark:text-amber-455" />}
                  </div>
                  <h2 className="text-sm font-black text-slate-800 dark:text-slate-100">
                    {editTarget ? 'Edit Aplikasi' : 'Tambah Aplikasi Baru'}
                  </h2>
                </div>
                <button onClick={() => setModalOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-455 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:text-slate-700 dark:hover:text-slate-350 transition-all cursor-pointer focus:outline-none">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Body */}
              <div className="px-5 py-5 space-y-4 max-h-[65vh] overflow-y-auto hide-scrollbar">
                <div>
                  <label className={labelCls}>Nama Aplikasi *</label>
                  <input type="text" value={form.nama} onChange={e => setForm(f => ({ ...f, nama: e.target.value }))} placeholder="cth: Google Workspace" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>URL Aplikasi *</label>
                  <input type="text" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="https://aplikasi.inl.co.id" className={inputCls} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Auth Mode</label>
                    <div className="relative">
                      <select value={form.auth_mode} onChange={e => setForm(f => ({ ...f, auth_mode: e.target.value as AuthMode }))}
                        className={`${inputCls} appearance-none pr-10 cursor-pointer`}>
                        {AUTH_MODES.map(m => (
                          <option key={m} value={m} className="bg-white dark:bg-[#0d1218] text-slate-800 dark:text-slate-100">
                            {m === 'sso' ? 'SSO (Single Sign-On)' : 'Independent / Local'}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Kategori</label>
                    <div className="relative">
                      <select value={form.kategori} onChange={e => setForm(f => ({ ...f, kategori: e.target.value }))}
                        className={`${inputCls} appearance-none pr-10 cursor-pointer`}>
                        {KATEGORIS.map(k => <option key={k} value={k} className="bg-white dark:bg-[#0d1218] text-slate-800 dark:text-slate-100">{k}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Urutan Tampil</label>
                  <input type="number" min={1} value={form.urutan} onChange={e => setForm(f => ({ ...f, urutan: parseInt(e.target.value) || 1 }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Deskripsi</label>
                  <textarea value={form.deskripsi} onChange={e => setForm(f => ({ ...f, deskripsi: e.target.value }))} placeholder="Deskripsi singkat fungsi aplikasi..." rows={3}
                    className={`${inputCls} resize-none`} />
                </div>
                {/* Toggle status */}
                <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.03] px-4 py-3">
                  <div>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Status Aplikasi</p>
                    <p className="text-[11px] text-slate-550 mt-0.5">Aplikasi {form.is_active ? 'terlihat di' : 'disembunyikan dari'} portal karyawan</p>
                  </div>
                  <button type="button" onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                    className={`relative flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200 cursor-pointer focus:outline-none ${form.is_active ? 'bg-amber-500' : 'bg-slate-250 dark:bg-white/[0.1]'}`}>
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all duration-200 ${form.is_active ? 'left-5' : 'left-0.5'}`} />
                  </button>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 border-t border-slate-150 dark:border-white/[0.06] px-5 py-4">
                <button disabled={saving} onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-slate-250 dark:border-white/[0.08] px-4 py-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04] hover:text-slate-700 dark:hover:text-slate-200 transition-all cursor-pointer focus:outline-none">
                  Batal
                </button>
                <LiquidButton disabled={saving} variant="outline" size="sm" onClick={handleSave} className="cursor-pointer font-bold flex items-center gap-1.5">
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-550" />}
                  {editTarget ? 'Simpan Perubahan' : 'Tambahkan'}
                </LiquidButton>
              </div>
            </div>
          </div>
        </div>
      </ModalPortal>

      {/* ── Delete Confirm Modal — via Portal */}
      <ModalPortal open={!!deleteTarget}>
        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
        <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
          <div className="pointer-events-auto w-full max-w-sm animate-fade-up">
            <div className="relative overflow-hidden rounded-2xl border border-rose-500/20 bg-white dark:bg-[#0d1218] shadow-2xl p-6 text-center">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rose-500/50 to-transparent" />
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20">
                <Trash2 className="h-6 w-6 text-rose-500 dark:text-rose-455" />
              </div>
              <h3 className="text-base font-black text-slate-800 dark:text-slate-100">Hapus Aplikasi?</h3>
              <p className="mt-2 text-sm text-slate-550 dark:text-slate-400 font-bold leading-relaxed">
                Aplikasi <span className="font-extrabold text-slate-800 dark:text-slate-200">&quot;{deleteTarget?.nama}&quot;</span> akan dihapus permanen dari Portal SSO.
              </p>
              <div className="mt-5 flex gap-3">
                <button disabled={deleting} onClick={() => setDeleteTarget(null)}
                  className="flex-1 rounded-xl border border-slate-250 dark:border-white/[0.08] px-4 py-2.5 text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04] hover:text-slate-700 dark:hover:text-slate-200 transition-all cursor-pointer focus:outline-none">
                  Batal
                </button>
                <button disabled={deleting} onClick={handleDelete}
                  className="flex-1 rounded-xl bg-rose-500/90 hover:bg-rose-500 px-4 py-2.5 text-sm font-bold text-white transition-all shadow-lg shadow-rose-500/20 flex items-center justify-center gap-1.5 focus:outline-none">
                  {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />}
                  {deleting ? 'Menghapus...' : 'Hapus Sekarang'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </ModalPortal>

    </div>
  );
}
