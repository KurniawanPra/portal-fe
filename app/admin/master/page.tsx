'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Building2, Briefcase, GraduationCap, Heart,
  Plus, Pencil, Trash2, X, CheckCircle2, AlertCircle, Search,
  ToggleLeft, ToggleRight, Loader2, ChevronDown
} from 'lucide-react';
import { ModalPortal } from '@/components/ui/ModalPortal';
import { LiquidButton } from '@/components/animate-ui/components/buttons/liquid';
import { api, ApiRequestError } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────
interface StatusKary  { id:string; kode:string; nama:string; }
interface Pendidikan  { id:string; singkatan:string; nama_lengkap:string; jenjang:number; }
interface StatusNikah { id:string; nama:string; }

interface ApiUnit {
  id: string;
  kode: string;
  nama: string;
  tipe: 'direktorat' | 'sevp' | 'bagian' | 'sub_bagian' | 'seksi';
  parentId: string | null;
  isActive: boolean;
}

interface ApiStatusKaryawan {
  id: string;
  kode: string;
  label: string;
}

interface ApiPendidikan {
  id: string;
  kode: string;
  label: string;
  urutan: number;
}

interface ApiStatusPernikahan {
  id: string;
  kode: string;
  label: string;
}

// ─── Shared Styles ────────────────────────────────────────────────────────────
const inputCls  = 'w-full rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0a0f1a] px-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10 transition-all duration-200';
const labelCls  = 'mb-1.5 block text-[10px] font-black uppercase tracking-widest text-slate-550 dark:text-slate-400';

