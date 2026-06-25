'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2, Briefcase, GraduationCap, Heart,
  Plus, Pencil, Trash2, X, CheckCircle2, AlertCircle, Search,
  ToggleLeft, ToggleRight, Loader2, ChevronDown
} from 'lucide-react';
import { ModalPortal } from '@/components/ui/ModalPortal';
import { LiquidButton } from '@/components/animate-ui/components/buttons/liquid';
import { api } from '@/lib/api';

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
  const [data, setData]             = useState<StatusKary[]>([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [search, setSearch]         = useState('');
  const [modalOpen, setModalOpen]   = useState(false);
  const [editTarget, setEditTarget] = useState<StatusKary|null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StatusKary|null>(null);
  const [form, setForm]             = useState({ kode: '', nama:'' });
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

  const openCreate = () => { setEditTarget(null); setForm({ kode: '', nama:'' }); setModalOpen(true); };
  const openEdit   = (r:StatusKary) => { setEditTarget(r); setForm({ kode: r.kode, nama:r.nama }); setModalOpen(true); };

  const handleSave = async () => {
    if (!form.kode.trim()) { showToast('err', 'Kode wajib diisi.'); return; }
    if (!form.nama.trim()) { showToast('err', 'Nama Status wajib diisi.'); return; }
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
      showToast('err', err instanceof Error ? err.message : 'Gagal menyimpan.');
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
                  <tr><td colSpan={3} className="px-5 py-10 text-center text-sm font-semibold text-slate-400 dark:text-slate-500">Tidak ada data.</td></tr>
                ) : filtered.map(r=>(
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
                    <input type="text" value={form.kode} onChange={e=>setForm(f=>({...f,kode:e.target.value.toUpperCase()}))} placeholder="TETAP" className={inputCls} maxLength={20}/>
                  </div>
                  <div className="col-span-2">
                    <label className={labelCls}>Nama Status *</label>
                    <input type="text" value={form.nama} onChange={e=>setForm(f=>({...f,nama:e.target.value}))} placeholder="cth: Karyawan Tetap" className={inputCls}/>
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
  const [data, setData]             = useState<Pendidikan[]>([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [search, setSearch]         = useState('');
  const [modalOpen, setModalOpen]   = useState(false);
  const [editTarget, setEditTarget] = useState<Pendidikan|null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Pendidikan|null>(null);
  const [form, setForm]             = useState({ singkatan:'', nama_lengkap:'', jenjang:1 });
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

  const openCreate = () => { setEditTarget(null); setForm({singkatan:'',nama_lengkap:'',jenjang:data.length+1}); setModalOpen(true); };
  const openEdit   = (r:Pendidikan) => { setEditTarget(r); setForm({singkatan:r.singkatan,nama_lengkap:r.nama_lengkap,jenjang:r.jenjang}); setModalOpen(true); };

  const handleSave = async () => {
    if (!form.singkatan.trim()) { showToast('err', 'Singkatan wajib diisi.'); return; }
    if (!form.nama_lengkap.trim()) { showToast('err', 'Nama Lengkap wajib diisi.'); return; }
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
      showToast('err', err instanceof Error ? err.message : 'Gagal menyimpan.');
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
                  <tr><td colSpan={4} className="px-5 py-10 text-center text-sm font-semibold text-slate-400 dark:text-slate-500">Tidak ada data.</td></tr>
                ) : [...filtered].sort((a,b)=>a.jenjang-b.jenjang).map(r=>(
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
                  <div><label className={labelCls}>Singkatan *</label><input type="text" value={form.singkatan} onChange={e=>setForm(f=>({...f,singkatan:e.target.value}))} placeholder="S1" className={inputCls}/></div>
                  <div className="col-span-2"><label className={labelCls}>Nama Lengkap *</label><input type="text" value={form.nama_lengkap} onChange={e=>setForm(f=>({...f,nama_lengkap:e.target.value}))} placeholder="Sarjana" className={inputCls}/></div>
                </div>
                <div><label className={labelCls}>Urutan Jenjang</label><input type="number" min={1} value={form.jenjang} onChange={e=>setForm(f=>({...f,jenjang:parseInt(e.target.value)||1}))} className={inputCls}/></div>
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
  const [data, setData]             = useState<StatusNikah[]>([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [search, setSearch]         = useState('');
  const [modalOpen, setModalOpen]   = useState(false);
  const [editTarget, setEditTarget] = useState<StatusNikah|null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StatusNikah|null>(null);
  const [form, setForm]             = useState({ nama:'' });
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

  const openCreate = () => { setEditTarget(null); setForm({nama:''}); setModalOpen(true); };
  const openEdit   = (r:StatusNikah) => { setEditTarget(r); setForm({nama:r.nama}); setModalOpen(true); };

  const handleSave = async () => {
    if (!form.nama.trim()) { showToast('err', 'Nama Status wajib diisi.'); return; }
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
      showToast('err', err instanceof Error ? err.message : 'Gagal menyimpan.');
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
                  <tr><td colSpan={2} className="px-5 py-10 text-center text-sm font-semibold text-slate-400 dark:text-slate-500">Tidak ada data.</td></tr>
                ) : filtered.map(r=>(
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
// TABS CONFIG
// ═══════════════════════════════════════════════════════════════════════════════
const TABS = [
  { id:'status-kary', label:'Status Karyawan',    icon:Briefcase,     accentText:'text-emerald-600 dark:text-emerald-450',accentBg:'bg-emerald-500/10',accentBorder:'border-emerald-500/30',Component:TabStatusKaryawan},
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
