'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  LayoutGrid, Plus, Search, Pencil, Trash2, ExternalLink,
  X, CheckCircle2, AlertCircle, Globe, Lock, Layers, ToggleLeft, ToggleRight, Loader2, ChevronDown
} from 'lucide-react';
import { ModalPortal } from '@/components/ui/ModalPortal';
import { SearchSelect } from '@/components/ui/SearchSelect';
import { api, ApiRequestError } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';
import { PrimaryButton, FilterDropdown } from '@/admin/master/components/shared';

// ─── Types ───────────────────────────────────────────────────────────────────
type AuthMode = 'sso' | 'independent';

interface Aplikasi {
  id: string;
  nama: string;
  url: string;
  icon: string;
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
  kategori?: string | null;
  urutan: number;
  isActive: boolean;
  createdAt: string;
}

const AUTH_MODES: AuthMode[] = ['sso', 'independent'];

const AUTH_BADGE: Record<AuthMode, string> = {
  sso: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border-emerald-500/20',
  independent: 'bg-indigo-500/10  text-indigo-600  dark:text-indigo-400  border-indigo-500/20',
};

type FormData = Omit<Aplikasi, 'id' | 'dibuat_pada'>;
const emptyForm: FormData = { nama: '', url: '', icon: '', auth_mode: 'sso', deskripsi: '', kategori: 'Lainnya', is_active: true, urutan: 1 };

// ─── Shared Input styles ──────────────────────────────────────────────────────
const inputCls = 'w-full rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0a0f1a] px-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10 transition-all duration-200';
const labelCls = 'mb-1.5 block text-[10px] font-black uppercase tracking-widest text-slate-555 dark:text-slate-400';