// ─── Toast utility ────────────────────────────────────────────────────────────
function Toast({ toast }: { toast: {type:'ok'|'err'; text:string} | null }) {
  if (!toast) return null;
  return (
    <div className={`fixed top-6 right-6 z-[99999] flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-semibold shadow-2xl backdrop-blur-xl animate-fade-up ${toast.type==='ok' ? 'bg-[#0f1a10]/95 border-emerald-500/30 text-emerald-300' : 'bg-[#1a0f10]/95 border-rose-500/30 text-rose-300'}`}>
      {toast.type==='ok' ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400"/> : <AlertCircle className="h-4 w-4 shrink-0 text-rose-400"/>}
      {toast.text}
    </div>
  );
}

// ─── TABLE CARD shell ─────────────────────────────────────────────────────────
function TableCard({ accentColor, children }: { accentColor:string; children:React.ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-white/[0.06] bg-white dark:bg-[#0f1623] shadow-lg">
      <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${accentColor} to-transparent`} />
      {children}
    </div>
  );
}

// ─── Toggle Button ────────────────────────────────────────────────────────────
function ActiveToggle({ value, onChange, disabled }: { value:boolean; onChange:(v:boolean)=>void; disabled?:boolean }) {
  return (
    <button
      disabled={disabled}
      onClick={() => onChange(!value)}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide transition-all duration-200 cursor-pointer focus:outline-none disabled:opacity-50 ${value ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border-emerald-500/20 hover:bg-emerald-500/20' : 'bg-slate-100 dark:bg-white/[0.04] text-slate-500 border-slate-200 dark:border-white/[0.06] hover:bg-slate-250 dark:hover:bg-white/[0.08]'}`}
    >
      {value ? <ToggleRight className="h-3 w-3"/> : <ToggleLeft className="h-3 w-3"/>}
      {value ? 'Aktif' : 'Nonaktif'}
    </button>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
function DeleteModal({ open, name, onCancel, onConfirm, deleting }: { open:boolean; name:string; onCancel:()=>void; onConfirm:()=>void; deleting?:boolean }) {
  return (
    <ModalPortal open={open}>
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={onCancel}/>
      <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-sm animate-fade-up">
          <div className="relative overflow-hidden rounded-2xl border border-rose-500/20 bg-white dark:bg-[#0d1218] shadow-2xl p-6 text-center">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rose-500/50 to-transparent"/>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20">
              <Trash2 className="h-5 w-5 text-rose-500 dark:text-rose-400"/>
            </div>
            <h3 className="text-base font-black text-slate-800 dark:text-slate-100">Hapus Data?</h3>
            <p className="mt-2 text-sm text-slate-555 dark:text-slate-400 leading-relaxed">
              Data <span className="font-bold text-slate-800 dark:text-slate-200">&quot;{name}&quot;</span> akan dihapus permanen.
            </p>
            <div className="mt-5 flex gap-3">
              <button disabled={deleting} onClick={onCancel} className="flex-1 rounded-xl border border-slate-200 dark:border-white/[0.08] px-4 py-2.5 text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-all cursor-pointer focus:outline-none">Batal</button>
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




// ═══════════════════════════════════════════════════════════════════════════════
// TAB: STATUS KARYAWAN
// ═══════════════════════════════════════════════════════════════════════════════
function TabStatusKaryawan() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [data, setData]             = useState<StatusKary[]>([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [search, setSearch]         = useState('');
  const [modalOpen, setModalOpen]   = useState(false);
  const [editTarget, setEditTarget] = useState<StatusKary|null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StatusKary|null>(null);
  const [form, setForm]             = useState({ kode: '', nama:'' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);
  const [toast, setToast]           = useState<{type:'ok'|'err';text:string}|null>(null);

  const showToast = (t:'ok'|'err', text:string) => { setToast({type:t,text}); setTimeout(()=>setToast(null),3000); };

  const fetchData = useCallback(async () => {
    try {
      const res = await api.get<ApiStatusKaryawan[]>('/master/status-karyawan');
      const mapped = (res.data || []).map(r => ({
        id: r.id,
        kode: r.kode,
        nama: r.label,
      }));
      setData(mapped);
    } catch (err) {
      showToast('err', err instanceof Error ? err.message : 'Gagal memuat data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreate = () => { setEditTarget(null); setForm({ kode: '', nama:'' }); setErrors({}); setModalOpen(true); };
  const openEdit   = (r:StatusKary) => { setEditTarget(r); setForm({ kode: r.kode, nama:r.nama }); setErrors({}); setModalOpen(true); };

  const handleSave = async () => {
    setErrors({});
    const newErrors: Record<string, string> = {};
    if (!form.kode.trim()) { newErrors.kode = 'Kode wajib diisi.'; }
    if (!form.nama.trim()) { newErrors.nama = 'Nama Status wajib diisi.'; }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast('err', 'Harap periksa form kembali.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        kode: form.kode.toUpperCase(),
        label: form.nama,
      };
      if (editTarget) {
        await api.put(`/master/status-karyawan/${editTarget.id}`, payload);
        showToast('ok', `"${form.nama}" diperbarui.`);
      } else {
        await api.post('/master/status-karyawan', payload);
        showToast('ok', `"${form.nama}" ditambahkan.`);
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      if (err instanceof ApiRequestError && err.details) {
        const fieldErrors: Record<string, string> = {};
        err.details.forEach(d => {
          let fieldName = d.field;
          if (fieldName === 'label') fieldName = 'nama';
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
  };

  const handleDelete = async () => {
    if(!deleteTarget)return;
    setDeleting(true);
    try {
      await api.delete(`/master/status-karyawan/${deleteTarget.id}`);
      showToast('ok', `"${deleteTarget.nama}" dihapus.`);
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      showToast('err', err instanceof Error ? err.message : 'Gagal menghapus.');
    } finally {
      setDeleting(false);
    }
  };

  const filtered = data.filter(r => r.nama.toLowerCase().includes(search.toLowerCase()) || r.kode.toLowerCase().includes(search.toLowerCase()));

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginatedData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <>
<Toast toast={toast}/>
      <TableCard accentColor="via-emerald-500/30">
        <div className="flex flex-col gap-3 px-5 py-4 border-b border-slate-100 dark:border-white/[0.06] sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none"/>
            <input type="text" placeholder="Cari status karyawan..." value={search} onChange={e=>setSearch(e.target.value)} className={`${inputCls} pl-10`}/>
          </div>
          <LiquidButton variant="outline" size="sm" onClick={openCreate} className="cursor-pointer font-bold flex items-center gap-2">
            <Plus className="h-4 w-4"/> Tambah Status
          </LiquidButton>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20 gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-emerald-555" />
              <span className="text-sm font-semibold text-slate-400">Memuat data status...</span>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-100 dark:border-white/[0.04]">{['Kode Status','Nama Status','Aksi'].map(h=><th key={h} className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 last:text-right">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.03]">
                {filtered.length === 0 ? (
                  <tr><td colSpan={3} className="px-5 py-10 text-center text-sm font-semibold text-slate-455 dark:text-slate-500">Tidak ada data.</td></tr>
                ) : paginatedData.map(r=>(
                  <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5"><span className="rounded-lg bg-slate-100 dark:bg-white/[0.06] px-2.5 py-1 text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase">{r.kode}</span></td>
                    <td className="px-5 py-3.5 font-bold text-slate-800 dark:text-slate-200">{r.nama}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={()=>openEdit(r)} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:bg-amber-500/10 hover:text-amber-500 transition-all cursor-pointer focus:outline-none"><Pencil className="h-3.5 w-3.5"/></button>
                        <button onClick={()=>setDeleteTarget(r)} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:bg-rose-500/10 hover:text-rose-500 transition-all cursor-pointer focus:outline-none"><Trash2 className="h-3.5 w-3.5"/></button>
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
                {filtered.length !== data.length && ` (disaring dari ${data.length} total)`}
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
      </TableCard>
      <ModalPortal open={modalOpen}>
        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={()=>setModalOpen(false)}/>
        <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
          <div className="pointer-events-auto w-full max-w-md animate-fade-up">
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0d1218] shadow-2xl">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent"/>
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-150 dark:border-white/[0.06]">
                <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-2"><Briefcase className="h-4 w-4 text-emerald-555 dark:text-emerald-400"/>{editTarget?'Edit Status Karyawan':'Tambah Status Karyawan'}</h2>
                <button onClick={()=>setModalOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:text-slate-700 dark:hover:text-slate-355 cursor-pointer focus:outline-none"><X className="h-4 w-4"/></button>
              </div>
              <div className="px-5 py-5 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={labelCls}>Kode Status *</label>
                    <input type="text" value={form.kode} onChange={e=>setForm(f=>({...f,kode:e.target.value.toUpperCase()}))} placeholder="TETAP" className={`${inputCls} ${errors.kode ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/10 dark:border-rose-500/50' : ''}`} maxLength={20}/>
                    {errors.kode && <span className="text-[10px] text-rose-500 mt-1 block font-bold">{errors.kode}</span>}
                  </div>
                  <div className="col-span-2">
                    <label className={labelCls}>Nama Status *</label>
                    <input type="text" value={form.nama} onChange={e=>setForm(f=>({...f,nama:e.target.value}))} placeholder="cth: Karyawan Tetap" className={`${inputCls} ${errors.nama ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/10 dark:border-rose-500/50' : ''}`}/>
                    {errors.nama && <span className="text-[10px] text-rose-500 mt-1 block font-bold">{errors.nama}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 border-t border-slate-150 dark:border-white/[0.06] px-5 py-4">
                <button disabled={saving} onClick={()=>setModalOpen(false)} className="rounded-xl border border-slate-250 dark:border-white/[0.08] px-4 py-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-all cursor-pointer focus:outline-none">Batal</button>
                <LiquidButton disabled={saving} variant="outline" size="sm" onClick={handleSave} className="cursor-pointer font-bold flex items-center gap-1.5">
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-550" />}
                  {editTarget?'Simpan':'Tambahkan'}
                </LiquidButton>
              </div>
            </div>
          </div>
        </div>
      </ModalPortal>
      <DeleteModal open={!!deleteTarget} name={deleteTarget?.nama??''} onCancel={()=>setDeleteTarget(null)} onConfirm={handleDelete} deleting={deleting}/>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: PENDIDIKAN
// ═══════════════════════════════════════════════════════════════════════════════
function TabPendidikan() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [data, setData]             = useState<Pendidikan[]>([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [search, setSearch]         = useState('');
  const [modalOpen, setModalOpen]   = useState(false);
  const [editTarget, setEditTarget] = useState<Pendidikan|null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Pendidikan|null>(null);
  const [form, setForm]             = useState({ singkatan:'', nama_lengkap:'', jenjang:1 });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);
  const [toast, setToast]           = useState<{type:'ok'|'err';text:string}|null>(null);

  const showToast = (t:'ok'|'err', text:string) => { setToast({type:t,text}); setTimeout(()=>setToast(null),3000); };

  const fetchData = useCallback(async () => {
    try {
      const res = await api.get<ApiPendidikan[]>('/master/pendidikan');
      const mapped = (res.data || []).map(r => ({
        id: r.id,
        singkatan: r.kode,
        nama_lengkap: r.label,
        jenjang: r.urutan,
      }));
      setData(mapped);
    } catch (err) {
      showToast('err', err instanceof Error ? err.message : 'Gagal memuat data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreate = () => { setEditTarget(null); setForm({singkatan:'',nama_lengkap:'',jenjang:data.length+1}); setErrors({}); setModalOpen(true); };
  const openEdit   = (r:Pendidikan) => { setEditTarget(r); setForm({singkatan:r.singkatan,nama_lengkap:r.nama_lengkap,jenjang:r.jenjang}); setErrors({}); setModalOpen(true); };

  const handleSave = async () => {
    setErrors({});
    const newErrors: Record<string, string> = {};
    if (!form.singkatan.trim()) { newErrors.singkatan = 'Singkatan wajib diisi.'; }
    if (!form.nama_lengkap.trim()) { newErrors.nama_lengkap = 'Nama Lengkap wajib diisi.'; }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast('err', 'Harap periksa form kembali.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        kode: form.singkatan.toUpperCase(),
        label: form.nama_lengkap,
        urutan: form.jenjang,
      };
      if (editTarget) {
        await api.put(`/master/pendidikan/${editTarget.id}`, payload);
        showToast('ok', `"${form.nama_lengkap}" diperbarui.`);
      } else {
        await api.post('/master/pendidikan', payload);
        showToast('ok', `"${form.nama_lengkap}" ditambahkan.`);
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      if (err instanceof ApiRequestError && err.details) {
        const fieldErrors: Record<string, string> = {};
        err.details.forEach(d => {
          let fieldName = d.field;
          if (fieldName === 'kode') fieldName = 'singkatan';
          if (fieldName === 'label') fieldName = 'nama_lengkap';
          if (fieldName === 'urutan') fieldName = 'jenjang';
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
  };

  const handleDelete = async () => {
    if(!deleteTarget)return;
    setDeleting(true);
    try {
      await api.delete(`/master/pendidikan/${deleteTarget.id}`);
      showToast('ok', `"${deleteTarget.nama_lengkap}" dihapus.`);
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      showToast('err', err instanceof Error ? err.message : 'Gagal menghapus.');
    } finally {
      setDeleting(false);
    }
  };

  const filtered = data.filter(r => r.nama_lengkap.toLowerCase().includes(search.toLowerCase()) || r.singkatan.toLowerCase().includes(search.toLowerCase()));

  const sortedData = useMemo(() => {
    return [...filtered].sort((a, b) => a.jenjang - b.jenjang);
  }, [filtered]);
  const totalPages = Math.max(1, Math.ceil(sortedData.length / itemsPerPage));
  const paginatedData = useMemo(() => {
    return sortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [sortedData, currentPage]);

  return (
    <>
      <Toast toast={toast}/>
      <TableCard accentColor="via-cyan-500/30">
        <div className="flex flex-col gap-3 px-5 py-4 border-b border-slate-100 dark:border-white/[0.06] sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none"/>
            <input type="text" placeholder="Cari jenjang pendidikan..." value={search} onChange={e=>setSearch(e.target.value)} className={`${inputCls} pl-10`}/>
          </div>
          <LiquidButton variant="outline" size="sm" onClick={openCreate} className="cursor-pointer font-bold flex items-center gap-2"><Plus className="h-4 w-4"/> Tambah Jenjang</LiquidButton>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20 gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-cyan-555" />
              <span className="text-sm font-semibold text-slate-400">Memuat data pendidikan...</span>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-100 dark:border-white/[0.04]">{['Jenjang','Singkatan','Nama Lengkap','Aksi'].map(h=><th key={h} className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 last:text-right">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.03]">
                {filtered.length === 0 ? (
                  <tr><td colSpan={4} className="px-5 py-10 text-center text-sm font-semibold text-slate-455 dark:text-slate-500">Tidak ada data.</td></tr>
                ) : paginatedData.map((r: Pendidikan)=>(
                  <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5 text-xs font-black text-slate-455 dark:text-slate-500">{r.jenjang}</td>
                    <td className="px-5 py-3.5"><span className="rounded-lg bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 text-[11px] font-black text-cyan-600 dark:text-cyan-400">{r.singkatan}</span></td>
                    <td className="px-5 py-3.5 font-bold text-slate-800 dark:text-slate-200">{r.nama_lengkap}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={()=>openEdit(r)} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:bg-amber-500/10 hover:text-amber-500 transition-all cursor-pointer focus:outline-none"><Pencil className="h-3.5 w-3.5"/></button>
                        <button onClick={()=>setDeleteTarget(r)} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:bg-rose-500/10 hover:text-rose-500 transition-all cursor-pointer focus:outline-none"><Trash2 className="h-3.5 w-3.5"/></button>
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
                {filtered.length !== data.length && ` (disaring dari ${data.length} total)`}
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
      </TableCard>
      <ModalPortal open={modalOpen}>
        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={()=>setModalOpen(false)}/>
        <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
          <div className="pointer-events-auto w-full max-w-sm animate-fade-up">
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0d1218] shadow-2xl">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/60 to-transparent"/>
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-150 dark:border-white/[0.06]">
                <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-2"><GraduationCap className="h-4 w-4 text-cyan-555 dark:text-cyan-400"/>{editTarget?'Edit Pendidikan':'Tambah Pendidikan'}</h2>
                <button onClick={()=>setModalOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:text-slate-700 dark:hover:text-slate-355 cursor-pointer focus:outline-none"><X className="h-4 w-4"/></button>
              </div>
              <div className="px-5 py-5 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div><label className={labelCls}>Singkatan *</label><input type="text" value={form.singkatan} onChange={e=>setForm(f=>({...f,singkatan:e.target.value}))} placeholder="S1" className={`${inputCls} ${errors.singkatan ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/10 dark:border-rose-500/50' : ''}`}/>
                  {errors.singkatan && <span className="text-[10px] text-rose-500 mt-1 block font-bold">{errors.singkatan}</span>}</div>
                  <div className="col-span-2"><label className={labelCls}>Nama Lengkap *</label><input type="text" value={form.nama_lengkap} onChange={e=>setForm(f=>({...f,nama_lengkap:e.target.value}))} placeholder="Sarjana" className={`${inputCls} ${errors.nama_lengkap ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/10 dark:border-rose-500/50' : ''}`}/>
                  {errors.nama_lengkap && <span className="text-[10px] text-rose-500 mt-1 block font-bold">{errors.nama_lengkap}</span>}</div>
                </div>
                <div><label className={labelCls}>Urutan Jenjang</label><input type="number" min={1} value={form.jenjang} onChange={e=>setForm(f=>({...f,jenjang:parseInt(e.target.value)||1}))} className={`${inputCls} ${errors.jenjang ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/10 dark:border-rose-500/50' : ''}`}/>
                {errors.jenjang && <span className="text-[10px] text-rose-500 mt-1 block font-bold">{errors.jenjang}</span>}</div>
              </div>
              <div className="flex items-center justify-end gap-3 border-t border-slate-150 dark:border-white/[0.06] px-5 py-4">
                <button disabled={saving} onClick={()=>setModalOpen(false)} className="rounded-xl border border-slate-250 dark:border-white/[0.08] px-4 py-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-all cursor-pointer focus:outline-none">Batal</button>
                <LiquidButton disabled={saving} variant="outline" size="sm" onClick={handleSave} className="cursor-pointer font-bold flex items-center gap-1.5">
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-550" />}
                  {editTarget?'Simpan':'Tambahkan'}
                </LiquidButton>
              </div>
            </div>
          </div>
        </div>
      </ModalPortal>
      <DeleteModal open={!!deleteTarget} name={deleteTarget?.nama_lengkap??''} onCancel={()=>setDeleteTarget(null)} onConfirm={handleDelete} deleting={deleting}/>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: STATUS PERNIKAHAN
// ═══════════════════════════════════════════════════════════════════════════════
function TabStatusNikah() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [data, setData]             = useState<StatusNikah[]>([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [search, setSearch]         = useState('');
  const [modalOpen, setModalOpen]   = useState(false);
  const [editTarget, setEditTarget] = useState<StatusNikah|null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StatusNikah|null>(null);
  const [form, setForm]             = useState({ nama:'' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);
  const [toast, setToast]           = useState<{type:'ok'|'err';text:string}|null>(null);

  const showToast = (t:'ok'|'err', text:string) => { setToast({type:t,text}); setTimeout(()=>setToast(null),3000); };

  const fetchData = useCallback(async () => {
    try {
      const res = await api.get<ApiStatusPernikahan[]>('/master/status-pernikahan');
      const mapped = (res.data || []).map(r => ({
        id: r.id,
        nama: r.label,
      }));
      setData(mapped);
    } catch (err) {
      showToast('err', err instanceof Error ? err.message : 'Gagal memuat data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreate = () => { setEditTarget(null); setForm({nama:''}); setErrors({}); setModalOpen(true); };
  const openEdit   = (r:StatusNikah) => { setEditTarget(r); setForm({nama:r.nama}); setErrors({}); setModalOpen(true); };

  const handleSave = async () => {
    setErrors({});
    const newErrors: Record<string, string> = {};
    if (!form.nama.trim()) { newErrors.nama = 'Nama Status wajib diisi.'; }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast('err', 'Harap periksa form kembali.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        kode: form.nama.toUpperCase().replace(/[^A-Z0-9]/g, '_'),
        label: form.nama,
      };
      if (editTarget) {
        await api.put(`/master/status-pernikahan/${editTarget.id}`, payload);
        showToast('ok', `"${form.nama}" diperbarui.`);
      } else {
        await api.post('/master/status-pernikahan', payload);
        showToast('ok', `"${form.nama}" ditambahkan.`);
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      if (err instanceof ApiRequestError && err.details) {
        const fieldErrors: Record<string, string> = {};
        err.details.forEach(d => {
          let fieldName = d.field;
          if (fieldName === 'label') fieldName = 'nama';
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
  };

  const handleDelete = async () => {
    if(!deleteTarget)return;
    setDeleting(true);
    try {
      await api.delete(`/master/status-pernikahan/${deleteTarget.id}`);
      showToast('ok','Data dihapus.');
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      showToast('err', err instanceof Error ? err.message : 'Gagal menghapus.');
    } finally {
      setDeleting(false);
    }
  };

  const filtered = data.filter(r => r.nama.toLowerCase().includes(search.toLowerCase()));

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginatedData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <>
      <Toast toast={toast}/>
      <TableCard accentColor="via-pink-500/30">
        <div className="flex flex-col gap-3 px-5 py-4 border-b border-slate-100 dark:border-white/[0.06] sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none"/>
            <input type="text" placeholder="Cari status pernikahan..." value={search} onChange={e=>setSearch(e.target.value)} className={`${inputCls} pl-10`}/>
          </div>
          <LiquidButton variant="outline" size="sm" onClick={openCreate} className="cursor-pointer font-bold flex items-center gap-2"><Plus className="h-4 w-4"/> Tambah Status</LiquidButton>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20 gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-pink-555" />
              <span className="text-sm font-semibold text-slate-400">Memuat data status pernikahan...</span>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-100 dark:border-white/[0.04]">{['Nama Status Pernikahan','Aksi'].map(h=><th key={h} className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 last:text-right">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.03]">
                {filtered.length === 0 ? (
                  <tr><td colSpan={2} className="px-5 py-10 text-center text-sm font-semibold text-slate-455 dark:text-slate-500">Tidak ada data.</td></tr>
                ) : paginatedData.map(r=>(
                  <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5 font-bold text-slate-800 dark:text-slate-200">{r.nama}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={()=>openEdit(r)} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:bg-amber-500/10 hover:text-amber-500 transition-all cursor-pointer focus:outline-none"><Pencil className="h-3.5 w-3.5"/></button>
                        <button onClick={()=>setDeleteTarget(r)} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:bg-rose-500/10 hover:text-rose-500 transition-all cursor-pointer focus:outline-none"><Trash2 className="h-3.5 w-3.5"/></button>
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
                {filtered.length !== data.length && ` (disaring dari ${data.length} total)`}
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
      </TableCard>
      <ModalPortal open={modalOpen}>
        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={()=>setModalOpen(false)}/>
        <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
          <div className="pointer-events-auto w-full max-w-sm animate-fade-up">
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0d1218] shadow-2xl">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-pink-500/60 to-transparent"/>
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-150 dark:border-white/[0.06]">
                <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-2"><Heart className="h-4 w-4 text-pink-555 dark:text-pink-400"/>{editTarget?'Edit Status':'Tambah Status'}</h2>
                <button onClick={()=>setModalOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:text-slate-700 dark:hover:text-slate-355 cursor-pointer focus:outline-none"><X className="h-4 w-4"/></button>
              </div>
              <div className="px-5 py-5 space-y-4">
                <div><label className={labelCls}>Nama Status *</label><input type="text" value={form.nama} onChange={e=>setForm(f=>({...f,nama:e.target.value}))} placeholder="cth: Menikah (Anak 1)" className={inputCls}/></div>
              </div>
              <div className="flex items-center justify-end gap-3 border-t border-slate-150 dark:border-white/[0.06] px-5 py-4">
                <button disabled={saving} onClick={()=>setModalOpen(false)} className="rounded-xl border border-slate-250 dark:border-white/[0.08] px-4 py-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-all cursor-pointer focus:outline-none">Batal</button>
                <LiquidButton disabled={saving} variant="outline" size="sm" onClick={handleSave} className="cursor-pointer font-bold flex items-center gap-1.5">
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-550" />}
                  {editTarget?'Simpan':'Tambahkan'}
                </LiquidButton>
              </div>
            </div>
          </div>
        </div>
      </ModalPortal>
      <DeleteModal open={!!deleteTarget} name={deleteTarget?.nama??''} onCancel={()=>setDeleteTarget(null)} onConfirm={handleDelete} deleting={deleting}/>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: GRADE / GOLONGAN
// ═══════════════════════════════════════════════════════════════════════════════
interface Grade { id:string; kode:string; nama:string; level:number; keterangan:string; }

interface ApiGrade {
  id: string;
  kode: string;
  label: string;
  level: number;
  keterangan: string | null;
}

function TabGrade() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [data, setData]             = useState<Grade[]>([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [search, setSearch]         = useState('');
  const [modalOpen, setModalOpen]   = useState(false);
  const [editTarget, setEditTarget] = useState<Grade|null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Grade|null>(null);
  const [form, setForm]             = useState({ kode: '', nama:'', level: 0, keterangan: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);
  const [toast, setToast]           = useState<{type:'ok'|'err';text:string}|null>(null);

  const showToast = (t:'ok'|'err', text:string) => { setToast({type:t,text}); setTimeout(()=>setToast(null),3000); };

  const fetchData = useCallback(async () => {
    try {
      const res = await api.get<ApiGrade[]>('/master/grade');
      const mapped = (res.data || []).map(r => ({
        id: r.id,
        kode: r.kode,
        nama: r.label,
        level: r.level,
        keterangan: r.keterangan || '',
      }));
      setData(mapped);
    } catch (err) {
      showToast('err', err instanceof Error ? err.message : 'Gagal memuat data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreate = () => { setEditTarget(null); setForm({ kode: '', nama:'', level: data.length + 1, keterangan: '' }); setErrors({}); setModalOpen(true); };
  const openEdit   = (r:Grade) => { setEditTarget(r); setForm({ kode: r.kode, nama:r.nama, level: r.level, keterangan: r.keterangan }); setErrors({}); setModalOpen(true); };

  const handleSave = async () => {
    setErrors({});
    const newErrors: Record<string, string> = {};
    if (!form.kode.trim()) { newErrors.kode = 'Kode wajib diisi.'; }
    if (!form.nama.trim()) { newErrors.nama = 'Nama Grade wajib diisi.'; }
    if (form.level < 0) { newErrors.level = 'Level tidak boleh negatif.'; }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast('err', 'Harap periksa form kembali.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        kode: form.kode.toUpperCase(),
        label: form.nama,
        level: form.level,
        keterangan: form.keterangan || null,
      };
      if (editTarget) {
        await api.put(`/master/grade/${editTarget.id}`, payload);
        showToast('ok', `"${form.nama}" diperbarui.`);
      } else {
        await api.post('/master/grade', payload);
        showToast('ok', `"${form.nama}" ditambahkan.`);
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      if (err instanceof ApiRequestError && err.details) {
        const fieldErrors: Record<string, string> = {};
        err.details.forEach(d => {
          let fieldName = d.field;
          if (fieldName === 'label') fieldName = 'nama';
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
  };

  const handleDelete = async () => {
    if(!deleteTarget)return;
    setDeleting(true);
    try {
      await api.delete(`/master/grade/${deleteTarget.id}`);
      showToast('ok', `"${deleteTarget.nama}" dihapus.`);
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      showToast('err', err instanceof Error ? err.message : 'Gagal menghapus.');
    } finally {
      setDeleting(false);
    }
  };

  const filtered = data.filter(r => r.nama.toLowerCase().includes(search.toLowerCase()) || r.kode.toLowerCase().includes(search.toLowerCase()));

  const sortedData = useMemo(() => {
    return [...filtered].sort((a, b) => b.level - a.level);
  }, [filtered]);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / itemsPerPage));
  const paginatedData = useMemo(() => {
    return sortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [sortedData, currentPage]);

  return (
    <>
      <Toast toast={toast}/>
      <TableCard accentColor="via-amber-500/30">
        <div className="flex flex-col gap-3 px-5 py-4 border-b border-slate-100 dark:border-white/[0.06] sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none"/>
            <input type="text" placeholder="Cari grade..." value={search} onChange={e=>setSearch(e.target.value)} className={`${inputCls} pl-10`}/>
          </div>
          <LiquidButton variant="outline" size="sm" onClick={openCreate} className="cursor-pointer font-bold flex items-center gap-2">
            <Plus className="h-4 w-4"/> Tambah Grade
          </LiquidButton>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20 gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
              <span className="text-sm font-semibold text-slate-400">Memuat data grade...</span>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-100 dark:border-white/[0.04]">{['No','Level Rank','Kode Grade','Nama Grade','Keterangan','Aksi'].map(h=><th key={h} className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 last:text-right">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.03]">
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="px-5 py-10 text-center text-sm font-semibold text-slate-455 dark:text-slate-500">Tidak ada data.</td></tr>
                ) : paginatedData.map((r, idx)=>(
                  <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5 text-xs font-black text-slate-455 dark:text-slate-500">{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                    <td className="px-5 py-3.5 text-xs font-black text-slate-455 dark:text-slate-500">{r.level}</td>
                    <td className="px-5 py-3.5"><span className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 text-[11px] font-black text-amber-600 dark:text-amber-400 uppercase">{r.kode}</span></td>
                    <td className="px-5 py-3.5 font-bold text-slate-800 dark:text-slate-200">{r.nama}</td>
                    <td className="px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400">{r.keterangan || '-'}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={()=>openEdit(r)} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:bg-amber-500/10 hover:text-amber-500 transition-all cursor-pointer focus:outline-none"><Pencil className="h-3.5 w-3.5"/></button>
                        <button onClick={()=>setDeleteTarget(r)} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:bg-rose-500/10 hover:text-rose-500 transition-all cursor-pointer focus:outline-none"><Trash2 className="h-3.5 w-3.5"/></button>
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
                {filtered.length !== data.length && ` (disaring dari ${data.length} total)`}
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
      </TableCard>
      <ModalPortal open={modalOpen}>
        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={()=>setModalOpen(false)}/>
        <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
          <div className="pointer-events-auto w-full max-w-md animate-fade-up">
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0d1218] shadow-2xl">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/60 to-transparent"/>
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-150 dark:border-white/[0.06]">
                <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-2"><Building2 className="h-4 w-4 text-amber-555 dark:text-amber-400"/>{editTarget?'Edit Grade / Golongan':'Tambah Grade / Golongan'}</h2>
                <button onClick={()=>setModalOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:text-slate-700 dark:hover:text-slate-355 cursor-pointer focus:outline-none"><X className="h-4 w-4"/></button>
              </div>
              <div className="px-5 py-5 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={labelCls}>Kode Grade *</label>
                    <input type="text" value={form.kode} onChange={e=>setForm(f=>({...f,kode:e.target.value.toUpperCase()}))} placeholder="IA" className={`${inputCls} ${errors.kode ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/10 dark:border-rose-500/50' : ''}`} maxLength={20}/>
                    {errors.kode && <span className="text-[10px] text-rose-500 mt-1 block font-bold">{errors.kode}</span>}
                  </div>
                  <div className="col-span-2">
                    <label className={labelCls}>Nama Grade / Jabatan *</label>
                    <input type="text" value={form.nama} onChange={e=>setForm(f=>({...f,nama:e.target.value}))} placeholder="cth: Direktur / Manager" className={`${inputCls} ${errors.nama ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/10 dark:border-rose-500/50' : ''}`}/>
                    {errors.nama && <span className="text-[10px] text-rose-500 mt-1 block font-bold">{errors.nama}</span>}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={labelCls}>Level Rank *</label>
                    <input type="number" min={0} value={form.level} onChange={e=>setForm(f=>({...f,level:parseInt(e.target.value)||0}))} className={`${inputCls} ${errors.level ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/10 dark:border-rose-500/50' : ''}`}/>
                    {errors.level && <span className="text-[10px] text-rose-500 mt-1 block font-bold">{errors.level}</span>}
                  </div>
                  <div className="col-span-2">
                    <label className={labelCls}>Keterangan</label>
                    <input type="text" value={form.keterangan} onChange={e=>setForm(f=>({...f,keterangan:e.target.value}))} placeholder="cth: Golongan IA" className={inputCls}/>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 border-t border-slate-150 dark:border-white/[0.06] px-5 py-4">
                <button disabled={saving} onClick={()=>setModalOpen(false)} className="rounded-xl border border-slate-250 dark:border-white/[0.08] px-4 py-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-all cursor-pointer focus:outline-none">Batal</button>
                <LiquidButton disabled={saving} variant="outline" size="sm" onClick={handleSave} className="cursor-pointer font-bold flex items-center gap-1.5">
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-555" />}
                  {editTarget?'Simpan':'Tambahkan'}
                </LiquidButton>
              </div>
            </div>
          </div>
        </div>
      </ModalPortal>
      <DeleteModal open={!!deleteTarget} name={deleteTarget?.nama??''} onCancel={()=>setDeleteTarget(null)} onConfirm={handleDelete} deleting={deleting}/>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TABS CONFIG
// ═══════════════════════════════════════════════════════════════════════════════
const TABS = [
  { id:'status-kary', label:'Status Karyawan',    icon:Briefcase,     accentText:'text-emerald-600 dark:text-emerald-450',accentBg:'bg-emerald-500/10',accentBorder:'border-emerald-500/30',Component:TabStatusKaryawan},
  { id:'grade',       label:'Grade / Golongan',   icon:Building2,     accentText:'text-amber-600 dark:text-amber-450',   accentBg:'bg-amber-500/10',   accentBorder:'border-amber-500/30',   Component:TabGrade         },
  { id:'pendidikan',  label:'Pendidikan',         icon:GraduationCap, accentText:'text-cyan-600 dark:text-cyan-400',   accentBg:'bg-cyan-500/10',   accentBorder:'border-cyan-500/30',   Component:TabPendidikan    },
  { id:'status-nikah',label:'Status Pernikahan',  icon:Heart,         accentText:'text-pink-600 dark:text-pink-400',   accentBg:'bg-pink-500/10',   accentBorder:'border-pink-500/30',   Component:TabStatusNikah   },
];

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function MasterDataPage() {
  const [activeTab, setActiveTab] = useState('status-kary');
  const Active = TABS.find(t=>t.id===activeTab)!;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2.5">
          <Building2 className="h-6 w-6 text-amber-550 dark:text-amber-400"/>
          Master Data
        </h1>
        <p className="mt-1 text-sm font-semibold text-slate-550 dark:text-slate-400">
          Kelola data referensi sistem Portal SSO PT INL — Status Karyawan, Pendidikan, dan Status Pernikahan.
        </p>
      </div>

      {/* Tab Bar */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-white/[0.06] bg-white dark:bg-[#0f1623] shadow-lg">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-100 dark:via-white/10 to-transparent"/>
        <div className="flex overflow-x-auto">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3.5 text-xs font-black whitespace-nowrap transition-all duration-200 cursor-pointer focus:outline-none border-b-2 ${
                  isActive
                    ? `border-amber-500 ${tab.accentText} ${tab.accentBg}`
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.02]'
                }`}
              >
                <Icon className="h-3.5 w-3.5"/>
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        <Active.Component/>
      </div>
    </div>
  );
}
