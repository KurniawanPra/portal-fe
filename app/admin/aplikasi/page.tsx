'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  LayoutGrid, Plus, Search, Pencil, Trash2, ExternalLink,
  X, Globe, Lock, Layers, ToggleLeft, ToggleRight, Loader2, ChevronDown,
  ShieldCheck, UserCheck, UserPlus, Users, Building, UserX
} from 'lucide-react';
import { ModalPortal } from '@/components/ui/ModalPortal';
import { SearchSelect, SearchSelectOption } from '@/components/ui/SearchSelect';
import { api, ApiRequestError } from '@/lib/api';
import { PrimaryButton, FilterDropdown, SecondaryButton, DangerButton, Toast, SearchInput, CrudTable, TableActions } from '@/admin/master/components/shared';
import { resolveImageUrl } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────
type AuthMode = 'sso' | 'independent';
type AccessMode = 'all_employees' | 'all_except' | 'specific_only' | 'by_unit';

interface Aplikasi {
  id: string;
  nama: string;
  url: string;
  icon: string;
  auth_mode: AuthMode;
  access_mode: AccessMode;
  target_unit_ids: string[];
  deskripsi: string;
  kategori: string;
  is_active: boolean;
  urutan: number;
  warna: string;
  dibuat_pada: string;
}

interface ApiAplikasi {
  id: string;
  nama: string;
  url: string;
  authMode: AuthMode;
  accessMode?: AccessMode;
  targetUnitIds?: string | null;
  icon: string | null;
  deskripsi: string | null;
  kategori?: string | null;
  urutan: number;
  warna?: string | null;
  isActive: boolean;
  createdAt: string;
}

const AUTH_MODES: AuthMode[] = ['sso', 'independent'];

const AUTH_BADGE: Record<AuthMode, string> = {
  sso: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border-emerald-500/20',
  independent: 'bg-indigo-500/10  text-indigo-600  dark:text-indigo-400  border-indigo-500/20',
};

type FormData = Omit<Aplikasi, 'id' | 'dibuat_pada'>;
const emptyForm: FormData = { nama: '', url: '', icon: '', auth_mode: 'sso', access_mode: 'all_employees', target_unit_ids: [], deskripsi: '', kategori: 'Lainnya', is_active: true, urutan: 1, warna: '#D97706' };

// ─── Shared Input styles ──────────────────────────────────────────────────────
const inputCls = 'w-full rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0a0f1a] px-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-555 outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10 transition-all duration-200';
const labelCls = 'mb-1.5 block text-[10px] font-black uppercase tracking-widest text-slate-555 dark:text-slate-400';

