'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Building2, GitBranch, Plus, Pencil, Trash2, X, CheckCircle2, AlertCircle, Search,
  ToggleLeft, ToggleRight, Loader2, Server, ChevronDown
} from 'lucide-react';
import { ModalPortal } from '@/components/ui/ModalPortal';
import { LiquidButton } from '@/components/animate-ui/components/buttons/liquid';
import { api, ApiRequestError } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────
type TipeUnit = 'direktorat' | 'sevp' | 'bagian' | 'sub_bagian' | 'seksi';

const TYPE_RANK: Record<TipeUnit, number> = {
  direktorat: 5,
  sevp:       4,
  bagian:     3,
  sub_bagian: 2,
  seksi:      1,
};

interface UnitOrganisasi {
  id: string;
  kode: string;
  nama: string;
  tipe: TipeUnit;
  parentId: string | null;
  isActive: boolean;
}

interface FormData {
  kode: string;
  nama: string;
  tipe: TipeUnit;
  parentId: string; // Empty string maps to null on save
  isActive: boolean;
}

// ─── Shared Styles ────────────────────────────────────────────────────────────
const inputCls = 'w-full rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0a0f1a] px-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10 transition-all duration-200';
const labelCls = 'mb-1.5 block text-[10px] font-black uppercase tracking-wide text-slate-550 dark:text-slate-400';

const TIPE_UNIT_BADGES: Record<TipeUnit, string> = {
  direktorat: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  sevp:       'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  bagian:     'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  sub_bagian: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
  seksi:      'bg-pink-500/10 text-pink-600 dark:text-pink-450 border-pink-500/20',
};

const TIPE_UNIT_LABELS: Record<TipeUnit, string> = {
  direktorat: 'Direktorat',
  sevp:       'SEVP',
  bagian:     'Bagian',
  sub_bagian: 'Sub Bagian',
  seksi:      'Seksi',
};

const emptyForm: FormData = {
  kode: '',
  nama: '',
  tipe: 'direktorat',
  parentId: '',
  isActive: true,
};

// ─── Sub-Components ───────────────────────────────────────────────────────────
function Toast({ toast }: { toast: { type: 'ok' | 'err'; text: string } | null }) {
  if (!toast) return null;
  return (
    <div className={`fixed top-6 right-6 z-[99999] flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-semibold shadow-2xl backdrop-blur-xl animate-fade-up ${toast.type === 'ok' ? 'bg-[#0f1a10]/95 border-emerald-500/30 text-emerald-300' : 'bg-[#1a0f10]/95 border-rose-500/30 text-rose-300'}`}>
      {toast.type === 'ok' ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" /> : <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />}
      {toast.text}
    </div>
  );
}

function TableCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-white/[0.06] bg-white dark:bg-[#0f1623] shadow-lg">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
      {children}
    </div>
  );
}