export default function ManajemenAplikasiPage() {
  const [apps, setApps] = useState<Aplikasi[]>([]);
  const [categories, setCategories] = useState<{ id: string; kode: string; label: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState<'Semua' | 'Aktif' | 'Non-Aktif'>('Semua');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterActive]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Aplikasi | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Aplikasi | null>(null);
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);



  const showToast = (type: 'ok' | 'err', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3200);
  };

  const fetchData = useCallback(async () => {
    try {
      const [appsRes, catRes] = await Promise.all([
        api.get<ApiAplikasi[]>('/apps?limit=200'),
        api.get<{ id: string; kode: string; label: string }[]>('/master/kategori-aplikasi'),
      ]);
      const mapped = (appsRes.data || []).map((app) => ({
        id: app.id,
        nama: app.nama,
        url: app.url,
        icon: app.icon || '',
        auth_mode: app.authMode,
        kategori: app.kategori || 'Lainnya',
        deskripsi: app.deskripsi || '',
        urutan: app.urutan,
        is_active: app.isActive,
        dibuat_pada: app.createdAt ? app.createdAt.slice(0, 10) : '-'
      }));
      setApps(mapped);
      setCategories(catRes.data || []);
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
      const matchSearch = a.nama.toLowerCase().includes(q) || a.url.toLowerCase().includes(q) || a.deskripsi.toLowerCase().includes(q);
      const matchStatus = filterActive === 'Semua' || (filterActive === 'Aktif' ? a.is_active : !a.is_active);
      return matchSearch && matchStatus;
    })
    .sort((a, b) => a.urutan - b.urutan);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginatedData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const openCreate = useCallback(() => {
    setEditTarget(null);
    setForm(emptyForm);
    setErrors({});
    setIconFile(null);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((app: Aplikasi) => {
    setEditTarget(app);
    setErrors({});
    setForm({
      nama: app.nama,
      url: app.url,
      icon: app.icon,
      auth_mode: app.auth_mode,
      deskripsi: app.deskripsi,
      kategori: app.kategori,
      is_active: app.is_active,
      urutan: app.urutan,
    });
    setIconFile(null);
    setModalOpen(true);
  }, []);
  
  const handleSave = useCallback(async () => {
    setErrors({});
    if (!form.nama.trim()) { setErrors(e => ({ ...e, nama: 'Nama aplikasi wajib diisi.' })); showToast('err', 'Nama aplikasi wajib diisi.'); return; }
    if (!form.url.trim()) { setErrors(e => ({ ...e, url: 'URL aplikasi wajib diisi.' })); showToast('err', 'URL aplikasi wajib diisi.'); return; }
    
    const finalKategori = form.kategori.trim();
    if (!finalKategori) { setErrors(e => ({ ...e, kategori: 'Kategori wajib diisi.' })); showToast('err', 'Kategori wajib diisi.'); return; }
    
    if (!form.deskripsi.trim()) { setErrors(e => ({ ...e, deskripsi: 'Deskripsi wajib diisi.' })); showToast('err', 'Deskripsi wajib diisi.'); return; }
    if (form.urutan <= 0) { setErrors(e => ({ ...e, urutan: 'Urutan tampil harus lebih dari 0.' })); showToast('err', 'Urutan tampil harus lebih dari 0.'); return; }
    setSaving(true);
    try {
      const payload = {
        nama: form.nama,
        url: form.url,
        authMode: form.auth_mode,
        icon: form.icon || null,
        kategori: finalKategori,
        deskripsi: form.deskripsi,
        urutan: form.urutan,
        isActive: form.is_active,
      };

      let appId = '';
      if (editTarget) {
        await api.put(`/apps/${editTarget.id}`, payload);
        appId = editTarget.id;
        showToast('ok', `"${form.nama}" berhasil diperbarui.`);
      } else {
        const res = await api.post<any>('/apps', payload);
        appId = res.data.id;
        showToast('ok', `"${form.nama}" berhasil ditambahkan.`);
      }

      // Icon upload if selected
      if (iconFile && appId) {
        const fd = new FormData();
        fd.append('icon', iconFile);
        const token = getAccessToken();
        const uploadRes = await fetch(`/api/apps/${appId}/icon`, {
          method: 'POST',
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
          body: fd,
        });
        if (!uploadRes.ok) {
          throw new Error('Gagal mengunggah icon aplikasi.');
        }
      }

      setModalOpen(false);
      fetchData();
    } catch (err) {
      if (err instanceof ApiRequestError && err.details) {
        const fieldErrors: Record<string, string> = {};
        err.details.forEach(d => {
          let fieldName = d.field;
          if (fieldName === 'authMode') fieldName = 'auth_mode';
          if (fieldName === 'isActive') fieldName = 'is_active';
          fieldErrors[fieldName] = d.message;
        });
        setErrors(fieldErrors);
        showToast('err', err.message || 'Gagal menyimpan.');
      } else {
        showToast('err', err instanceof Error ? err.message : 'Gagal menyimpan.');
      }
    } finally {
      setSaving(false);
    }
  }, [form, editTarget, iconFile, fetchData]);

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
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            Manajemen Aplikasi
          </h1>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Kelola aplikasi yang terintegrasi dengan Portal SSO PT INL.
          </p>
        </div>
        <PrimaryButton onClick={openCreate} className="w-full justify-center sm:w-auto">
          <Plus className="h-4 w-4" />
          Tambah Aplikasi
        </PrimaryButton>
      </div>

      {/* ── Stat Strip ────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 bg-white dark:bg-slate-900 px-5 py-4 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        {[
          { label: 'Total Aplikasi', value: apps.length,              icon: Layers,      color: 'text-amber-600 dark:text-amber-400'   },
          { label: 'Aktif',          value: totalActive,               icon: ToggleRight, color: 'text-emerald-650 dark:text-emerald-450' },
          { label: 'Nonaktif',       value: apps.length - totalActive, icon: ToggleLeft,  color: 'text-rose-650 dark:text-rose-455'    },
          { label: 'Pakai SSO',      value: apps.filter(a => a.auth_mode === 'sso').length, icon: Lock, color: 'text-indigo-650 dark:text-indigo-400' },
        ].map((s, i, arr) => {
          const Icon = s.icon;
          return (
            <React.Fragment key={s.label}>
              <div className="flex items-center gap-2">
                <Icon className={`h-4 w-4 shrink-0 ${s.color}`} />
                <span className="text-sm font-bold text-slate-800 dark:text-white">{s.value}</span>
                <span className="text-xs font-semibold text-slate-550 dark:text-slate-400">{s.label}</span>
              </div>
              {i < arr.length - 1 && <span className="h-4 w-px bg-slate-200 dark:bg-slate-850 shrink-0" />}
            </React.Fragment>
          );
        })}
      </div>

      {/* ── Table Card ────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">

        {/* Toolbar */}
        <div className="flex flex-col gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-855 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari nama, URL, atau deskripsi..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={`${inputCls} pl-10`}
            />
          </div>
          <FilterDropdown<'Semua' | 'Aktif' | 'Non-Aktif'>
            value={filterActive}
            onChange={setFilterActive}
            options={[
              { label: 'Semua Status', value: 'Semua' },
              { label: 'Aktif', value: 'Aktif' },
              { label: 'Non-Aktif', value: 'Non-Aktif' },
            ]}
          />
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
                  <tr><td colSpan={7} className="px-5 py-12 text-center text-sm font-semibold text-slate-455 dark:text-slate-500">Tidak ada aplikasi yang sesuai.</td></tr>
                ) : paginatedData.map(app => (
                  <tr key={app.id} className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors duration-150">
                    <td className="px-5 py-3.5 text-xs font-bold text-slate-450 dark:text-slate-600">{app.urutan}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {app.icon ? (
                          <img src={app.icon.startsWith('http') ? app.icon : `/uploads/${app.icon}`} alt={app.nama} className="h-8 w-8 rounded-lg object-contain shrink-0 border border-slate-100 dark:border-white/[0.08]" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                        ) : (
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20">
                            <LayoutGrid className="h-4 w-4 text-amber-500" />
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">{app.nama}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Globe className="h-3 w-3 text-slate-400 dark:text-slate-500 shrink-0" />
                            <a href={app.url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-slate-550 hover:text-amber-550 dark:hover:text-amber-400 transition-colors truncate max-w-[180px]">
                              {app.url}
                            </a>
                          </div>
                        </div>
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
        {/* Pagination Footer */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-5 py-4 border-t border-slate-100 dark:border-white/[0.04] bg-slate-50/50 dark:bg-white/[0.01] text-[11px] font-bold text-slate-550 dark:text-slate-400">
          <div>
            {filtered.length === 0 ? (
              <span>Menampilkan 0 entri</span>
            ) : (
              <span>
                Menampilkan {Math.min((currentPage - 1) * itemsPerPage + 1, filtered.length)} - {Math.min(currentPage * itemsPerPage, filtered.length)} dari {filtered.length} entri
                {filtered.length !== apps.length && ` (disaring dari ${apps.length} total)`}
              </span>
            )}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="rounded-lg border border-slate-200/80 dark:border-white/[0.06] bg-white dark:bg-[#0f1623] px-2.5 py-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-55 dark:hover:bg-white/[0.04] disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer focus:outline-none"
              >
                Sebelumnya
              </button>
              
              {/* Page Numbers */}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => {
                  return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;
                })
                .map((page, idx, arr) => {
                  const showEllipsis = idx > 0 && page - arr[idx - 1] > 1;
                  return (
                    <React.Fragment key={page}>
                      {showEllipsis && <span className="px-1 text-slate-400 dark:text-slate-600">...</span>}
                      <button
                        onClick={() => setCurrentPage(page)}
                        className={`rounded-lg px-2.5 py-1.5 text-[11px] font-black transition-all cursor-pointer focus:outline-none ${
                          currentPage === page
                            ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/20'
                            : 'border border-slate-200/80 dark:border-white/[0.06] bg-white dark:bg-[#0f1623] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04]'
                        }`}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  );
                })}

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="rounded-lg border border-slate-200/80 dark:border-white/[0.06] bg-white dark:bg-[#0f1623] px-2.5 py-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-55 dark:hover:bg-white/[0.04] disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer focus:outline-none"
              >
                Selanjutnya
              </button>
            </div>
          )}
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
                  <input type="text" value={form.nama} onChange={e => setForm(f => ({ ...f, nama: e.target.value }))} placeholder="cth: Google Workspace" className={`${inputCls} ${errors.nama ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/10 dark:border-rose-500/50' : ''}`} />
                  {errors.nama && <span className="text-[10px] text-rose-500 mt-1 block font-bold">{errors.nama}</span>}
                </div>
                <div>
                  <label className={labelCls}>URL Aplikasi *</label>
                  <input type="text" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="https://aplikasi.inl.co.id" className={`${inputCls} ${errors.url ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/10 dark:border-rose-500/50' : ''}`} />
                  {errors.url && <span className="text-[10px] text-rose-500 mt-1 block font-bold">{errors.url}</span>}
                </div>
                {/* Icon Upload */}
                <div className="space-y-2">
                  <label className={labelCls}>Icon Aplikasi (PNG/JPEG/GIF)</label>
                  <div className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 dark:border-white/[0.04] bg-slate-50/50 dark:bg-white/[0.01]">
                    <div className="shrink-0">
                      {iconFile ? (
                        <img
                          src={URL.createObjectURL(iconFile)}
                          alt="Preview"
                          className="h-14 w-14 rounded-xl object-contain border-2 border-amber-500"
                        />
                      ) : form.icon ? (
                        <img
                          src={form.icon.startsWith('http') ? form.icon : `/uploads/${form.icon}`}
                          alt="Current"
                          className="h-14 w-14 rounded-xl object-contain border border-slate-200 dark:border-white/[0.08]"
                        />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-bold text-xl">
                          <LayoutGrid className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setIconFile(file);
                        }}
                        className="w-full text-xs text-slate-555 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-amber-500/10 file:text-amber-600 dark:file:text-amber-400 hover:file:bg-amber-500/20 cursor-pointer"
                      />
                      <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">Format: PNG, JPG, GIF. Max 2MB.</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Auth Mode</label>
                    <SearchSelect
                      searchable={false}
                      options={[
                        { value: 'sso', label: 'SSO (Single Sign-On)' },
                        { value: 'independent', label: 'Independent / Local' }
                      ]}
                      value={form.auth_mode}
                      onChange={val => setForm(f => ({ ...f, auth_mode: val as AuthMode }))}
                      placeholder="- Pilih Auth Mode -"
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Kategori</label>
                    <SearchSelect
                      searchable={true}
                      options={categories.map(c => ({ value: c.label, label: c.label }))}
                      value={form.kategori}
                      onChange={val => setForm(f => ({ ...f, kategori: val }))}
                      placeholder="- Pilih Kategori -"
                    />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Urutan Tampil</label>
                  <input type="number" min={1} value={form.urutan} onChange={e => setForm(f => ({ ...f, urutan: parseInt(e.target.value) || 1 }))} className={`${inputCls} ${errors.urutan ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/10 dark:border-rose-500/50' : ''}`} />
                  {errors.urutan && <span className="text-[10px] text-rose-500 mt-1 block font-bold">{errors.urutan}</span>}
                </div>
                <div>
                  <label className={labelCls}>Deskripsi</label>
                  <textarea value={form.deskripsi} onChange={e => setForm(f => ({ ...f, deskripsi: e.target.value }))} placeholder="Deskripsi singkat fungsi aplikasi..." rows={3}
                    className={`${inputCls} resize-none ${errors.deskripsi ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/10 dark:border-rose-500/50' : ''}`} />
                  {errors.deskripsi && <span className="text-[10px] text-rose-500 mt-1 block font-bold">{errors.deskripsi}</span>}
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
                <PrimaryButton disabled={saving} onClick={handleSave} className="flex items-center gap-1.5">
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {editTarget ? 'Simpan Perubahan' : 'Tambahkan'}
                </PrimaryButton>
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