function normalizeAppUrl(url: string) {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  if (/^[a-z][a-z\d+\-.]*:\/\//i.test(trimmed) || trimmed.startsWith('/')) return trimmed;
  return `https://${trimmed}`;
}

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

interface AppUserAccessItem {
  id: string;
  userId: string;
  appId: string;
  grantedAt: string;
  email: string;
  role: string;
  employeeNama?: string | null;
  employeeNrk?: string | null;
  jabatan?: string | null;
  unitNama?: string | null;
}

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Aplikasi | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Aplikasi | null>(null);
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

interface AccessSummary {
  appId: string;
  accessMode: AccessMode;
  targetUnitIds: string[];
  totalEmployees: number;
  customAccessCount: number;
  estimatedAllowed: number;
  percentage: number;
}

  // App User Access Modal state
  const [accessModalOpen, setAccessModalOpen] = useState(false);
  const [accessTargetApp, setAccessTargetApp] = useState<Aplikasi | null>(null);
  const [accessList, setAccessList] = useState<AppUserAccessItem[]>([]);
  const [accessLoading, setAccessLoading] = useState(false);
  const [allUserOptions, setAllUserOptions] = useState<SearchSelectOption[]>([]);
  const [selectedUserToAdd, setSelectedUserToAdd] = useState('');
  const [granting, setGranting] = useState(false);
  const [revokingUserId, setRevokingUserId] = useState<string | null>(null);

  // Access control states
  const [currentAccessMode, setCurrentAccessMode] = useState<AccessMode>('all_employees');
  const [accessSummary, setAccessSummary] = useState<AccessSummary | null>(null);
  const [unitList, setUnitList] = useState<{ id: string; nama: string; kode?: string }[]>([]);
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([]);
  const [selectedUnitToAdd, setSelectedUnitToAdd] = useState('');
  const [updatingMode, setUpdatingMode] = useState(false);

  const showToast = (type: 'ok' | 'err', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3200);
  };

  const openAccessModal = async (app: Aplikasi) => {
    setAccessTargetApp(app);
    setCurrentAccessMode(app.access_mode || 'all_employees');
    setSelectedUnitIds(app.target_unit_ids || []);
    setAccessModalOpen(true);
    setAccessLoading(true);
    setSelectedUserToAdd('');
    try {
      const [accessRes, usersRes, summaryRes, unitsRes] = await Promise.all([
        api.get<AppUserAccessItem[]>(`/apps/${app.id}/user-access`),
        api.get<any>('/users?limit=500'),
        api.get<AccessSummary>(`/apps/${app.id}/access-summary`),
        api.get<any>('/sso/master/units').catch(() => api.get<any>('/org/unit?limit=200')),
      ]);
      setAccessList(accessRes.data || []);
      setAccessSummary(summaryRes.data || null);

      const usersData = Array.isArray(usersRes.data) ? usersRes.data : (usersRes.data as any)?.rows || [];
      const options: SearchSelectOption[] = usersData.map((u: any) => ({
        value: u.id,
        label: u.employeeNama || u.email,
        subLabel: `${u.email}${u.jabatan ? ` · ${u.jabatan}` : ''}`
      }));
      setAllUserOptions(options);

      const unitsData = Array.isArray(unitsRes.data) ? unitsRes.data : (unitsRes.data as any)?.rows || [];
      setUnitList(unitsData.map((u: any) => ({ id: u.id, nama: u.nama, kode: u.kode })));
    } catch (err: any) {
      showToast('err', err?.message || 'Gagal memuat daftar hak akses pengguna');
    } finally {
      setAccessLoading(false);
    }
  };

  const handleSaveAccessMode = async (newMode: AccessMode, unitIds?: string[]) => {
    if (!accessTargetApp) return;
    setUpdatingMode(true);
    const targetUnits = unitIds !== undefined ? unitIds : selectedUnitIds;
    try {
      await api.put(`/apps/${accessTargetApp.id}/access-mode`, {
        accessMode: newMode,
        targetUnitIds: targetUnits,
      });
      setCurrentAccessMode(newMode);
      showToast('ok', `Mode akses berhasil diubah`);
      // Reload summary
      const summaryRes = await api.get<AccessSummary>(`/apps/${accessTargetApp.id}/access-summary`);
      setAccessSummary(summaryRes.data || null);
      fetchData();
    } catch (err: any) {
      showToast('err', err?.message || 'Gagal mengubah mode akses');
    } finally {
      setUpdatingMode(false);
    }
  };

  const handleGrantAccess = async () => {
    if (!selectedUserToAdd || !accessTargetApp) return;
    setGranting(true);
    try {
      await api.post(`/apps/${accessTargetApp.id}/user-access`, { userIds: [selectedUserToAdd] });
      showToast('ok', 'Pengguna berhasil ditambahkan ke daftar');
      setSelectedUserToAdd('');
      // Reload access list & summary
      const [accessRes, summaryRes] = await Promise.all([
        api.get<AppUserAccessItem[]>(`/apps/${accessTargetApp.id}/user-access`),
        api.get<AccessSummary>(`/apps/${accessTargetApp.id}/access-summary`),
      ]);
      setAccessList(accessRes.data || []);
      setAccessSummary(summaryRes.data || null);
    } catch (err: any) {
      showToast('err', err?.message || 'Gagal menambahkan pengguna');
    } finally {
      setGranting(false);
    }
  };

  const handleRevokeAccess = async (userId: string) => {
    if (!accessTargetApp) return;
    setRevokingUserId(userId);
    try {
      await api.delete(`/apps/${accessTargetApp.id}/user-access/${userId}`);
      showToast('ok', 'Pengguna berhasil dihapus dari daftar');
      setAccessList(prev => prev.filter(a => a.userId !== userId));
      // Reload summary
      const summaryRes = await api.get<AccessSummary>(`/apps/${accessTargetApp.id}/access-summary`);
      setAccessSummary(summaryRes.data || null);
    } catch (err: any) {
      showToast('err', err?.message || 'Gagal menghapus pengguna');
    } finally {
      setRevokingUserId(null);
    }
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
        access_mode: app.accessMode || 'all_employees',
        target_unit_ids: app.targetUnitIds ? app.targetUnitIds.split(',') : [],
        kategori: app.kategori || 'Lainnya',
        deskripsi: app.deskripsi || '',
        urutan: app.urutan,
        warna: app.warna || '#D97706',
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
      access_mode: app.access_mode || 'all_employees',
      target_unit_ids: app.target_unit_ids || [],
      deskripsi: app.deskripsi,
      kategori: app.kategori,
      is_active: app.is_active,
      urutan: app.urutan,
      warna: app.warna || '#D97706',
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
    if (!/^#[0-9a-fA-F]{6}$/.test(form.warna)) { setErrors(e => ({ ...e, warna: 'Gunakan format warna hex, misalnya #D97706.' })); showToast('err', 'Format warna aplikasi belum valid.'); return; }
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
        warna: form.warna,
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
        // Lewat api.post: auto-refresh 401 + proxy /api, bukan fetch mentah.
        await api.post(`/apps/${appId}/icon`, fd);
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
      showToast('err', err instanceof Error ? err.message : 'Gagal memperbarui status.');
    }
  }, [fetchData]);

  const totalActive = apps.filter(a => a.is_active).length;

  return (
    <div className="space-y-6">

      {/* ── Toast */}
      <Toast toast={toast} />

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
      <div className="grid grid-cols-2 gap-3 sm:gap-x-6 sm:gap-y-2 sm:flex sm:items-center w-full bg-white dark:bg-slate-900 px-5 py-4 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        {[
          { label: 'Total Aplikasi', value: apps.length,              icon: Layers,      color: 'text-amber-600 dark:text-amber-400'   },
          { label: 'Aktif',          value: totalActive,               icon: ToggleRight, color: 'text-emerald-650 dark:text-emerald-450' },
          { label: 'Nonaktif',       value: apps.length - totalActive, icon: ToggleLeft,  color: 'text-rose-650 dark:text-rose-455'    },
          { label: 'Pakai SSO',      value: apps.filter(a => a.auth_mode === 'sso').length, icon: Lock, color: 'text-indigo-650 dark:text-indigo-400' },
        ].map((s, i, arr) => {
          const Icon = s.icon;
          return (
            <React.Fragment key={s.label}>
              <div className="flex items-center justify-center sm:justify-start gap-2 min-w-0">
                <Icon className={`h-4 w-4 shrink-0 ${s.color}`} />
                <span className="text-sm font-bold text-slate-800 dark:text-white">{s.value}</span>
                <span className="text-xs font-semibold text-slate-550 dark:text-slate-400">{s.label}</span>
              </div>
              {i < arr.length - 1 && <span className="hidden sm:block h-4 w-px bg-slate-200 dark:bg-slate-850 shrink-0" />}
            </React.Fragment>
          );
        })}
      </div>

      {/* ── Table Card ────────────────────────────────────────────────── */}
      <div className="relative rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">

        {/* Toolbar */}
        <div className="flex flex-col gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-855 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput
            placeholder="Cari nama, URL, atau deskripsi..."
            value={search}
            onChange={setSearch}
          />
          <FilterDropdown<'Semua' | 'Aktif' | 'Non-Aktif'>
            className="w-full sm:w-40"
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
        <CrudTable<Aplikasi>
          headers={['#', 'Aplikasi', 'Warna Diagram', 'Kategori', 'Auth Mode', 'Dibuat', 'Status', 'Aksi']}
          loading={loading}
          loadingText="Memuat data aplikasi..."
          emptyText="Tidak ada aplikasi yang sesuai."
          data={paginatedData}
          renderRow={(app) => (
            <tr key={app.id} className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors duration-150">
              <td className="px-5 py-3.5 text-xs font-bold text-slate-450 dark:text-slate-600">{app.urutan}</td>
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-3">
                  {app.icon ? (
                    <img src={resolveImageUrl(app.icon)} alt={app.nama} className="h-11 w-11 rounded-xl object-contain shrink-0 border border-slate-200/80 dark:border-white/[0.08] p-0.5 bg-white dark:bg-slate-800/40 shadow-xs" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  ) : (
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20">
                      <LayoutGrid className="h-5 w-5 text-amber-500" />
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">{app.nama}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Globe className="h-3 w-3 text-slate-400 dark:text-slate-500 shrink-0" />
                      <a
                        href={app.auth_mode === 'sso' ? `/launch?appId=${encodeURIComponent(app.id)}&app=${encodeURIComponent(app.nama)}` : normalizeAppUrl(app.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Buka Aplikasi"
                        onClick={() => {
                          if (app.auth_mode !== 'sso') {
                            api.post(`/apps/${app.id}/access`, {}).catch((err) => {
                              console.error('Gagal mencatat akses aplikasi:', err);
                            });
                          }
                        }}
                        className="text-[11px] text-slate-550 hover:text-amber-550 dark:hover:text-amber-400 transition-colors truncate max-w-[180px]"
                      >
                        {app.url}
                      </a>
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-2">
                  <span className="h-5 w-5 shrink-0 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm" style={{ backgroundColor: app.warna }} />
                  <span className="font-mono text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">{app.warna}</span>
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
                <div className="flex items-center justify-end gap-1 flex-wrap">
                  <a
                    href={app.auth_mode === 'sso' ? `/launch?appId=${encodeURIComponent(app.id)}&app=${encodeURIComponent(app.nama)}` : normalizeAppUrl(app.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Buka Aplikasi"
                    onClick={() => {
                      if (app.auth_mode !== 'sso') {
                        api.post(`/apps/${app.id}/access`, {}).catch((err) => {
                          console.error('Gagal mencatat akses aplikasi:', err);
                        });
                      }
                    }}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:text-slate-800 dark:hover:text-slate-355 transition-all"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  {app.auth_mode === 'sso' && (
                    <button
                      type="button"
                      title="Kelola Hak Akses Pengguna"
                      onClick={() => openAccessModal(app)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-all cursor-pointer"
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <TableActions
                    onEdit={() => openEdit(app)}
                    onDelete={() => setDeleteTarget(app)}
                  />
                </div>
              </td>
            </tr>
          )}
        />
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
            <div className="relative overflow-hidden rounded-2xl border border-slate-300 dark:border-white/[0.08] bg-white dark:bg-[#0d1218] shadow-2xl shadow-slate-900/10">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-300 dark:border-white/[0.06]">
                <div className="flex items-center gap-2.5">
                  {editTarget ? <Pencil className="h-4 w-4 text-amber-550 dark:text-amber-455" /> : <Plus className="h-4 w-4 text-amber-550 dark:text-amber-455" />}
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
              <div className="px-5 py-5 space-y-4 max-h-[65vh] overflow-y-auto overflow-x-hidden hide-scrollbar">
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
                          src={resolveImageUrl(form.icon)}
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
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                  <label className={labelCls}>Warna Diagram Aplikasi</label>
                  <div className={`flex items-center gap-3 rounded-xl border bg-slate-50 p-2.5 dark:bg-white/[0.03] ${errors.warna ? 'border-rose-500 dark:border-rose-500/50' : 'border-slate-200 dark:border-white/[0.08]'}`}>
                    <input
                      type="color"
                      value={form.warna}
                      onChange={e => setForm(f => ({ ...f, warna: e.target.value.toUpperCase() }))}
                      className="h-9 w-11 cursor-pointer rounded-lg border-0 bg-transparent p-0"
                      aria-label="Pilih warna diagram aplikasi"
                    />
                    <input
                      type="text"
                      value={form.warna}
                      onChange={e => setForm(f => ({ ...f, warna: e.target.value.toUpperCase() }))}
                      maxLength={7}
                      className="min-w-0 flex-1 bg-transparent font-mono text-sm font-bold uppercase text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-200"
                      placeholder="#D97706"
                    />
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Dipakai di diagram akses</span>
                  </div>
                  {errors.warna && <span className="mt-1 block text-[10px] font-bold text-rose-500">{errors.warna}</span>}
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
              <div className="flex items-center justify-end gap-3 border-t border-slate-300 dark:border-white/[0.06] px-5 py-4 flex-wrap">
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
            <div className="relative overflow-hidden rounded-2xl border border-slate-300 dark:border-white/[0.08] bg-white dark:bg-[#0d1218] shadow-2xl shadow-slate-900/10 p-6 text-center">
              <div className="mx-auto mb-4 flex items-center justify-center">
                <Trash2 className="h-8 w-8 text-rose-500 dark:text-rose-455" />
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

      {/* ── App User Access Modal */}
      <ModalPortal open={accessModalOpen}>
        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setAccessModalOpen(false)} />
        <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
          <div className="pointer-events-auto w-full max-w-2xl animate-fade-up">
            <div className="relative overflow-hidden rounded-2xl border border-slate-300 dark:border-white/[0.08] bg-white dark:bg-[#0d1218] shadow-2xl shadow-slate-900/10">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-300 dark:border-white/[0.06]">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="h-5 w-5 text-amber-500" />
                  <div>
                    <h2 className="text-sm font-black text-slate-800 dark:text-slate-100">
                      Hak Akses Aplikasi · {accessTargetApp?.nama}
                    </h2>
                    <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                      Atur kriteria pengguna yang diizinkan membuka aplikasi SSO ini.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAccessModalOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:text-slate-600 transition-all"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 space-y-5 max-h-[78vh] overflow-y-auto">
                {/* Access Meter */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50/60 dark:bg-[#111622] p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300">Est. Keterjangkauan Akses</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-100">
                      {accessSummary?.estimatedAllowed ?? 0} dari {accessSummary?.totalEmployees ?? 0} Karyawan ({accessSummary?.percentage ?? 0}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800/80 overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(0, accessSummary?.percentage ?? 0))}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    {accessSummary?.percentage ?? 0}% dari seluruh karyawan aktif PT INL diperbolehkan membuka aplikasi ini.
                  </p>
                </div>

                {/* Mode Hak Akses */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Pilih Mode Hak Akses:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Mode 1: All Employees */}
                    <div
                      onClick={() => handleSaveAccessMode('all_employees')}
                      className={`cursor-pointer rounded-xl border p-3.5 transition-all duration-150 flex items-start gap-3 ${
                        currentAccessMode === 'all_employees'
                          ? 'border-amber-500 bg-amber-500/[0.03] dark:bg-amber-500/[0.05] ring-1 ring-amber-500/30'
                          : 'border-slate-200 dark:border-white/[0.06] hover:border-slate-300 dark:hover:border-white/[0.1] bg-white dark:bg-[#111823]'
                      }`}
                    >
                      <div className={`mt-0.5 h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${
                        currentAccessMode === 'all_employees' ? 'border-amber-500 bg-amber-500' : 'border-slate-300 dark:border-slate-600'
                      }`}>
                        {currentAccessMode === 'all_employees' && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <Globe className="h-3.5 w-3.5 text-slate-700 dark:text-slate-300" />
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Semua Karyawan</p>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                          Seluruh akun pengguna yang terdaftar sebagai karyawan aktif.
                        </p>
                      </div>
                    </div>

                    {/* Mode 2: All Except */}
                    <div
                      onClick={() => handleSaveAccessMode('all_except')}
                      className={`cursor-pointer rounded-xl border p-3.5 transition-all duration-150 flex items-start gap-3 ${
                        currentAccessMode === 'all_except'
                          ? 'border-amber-500 bg-amber-500/[0.03] dark:bg-amber-500/[0.05] ring-1 ring-amber-500/30'
                          : 'border-slate-200 dark:border-white/[0.06] hover:border-slate-300 dark:hover:border-white/[0.1] bg-white dark:bg-[#111823]'
                      }`}
                    >
                      <div className={`mt-0.5 h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${
                        currentAccessMode === 'all_except' ? 'border-amber-500 bg-amber-500' : 'border-slate-300 dark:border-slate-600'
                      }`}>
                        {currentAccessMode === 'all_except' && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <UserX className="h-3.5 w-3.5 text-slate-700 dark:text-slate-300" />
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Semua Karyawan, Kecuali...</p>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                          Semua karyawan boleh, kecuali daftar karyawan yang dilarang.
                        </p>
                      </div>
                    </div>

                    {/* Mode 3: Specific Only */}
                    <div
                      onClick={() => handleSaveAccessMode('specific_only')}
                      className={`cursor-pointer rounded-xl border p-3.5 transition-all duration-150 flex items-start gap-3 ${
                        currentAccessMode === 'specific_only'
                          ? 'border-amber-500 bg-amber-500/[0.03] dark:bg-amber-500/[0.05] ring-1 ring-amber-500/30'
                          : 'border-slate-200 dark:border-white/[0.06] hover:border-slate-300 dark:hover:border-white/[0.1] bg-white dark:bg-[#111823]'
                      }`}
                    >
                      <div className={`mt-0.5 h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${
                        currentAccessMode === 'specific_only' ? 'border-amber-500 bg-amber-500' : 'border-slate-300 dark:border-slate-600'
                      }`}>
                        {currentAccessMode === 'specific_only' && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <UserCheck className="h-3.5 w-3.5 text-slate-700 dark:text-slate-300" />
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Khusus Untuk...</p>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                          HANYA beberapa karyawan tertentu yang didaftarkan khusus.
                        </p>
                      </div>
                    </div>

                    {/* Mode 4: By Unit */}
                    <div
                      onClick={() => handleSaveAccessMode('by_unit')}
                      className={`cursor-pointer rounded-xl border p-3.5 transition-all duration-150 flex items-start gap-3 ${
                        currentAccessMode === 'by_unit'
                          ? 'border-amber-500 bg-amber-500/[0.03] dark:bg-amber-500/[0.05] ring-1 ring-amber-500/30'
                          : 'border-slate-200 dark:border-white/[0.06] hover:border-slate-300 dark:hover:border-white/[0.1] bg-white dark:bg-[#111823]'
                      }`}
                    >
                      <div className={`mt-0.5 h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${
                        currentAccessMode === 'by_unit' ? 'border-amber-500 bg-amber-500' : 'border-slate-300 dark:border-slate-600'
                      }`}>
                        {currentAccessMode === 'by_unit' && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <Building className="h-3.5 w-3.5 text-slate-700 dark:text-slate-300" />
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Berdasarkan Unit / Divisi</p>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                          Hanya karyawan dari Unit Organisasi tertentu.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sub-Section 1: Unit Organisasi Selector (Mode: by_unit) */}
                {currentAccessMode === 'by_unit' && (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#111622] p-4 space-y-4">
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                      Pilih & Tambah Unit / Divisi Kerja yang Diizinkan:
                    </label>

                    {/* Dropdown Search & Add Button */}
                    <div className="flex flex-col sm:flex-row items-center gap-2">
                      <div className="flex-1 w-full">
                        <SearchSelect
                          value={selectedUnitToAdd}
                          onChange={setSelectedUnitToAdd}
                          options={unitList
                            .filter(u => !selectedUnitIds.includes(u.id))
                            .map(u => ({ value: u.id, label: u.nama, subLabel: u.kode ? `Kode: ${u.kode}` : undefined }))
                          }
                          placeholder="Cari & Pilih Unit / Divisi Kerja..."
                        />
                      </div>
                      <PrimaryButton
                        disabled={!selectedUnitToAdd || updatingMode}
                        onClick={() => {
                          if (!selectedUnitToAdd) return;
                          const next = [...selectedUnitIds, selectedUnitToAdd];
                          setSelectedUnitIds(next);
                          setSelectedUnitToAdd('');
                          handleSaveAccessMode('by_unit', next);
                        }}
                        className="w-full sm:w-auto h-[42px] px-4 shrink-0 flex items-center justify-center gap-1.5"
                      >
                        {updatingMode ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-4 w-4" />}
                        Tambah Unit
                      </PrimaryButton>
                    </div>

                    {/* Tabel / List Unit Terdaftar */}
                    <div className="space-y-2.5 pt-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                          Daftar Unit Organisasi Diizinkan ({selectedUnitIds.length})
                        </h4>
                      </div>

                      {selectedUnitIds.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-800 p-6 text-center text-xs text-slate-400">
                          Belum ada unit kerja yang ditambahkan. Gunakan pencarian di atas untuk menambahkan unit.
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                          {selectedUnitIds.map(unitId => {
                            const u = unitList.find(item => item.id === unitId);
                            return (
                              <div
                                key={unitId}
                                className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#111823] p-3 shadow-sm"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <Building className="h-4 w-4 text-slate-500 shrink-0" />
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                                      {u?.nama || 'Unit Tidak Dikenal'}
                                    </p>
                                    {u?.kode && (
                                      <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate">
                                        Kode Unit: {u.kode}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  disabled={updatingMode}
                                  onClick={() => {
                                    const next = selectedUnitIds.filter(id => id !== unitId);
                                    setSelectedUnitIds(next);
                                    handleSaveAccessMode('by_unit', next);
                                  }}
                                  className="flex h-8 px-3 items-center gap-1.5 rounded-lg border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/20 text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/40 transition-all cursor-pointer shrink-0 ml-2"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Hapus
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Sub-Section 2: User List (Mode: all_except or specific_only) */}
                {(currentAccessMode === 'all_except' || currentAccessMode === 'specific_only') && (
                  <>
                    {/* Form Tambah User */}
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#111622] p-4 space-y-3">
                      <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                        {currentAccessMode === 'all_except'
                          ? 'Tambah Karyawan ke Daftar Pengecualian (Blacklist)'
                          : 'Tambah Karyawan ke Daftar Akses Khusus (Whitelist)'}
                      </label>
                      <div className="flex flex-col sm:flex-row items-center gap-2">
                        <div className="flex-1 w-full">
                          <SearchSelect
                            value={selectedUserToAdd}
                            onChange={setSelectedUserToAdd}
                            options={allUserOptions.filter(u => !accessList.some(a => a.userId === u.value))}
                            placeholder="Pilih Karyawan..."
                          />
                        </div>
                        <PrimaryButton
                          disabled={!selectedUserToAdd || granting}
                          onClick={handleGrantAccess}
                          className="w-full sm:w-auto h-[42px] px-4 shrink-0 flex items-center justify-center gap-1.5"
                        >
                          {granting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                          {currentAccessMode === 'all_except' ? 'Kecualikan Pengguna' : 'Beri Akses Khusus'}
                        </PrimaryButton>
                      </div>
                    </div>

                    {/* List Pengguna */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                          {currentAccessMode === 'all_except'
                            ? `Daftar Karyawan Dikecualikan (${accessList.length})`
                            : `Daftar Karyawan Diberikan Akses Khusus (${accessList.length})`}
                        </h3>
                        {accessLoading && <Loader2 className="h-4 w-4 animate-spin text-amber-500" />}
                      </div>

                      {accessList.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-800 p-6 text-center text-xs text-slate-400">
                          {currentAccessMode === 'all_except'
                            ? 'Belum ada karyawan yang dikecualikan (Semua karyawan saat ini diizinkan).'
                            : 'Belum ada karyawan khusus yang diberikan hak akses.'}
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                          {accessList.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#111823] p-3.5 shadow-sm"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs shrink-0">
                                  {(item.employeeNama || item.email || 'U').charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                                    {item.employeeNama || item.email}
                                  </p>
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                    {item.email} {item.jabatan ? `· ${item.jabatan}` : ''} {item.unitNama ? `(${item.unitNama})` : ''}
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                disabled={revokingUserId === item.userId}
                                onClick={() => handleRevokeAccess(item.userId)}
                                className="flex h-8 px-3 items-center gap-1.5 rounded-lg border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/20 text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/40 transition-all cursor-pointer shrink-0 ml-2"
                              >
                                {revokingUserId === item.userId ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3.5 w-3.5" />
                                )}
                                Hapus
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end border-t border-slate-300 dark:border-white/[0.06] px-5 py-4">
                <SecondaryButton onClick={() => setAccessModalOpen(false)}>
                  Selesai
                </SecondaryButton>
              </div>
            </div>
          </div>
        </div>
      </ModalPortal>

    </div>
  );
}