function ActiveToggle({ value, onChange, disabled }: { value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      disabled={disabled}
      onClick={() => onChange(!value)}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide transition-all duration-200 cursor-pointer focus:outline-none disabled:opacity-50 ${value ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border-emerald-500/20 hover:bg-emerald-500/20' : 'bg-slate-100 dark:bg-white/[0.04] text-slate-500 border-slate-200 dark:border-white/[0.06] hover:bg-slate-250 dark:hover:bg-white/[0.08]'}`}
    >
      {value ? <ToggleRight className="h-3 w-3" /> : <ToggleLeft className="h-3 w-3" />}
      {value ? 'Aktif' : 'Nonaktif'}
    </button>
  );
}

function DeleteModal({ open, name, onCancel, onConfirm, deleting }: { open: boolean; name: string; onCancel: () => void; onConfirm: () => void; deleting?: boolean }) {
  return (
    <ModalPortal open={open}>
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-sm animate-fade-up">
          <div className="relative overflow-hidden rounded-2xl border border-rose-500/20 bg-white dark:bg-[#0d1218] shadow-2xl p-6 text-center">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rose-500/50 to-transparent" />
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20">
              <Trash2 className="h-5 w-5 text-rose-500 dark:text-rose-400" />
            </div>
            <h3 className="text-base font-black text-slate-800 dark:text-slate-100">Hapus Unit Organisasi?</h3>
            <p className="mt-2 text-sm text-slate-550 dark:text-slate-400 leading-relaxed">
              Unit <span className="font-bold text-slate-800 dark:text-slate-200">&quot;{name}&quot;</span> beserta seluruh sub-unitnya akan dihapus permanen.
            </p>
            <div className="mt-5 flex gap-3">
              <button disabled={deleting} onClick={onCancel} className="flex-1 rounded-xl border border-slate-200 dark:border-white/[0.08] px-4 py-2.5 text-sm font-bold text-slate-550 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-all cursor-pointer focus:outline-none">Batal</button>
              <button disabled={deleting} onClick={onConfirm} className="flex-1 rounded-xl bg-rose-500/90 hover:bg-rose-500 px-4 py-2.5 text-sm font-bold text-white transition-all cursor-pointer shadow-lg shadow-rose-500/20 flex items-center justify-center gap-1.5 focus:outline-none">
                {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />}
                {deleting ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}

// ─── Main Page Component ─────────────────────────────────────────────────────
export default function UnitOrganisasiPage() {
  const [unitOrganisasis, setUnitOrganisasis] = useState<UnitOrganisasi[]>([]);
  const [loading, setLoading]                 = useState(true);
  const [saving, setSaving]                   = useState(false);
  const [deleting, setDeleting]               = useState(false);

  const [search, setSearch]                   = useState('');
  const [filterType, setFilterType]           = useState<'Semua' | TipeUnit>('Semua');
  const [filterStatus, setFilterStatus]       = useState<'Semua' | 'Aktif' | 'Non-Aktif'>('Semua');
  const [currentPage, setCurrentPage]         = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterType, filterStatus]);

  const [modalOpen, setModalOpen]             = useState(false);
  const [editTarget, setEditTarget]           = useState<UnitOrganisasi | null>(null);
  const [deleteTarget, setDeleteTarget]       = useState<UnitOrganisasi | null>(null);
  const [form, setForm]                       = useState<FormData>(emptyForm);
  const [errors, setErrors]                   = useState<Record<string, string>>({});
  const [toast, setToast]                     = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const showToast = (type: 'ok' | 'err', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3200);
  };

  // ─── Fetch Data ────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      const res = await api.get<UnitOrganisasi[]>('/org/unit?limit=200');
      setUnitOrganisasis(res.data || []);
    } catch (err) {
      showToast('err', err instanceof Error ? err.message : 'Gagal memuat data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Filtered Options for Parent Dropdown ───────────────────────────────
  const parentOptions = useMemo(() => {
    if (form.tipe === 'direktorat') return [];

    // Helper to check circular descendant
    const isDescendant = (unitId: string, targetId: string): boolean => {
      let curr = unitOrganisasis.find(u => u.id === unitId);
      while (curr) {
        if (curr.parentId === targetId) return true;
        const pId = curr.parentId;
        curr = pId ? unitOrganisasis.find(u => u.id === pId) : undefined;
      }
      return false;
    };

    return unitOrganisasis.filter(u => {
      const isCurrentParent = editTarget && editTarget.parentId === u.id;
      if (!u.isActive && !isCurrentParent) return false;
      if (TYPE_RANK[u.tipe] <= TYPE_RANK[form.tipe]) return false;
      if (editTarget && u.id === editTarget.id) return false;
      if (editTarget && isDescendant(u.id, editTarget.id)) return false;
      return true;
    });
  }, [unitOrganisasis, form.tipe, editTarget]);

  // ─── Map to Resolve Parent Name ────────────────────────────────────────────
  const orgMap = useMemo(() => {
    const map = new Map<string, string>();
    unitOrganisasis.forEach(u => map.set(u.id, u.nama));
    return map;
  }, [unitOrganisasis]);

  // ─── Filtering Listing ─────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return unitOrganisasis.filter(u => {
      const q = search.toLowerCase();
      const matchSearch = u.nama.toLowerCase().includes(q) || u.kode.toLowerCase().includes(q);
      const matchType   = filterType === 'Semua' || u.tipe === filterType;
      const matchStatus = filterStatus === 'Semua' || (filterStatus === 'Aktif' ? u.isActive : !u.isActive);
      return matchSearch && matchType && matchStatus;
    });
  }, [unitOrganisasis, search, filterType, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginatedData = useMemo(() => {
    return filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filtered, currentPage]);

  // ─── Open Modals ───────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditTarget(null);
    setForm(emptyForm);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (u: UnitOrganisasi) => {
    setEditTarget(u);
    setErrors({});
    setForm({
      kode: u.kode,
      nama: u.nama,
      tipe: u.tipe,
      parentId: u.parentId ?? '',
      isActive: u.isActive,
    });
    setModalOpen(true);
  };

  // ─── Save Unit ─────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setErrors({});
    if (!form.kode.trim()) { setErrors(e => ({ ...e, kode: 'Kode unit wajib diisi.' })); showToast('err', 'Kode unit wajib diisi.'); return; }
    if (!form.nama.trim()) { setErrors(e => ({ ...e, nama: 'Nama unit wajib diisi.' })); showToast('err', 'Nama unit wajib diisi.'); return; }
    if (form.tipe !== 'direktorat' && !form.parentId) { setErrors(e => ({ ...e, parentId: 'Parent Unit wajib diisi.' })); showToast('err', 'Parent Unit wajib diisi.'); return; }
    if (form.tipe !== 'direktorat' && form.parentId) {
      const parent = unitOrganisasis.find(u => u.id === form.parentId);
      if (parent && TYPE_RANK[parent.tipe] <= TYPE_RANK[form.tipe]) {
        setErrors(e => ({ ...e, parentId: 'Tipe parent harus lebih tinggi dari tipe unit ini.' }));
        showToast('err', 'Tipe parent harus lebih tinggi dari tipe unit ini.');
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        kode: form.kode.toUpperCase(),
        nama: form.nama,
        tipe: form.tipe,
        parentId: form.parentId || null,
        isActive: form.isActive,
      };

      if (editTarget) {
        await api.put(`/org/unit/${editTarget.id}`, payload);
        showToast('ok', `Unit "${form.nama}" berhasil diperbarui.`);
      } else {
        await api.post('/org/unit', payload);
        showToast('ok', `Unit "${form.nama}" berhasil ditambahkan.`);
      }
      setModalOpen(false);
      setLoading(true);
      await fetchData();
    } catch (err) {
      if (err instanceof ApiRequestError && err.details) {
        const fieldErrors: Record<string, string> = {};
        err.details.forEach(d => {
          fieldErrors[d.field] = d.message;
        });
        setErrors(fieldErrors);
        showToast('err', err.message || 'Gagal menyimpan.');
      } else {
        showToast('err', err instanceof Error ? err.message : 'Gagal menyimpan.');
      }
    } finally {
      setSaving(false);
    }
  };

  // ─── Delete Unit ───────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/org/unit/${deleteTarget.id}`);
      showToast('ok', `Unit "${deleteTarget.nama}" berhasil dihapus.`);
      setDeleteTarget(null);
      setLoading(true);
      await fetchData();
    } catch (err) {
      showToast('err', err instanceof Error ? err.message : 'Gagal menghapus.');
    } finally {
      setDeleting(false);
    }
  };

  // ─── Active status toggle ──────────────────────────────────────────────────
  const toggleStatus = async (u: UnitOrganisasi) => {
    try {
      await api.put(`/org/unit/${u.id}`, { isActive: !u.isActive });
      showToast('ok', `Status unit "${u.nama}" diperbarui.`);
      await fetchData();
    } catch (err) {
      showToast('err', err instanceof Error ? err.message : 'Gagal mengubah status.');
    }
  };

  const activeCount   = unitOrganisasis.filter(u => u.isActive).length;
  const inactiveCount = unitOrganisasis.length - activeCount;

  return (
    <div className="space-y-6">
      <Toast toast={toast} />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2.5">
            <GitBranch className="h-6 w-6 text-amber-500 dark:text-amber-400" />
            Manajemen Unit Organisasi
          </h1>
          <p className="mt-1 text-sm font-semibold text-slate-550 dark:text-slate-400">Kelola hierarki unit organisasi PT Industri Nabati Lestari.</p>
        </div>
        <LiquidButton variant="outline" size="sm" onClick={openCreate} className="cursor-pointer flex items-center gap-2 font-bold">
          <Plus className="h-4 w-4" />
          Tambah Unit
        </LiquidButton>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        {[
          { label: 'Total Unit', value: unitOrganisasis.length, icon: Server,     color: 'text-amber-500 dark:text-amber-400' },
          { label: 'Aktif',      value: activeCount,           icon: CheckCircle2, color: 'text-emerald-500 dark:text-emerald-450' },
          { label: 'Non-Aktif',  value: inactiveCount,         icon: AlertCircle,  color: 'text-rose-500 dark:text-rose-400' },
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

      {/* Main Listing Card */}
      <TableCard>
        {/* Toolbar */}
        <div className="flex flex-col gap-3 px-5 py-4 border-b border-slate-100 dark:border-white/[0.06] sm:flex-row sm:items-center sm:justify-between flex-wrap">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
            <input type="text" placeholder="Cari nama atau kode unit..." value={search} onChange={e => setSearch(e.target.value)} className={`${inputCls} pl-10`} />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Tipe filter */}
            <div className="relative">
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value as any)}
                className="rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0a0f1a] px-3 py-1.5 pr-8 text-xs text-slate-700 dark:text-slate-300 outline-none focus:border-amber-500/50 cursor-pointer appearance-none"
              >
                <option value="Semua">Semua Tipe</option>
                {Object.keys(TIPE_UNIT_LABELS).map(k => (
                  <option key={k} value={k}>{TIPE_UNIT_LABELS[k as TipeUnit]}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-slate-500 pointer-events-none" />
            </div>

            <div className="h-3.5 w-px bg-slate-200 dark:bg-white/[0.08]" />

            {/* Status filter */}
            <div className="flex items-center gap-1">
              {(['Semua', 'Aktif', 'Non-Aktif'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`rounded-lg px-2.5 py-1.5 text-[11px] font-black uppercase tracking-wide transition-all cursor-pointer focus:outline-none ${filterStatus === s ? 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 dark:border-amber-500/30' : 'text-slate-550 dark:text-slate-550 hover:text-slate-800 dark:hover:text-slate-300 border border-transparent'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-white/[0.04]">
                {['Kode', 'Nama Unit', 'Tipe', 'Parent Unit', 'Status', 'Aksi'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 last:text-right">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.03]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm font-semibold text-slate-400 dark:text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-amber-550" />
                      Memuat data unit organisasi...
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm font-semibold text-slate-400 dark:text-slate-500">Tidak ada unit organisasi yang sesuai.</td>
                </tr>
              ) : (
                paginatedData.map(u => (
                  <tr key={u.id} className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors duration-150">
                    {/* Kode */}
                    <td className="px-5 py-3.5">
                      <span className="rounded-lg bg-slate-100 dark:bg-white/[0.06] px-2.5 py-1 text-[11px] font-black text-amber-600 dark:text-amber-400 uppercase">{u.kode}</span>
                    </td>
                    {/* Nama */}
                    <td className="px-5 py-3.5 font-bold text-slate-800 dark:text-slate-200">{u.nama}</td>
                    {/* Tipe */}
                    <td className="px-5 py-3.5">
                      <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide ${TIPE_UNIT_BADGES[u.tipe]}`}>
                        {TIPE_UNIT_LABELS[u.tipe]}
                      </span>
                    </td>
                    {/* Parent */}
                    <td className="px-5 py-3.5 text-xs font-bold text-slate-500 dark:text-slate-450">
                      {u.parentId ? (orgMap.get(u.parentId) || '-') : <span className="italic text-slate-400 dark:text-slate-550">None (Root)</span>}
                    </td>
                    {/* Status */}
                    <td className="px-5 py-3.5">
                      <ActiveToggle value={u.isActive} onChange={() => toggleStatus(u)} />
                    </td>
                    {/* Actions */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(u)} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:bg-amber-500/10 hover:text-amber-500 transition-all cursor-pointer focus:outline-none">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => setDeleteTarget(u)} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:bg-rose-500/10 hover:text-rose-500 transition-all cursor-pointer focus:outline-none">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination Footer */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-5 py-4 border-t border-slate-100 dark:border-white/[0.04] bg-slate-50/50 dark:bg-white/[0.01] text-[11px] font-bold text-slate-550 dark:text-slate-400">
          <div>
            {filtered.length === 0 ? (
              <span>Menampilkan 0 entri</span>
            ) : (
              <span>
                Menampilkan {Math.min((currentPage - 1) * itemsPerPage + 1, filtered.length)} - {Math.min(currentPage * itemsPerPage, filtered.length)} dari {filtered.length} entri
                {filtered.length !== unitOrganisasis.length && ` (disaring dari ${unitOrganisasis.length} total)`}
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
                            : 'border border-slate-200/80 dark:border-white/[0.06] bg-white dark:bg-[#0f1623] text-slate-600 dark:text-slate-400 hover:bg-slate-55 dark:hover:bg-white/[0.04]'
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
      </TableCard>

      {/* Add / Edit Modal */}
      <ModalPortal open={modalOpen}>
        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
        <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
          <div className="pointer-events-auto w-full max-w-md animate-fade-up">
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0d1218] shadow-2xl">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-150 dark:border-white/[0.06]">
                <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <GitBranch className="h-4 w-4 text-amber-550 dark:text-amber-400" />
                  {editTarget ? 'Edit Unit Organisasi' : 'Tambah Unit Organisasi'}
                </h2>
                <button onClick={() => setModalOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:text-slate-700 dark:hover:text-slate-355 cursor-pointer focus:outline-none">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="px-5 py-5 space-y-4 max-h-[65vh] overflow-y-auto hide-scrollbar">
                {/* Kode & Nama */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={labelCls}>Kode Unit *</label>
                    <input
                      type="text"
                      value={form.kode}
                      onChange={e => setForm(f => ({ ...f, kode: e.target.value.toUpperCase() }))}
                      placeholder="DIRUT"
                      maxLength={20}
                      className={`${inputCls} ${errors.kode ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/10 dark:border-rose-500/50' : ''}`}
                    />
                    {errors.kode && <span className="text-[10px] text-rose-500 mt-1 block font-bold">{errors.kode}</span>}
                  </div>
                  <div className="col-span-2">
                    <label className={labelCls}>Nama Unit *</label>
                    <input
                      type="text"
                      value={form.nama}
                      onChange={e => setForm(f => ({ ...f, nama: e.target.value }))}
                      placeholder="Nama unit lengkap"
                      className={`${inputCls} ${errors.nama ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/10 dark:border-rose-500/50' : ''}`}
                    />
                    {errors.nama && <span className="text-[10px] text-rose-500 mt-1 block font-bold">{errors.nama}</span>}
                  </div>
                </div>

                {/* Tipe Unit */}
                <div>
                  <label className={labelCls}>Tipe Unit *</label>
                  <div className="relative">
                    <select
                      value={form.tipe}
                      onChange={e => {
                        const val = e.target.value as TipeUnit;
                        setForm(f => ({ ...f, tipe: val, parentId: '' }));
                      }}
                      className={`${inputCls} appearance-none pr-10 cursor-pointer`}
                    >
                      {Object.keys(TIPE_UNIT_LABELS).map(k => (
                        <option key={k} value={k}>{TIPE_UNIT_LABELS[k as TipeUnit]}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                  </div>
                </div>

                {/* Parent Unit */}
                <div>
                  <label className={labelCls}>Parent Unit</label>
                  <div className="relative">
                    <select
                      value={form.parentId}
                      disabled={form.tipe === 'direktorat'}
                      onChange={e => setForm(f => ({ ...f, parentId: e.target.value }))}
                      className={`${inputCls} appearance-none pr-10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${errors.parentId ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/10 dark:border-rose-500/50' : ''}`}
                    >
                      <option value="">- Tanpa Parent (Root) -</option>
                      {parentOptions.map(p => (
                        <option key={p.id} value={p.id}>{p.nama} ({TIPE_UNIT_LABELS[p.tipe]})</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                  </div>
                  {errors.parentId && <span className="text-[10px] text-rose-500 mt-1 block font-bold">{errors.parentId}</span>}
                </div>

                {/* Status Toggle */}
                <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02] px-4 py-3">
                  <div>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Status Aktif</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Unit {form.isActive ? 'aktif dan' : 'nonaktif, tidak'} dapat dipilih dalam sistem</p>
                  </div>
                  <button
                    onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                    className={`relative flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200 cursor-pointer focus:outline-none ${form.isActive ? 'bg-amber-500' : 'bg-slate-250 dark:bg-white/[0.1]'}`}
                  >
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all duration-200 ${form.isActive ? 'left-5' : 'left-0.5'}`} />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-150 dark:border-white/[0.06] px-5 py-4">
                <button disabled={saving} onClick={() => setModalOpen(false)} className="rounded-xl border border-slate-250 dark:border-white/[0.08] px-4 py-2 text-sm font-bold text-slate-550 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-all cursor-pointer focus:outline-none">Batal</button>
                <LiquidButton disabled={saving} variant="outline" size="sm" onClick={handleSave} className="cursor-pointer font-bold flex items-center gap-1.5">
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-550" />}
                  {editTarget ? 'Simpan' : 'Tambahkan'}
                </LiquidButton>
              </div>
            </div>
          </div>
        </div>
      </ModalPortal>

      {/* Delete Confirmation Modal */}
      <DeleteModal open={!!deleteTarget} name={deleteTarget?.nama ?? ''} onCancel={() => setDeleteTarget(null)} onConfirm={handleDelete} deleting={deleting} />
    </div>
  );
}
