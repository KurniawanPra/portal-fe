'use client';

import React, { useState, useCallback } from 'react';
import {
  Building2, GitBranch, Briefcase, GraduationCap, Heart,
  Plus, Pencil, Trash2, X, CheckCircle2, AlertCircle, Search,
  Check, ToggleLeft, ToggleRight, ChevronDown
} from 'lucide-react';
import { ModalPortal } from '@/components/ui/ModalPortal';
import { LiquidButton } from '@/components/animate-ui/components/buttons/liquid';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Bagian      { id:string; kode:string; nama:string; is_active:boolean; }
interface SubBagian   { id:string; kode:string; nama:string; bagian_id:string; is_active:boolean; }
interface StatusKary  { id:string; nama:string; deskripsi:string; is_active:boolean; }
interface Pendidikan  { id:string; singkatan:string; nama_lengkap:string; jenjang:number; }
interface StatusNikah { id:string; nama:string; }

// ─── Mock Data ────────────────────────────────────────────────────────────────
const INIT_BAGIAN: Bagian[] = [
  { id:'b-1', kode:'TID', nama:'Teknologi Informasi & Digital',   is_active:true  },
  { id:'b-2', kode:'KEU', nama:'Keuangan & Akuntansi',            is_active:true  },
  { id:'b-3', kode:'SDM', nama:'Sumber Daya Manusia',             is_active:true  },
  { id:'b-4', kode:'OPR', nama:'Operasional & Produksi',          is_active:true  },
  { id:'b-5', kode:'MKT', nama:'Marketing & Komunikasi',          is_active:true  },
  { id:'b-6', kode:'LGL', nama:'Legal & Compliance',              is_active:false },
  { id:'b-7', kode:'LOG', nama:'Logistik & Supply Chain',         is_active:true  },
];

const INIT_SUBBAGIAN: SubBagian[] = [
  { id:'sb-1', kode:'IJK', nama:'Infrastruktur, Jaringan & Keamanan', bagian_id:'b-1', is_active:true  },
  { id:'sb-2', kode:'DEV', nama:'Pengembangan Sistem & Aplikasi',      bagian_id:'b-1', is_active:true  },
  { id:'sb-3', kode:'AKT', nama:'Akuntansi & Pelaporan',               bagian_id:'b-2', is_active:true  },
  { id:'sb-4', kode:'KAS', nama:'Kas & Treasury',                       bagian_id:'b-2', is_active:true  },
  { id:'sb-5', kode:'RKT', nama:'Rekrutmen & Talent',                   bagian_id:'b-3', is_active:true  },
  { id:'sb-6', kode:'PYL', nama:'Penggajian & Payroll',                 bagian_id:'b-3', is_active:true  },
  { id:'sb-7', kode:'PLT', nama:'Operasi Pabrik & Pengolahan',          bagian_id:'b-4', is_active:true  },
  { id:'sb-8', kode:'QAC', nama:'Quality Assurance & Control',          bagian_id:'b-4', is_active:false },
];

const INIT_STATUS_KARY: StatusKary[] = [
  { id:'sk-1', nama:'Karyawan Tetap',    deskripsi:'PKWTT — Perjanjian Kerja Waktu Tidak Tertentu', is_active:true },
  { id:'sk-2', nama:'PKWT',             deskripsi:'Perjanjian Kerja Waktu Tertentu (kontrak)',      is_active:true },
  { id:'sk-3', nama:'Outsourcing',       deskripsi:'Karyawan dari perusahaan pihak ketiga',          is_active:true },
  { id:'sk-4', nama:'Magang',           deskripsi:'Peserta magang / internship',                     is_active:true },
  { id:'sk-5', nama:'Honorer',           deskripsi:'Tenaga honorer non-ASN / non-PKWTT',             is_active:true },
  { id:'sk-6', nama:'Pensiunan Aktif',   deskripsi:'Mantan karyawan tetap yang masih berkontribusi', is_active:false},
];

const INIT_PENDIDIKAN: Pendidikan[] = [
  { id:'pd-1', singkatan:'SD',     nama_lengkap:'Sekolah Dasar',                   jenjang:1 },
  { id:'pd-2', singkatan:'SMP',    nama_lengkap:'Sekolah Menengah Pertama',        jenjang:2 },
  { id:'pd-3', singkatan:'SMA',    nama_lengkap:'Sekolah Menengah Atas / SMK',     jenjang:3 },
  { id:'pd-4', singkatan:'D1',     nama_lengkap:'Diploma 1',                       jenjang:4 },
  { id:'pd-5', singkatan:'D2',     nama_lengkap:'Diploma 2',                       jenjang:5 },
  { id:'pd-6', singkatan:'D3',     nama_lengkap:'Diploma 3',                       jenjang:6 },
  { id:'pd-7', singkatan:'D4/S1',  nama_lengkap:'Diploma 4 / Sarjana',             jenjang:7 },
  { id:'pd-8', singkatan:'S2',     nama_lengkap:'Magister / Master',               jenjang:8 },
  { id:'pd-9', singkatan:'S3',     nama_lengkap:'Doktor / PhD',                    jenjang:9 },
];

const INIT_STATUS_NIKAH: StatusNikah[] = [
  { id:'sn-1', nama:'Belum Menikah' },
  { id:'sn-2', nama:'Menikah'       },
  { id:'sn-3', nama:'Cerai Hidup'   },
  { id:'sn-4', nama:'Cerai Mati'    },
];

// ─── Shared Styles ────────────────────────────────────────────────────────────
const inputCls  = 'w-full rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0a0f1a] px-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10 transition-all duration-200';
const labelCls  = 'mb-1.5 block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400';

// ─── Toast utility ────────────────────────────────────────────────────────────
function Toast({ toast }: { toast: {type:'ok'|'err'; text:string} | null }) {
  if (!toast) return null;
  return (
    <div className={`fixed top-6 right-6 z-[9998] flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-semibold shadow-2xl backdrop-blur-xl ${toast.type==='ok' ? 'bg-[#0f1a10]/95 border-emerald-500/30 text-emerald-300' : 'bg-[#1a0f10]/95 border-rose-500/30 text-rose-300'}`}>
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
function ActiveToggle({ value, onChange }: { value:boolean; onChange:(v:boolean)=>void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide transition-all duration-200 cursor-pointer focus:outline-none ${value ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border-emerald-500/20 hover:bg-emerald-500/20' : 'bg-slate-100 dark:bg-white/[0.04] text-slate-500 border-slate-200 dark:border-white/[0.06] hover:bg-slate-250 dark:hover:bg-white/[0.08]'}`}
    >
      {value ? <ToggleRight className="h-3 w-3"/> : <ToggleLeft className="h-3 w-3"/>}
      {value ? 'Aktif' : 'Nonaktif'}
    </button>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
function DeleteModal({ open, name, onCancel, onConfirm }: { open:boolean; name:string; onCancel:()=>void; onConfirm:()=>void }) {
  return (
    <ModalPortal open={open}>
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={onCancel}/>
      <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-sm">
          <div className="relative overflow-hidden rounded-2xl border border-rose-500/20 bg-white dark:bg-[#0d1218] shadow-2xl p-6 text-center">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rose-500/50 to-transparent"/>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20">
              <Trash2 className="h-5 w-5 text-rose-500 dark:text-rose-400"/>
            </div>
            <h3 className="text-base font-black text-slate-800 dark:text-slate-100">Hapus Data?</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Data <span className="font-bold text-slate-800 dark:text-slate-200">"{name}"</span> akan dihapus permanen.
            </p>
            <div className="mt-5 flex gap-3">
              <button onClick={onCancel} className="flex-1 rounded-xl border border-slate-200 dark:border-white/[0.08] px-4 py-2.5 text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-all cursor-pointer">Batal</button>
              <button onClick={onConfirm} className="flex-1 rounded-xl bg-rose-500/90 hover:bg-rose-500 px-4 py-2.5 text-sm font-bold text-white transition-all cursor-pointer shadow-lg shadow-rose-500/20">Hapus</button>
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: BAGIAN
// ═══════════════════════════════════════════════════════════════════════════════
function TabBagian() {
  const [data, setData]             = useState<Bagian[]>(INIT_BAGIAN);
  const [search, setSearch]         = useState('');
  const [modalOpen, setModalOpen]   = useState(false);
  const [editTarget, setEditTarget] = useState<Bagian|null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Bagian|null>(null);
  const [form, setForm]             = useState({ kode:'', nama:'', is_active:true });
  const [toast, setToast]           = useState<{type:'ok'|'err';text:string}|null>(null);

  const showToast = (t:'ok'|'err', text:string) => { setToast({type:t,text}); setTimeout(()=>setToast(null),3000); };
  const openCreate = () => { setEditTarget(null); setForm({kode:'',nama:'',is_active:true}); setModalOpen(true); };
  const openEdit   = (r:Bagian) => { setEditTarget(r); setForm({kode:r.kode,nama:r.nama,is_active:r.is_active}); setModalOpen(true); };

  const handleSave = () => {
    if (!form.kode.trim()||!form.nama.trim()) { showToast('err','Kode dan Nama wajib diisi.'); return; }
    if (editTarget) { setData(p=>p.map(r=>r.id===editTarget.id?{...r,...form}:r)); showToast('ok',`"${form.nama}" diperbarui.`); }
    else            { setData(p=>[...p,{...form,id:`b-${Date.now()}`}]); showToast('ok',`"${form.nama}" ditambahkan.`); }
    setModalOpen(false);
  };
  const handleDelete = () => { if(!deleteTarget)return; setData(p=>p.filter(r=>r.id!==deleteTarget.id)); showToast('ok',`"${deleteTarget.nama}" dihapus.`); setDeleteTarget(null); };

  const filtered = data.filter(r=>r.nama.toLowerCase().includes(search.toLowerCase())||r.kode.toLowerCase().includes(search.toLowerCase()));
  const active = data.filter(r=>r.is_active).length;

  return (
    <>
      <Toast toast={toast}/>
      {/* Flat stats */}
      <div className="flex items-center gap-x-6 gap-y-2 flex-wrap mb-4">
        {[{label:'Total',value:data.length,color:'text-amber-500 dark:text-amber-400'},{label:'Aktif',value:active,color:'text-emerald-500 dark:text-emerald-450'},{label:'Nonaktif',value:data.length-active,color:'text-slate-450 dark:text-slate-500'}].map((s,i,a)=>(
          <React.Fragment key={s.label}>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-black ${s.color}`}>{s.value}</span>
              <span className="text-xs font-bold text-slate-500">{s.label}</span>
            </div>
            {i<a.length-1&&<span className="h-3.5 w-px bg-slate-200 dark:bg-white/[0.1]"/>}
          </React.Fragment>
        ))}
      </div>
      <TableCard accentColor="via-amber-500/30">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 px-5 py-4 border-b border-slate-100 dark:border-white/[0.06] sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none"/>
            <input type="text" placeholder="Cari kode atau nama bagian..." value={search} onChange={e=>setSearch(e.target.value)} className={`${inputCls} pl-10`}/>
          </div>
          <LiquidButton variant="outline" size="sm" onClick={openCreate} className="cursor-pointer font-bold flex items-center gap-2">
            <Plus className="h-4 w-4"/> Tambah Bagian
          </LiquidButton>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-white/[0.04]">
                {['Kode','Nama Bagian','Status','Aksi'].map(h=><th key={h} className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 last:text-right">{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.03]">
              {filtered.length===0 ? (
                <tr><td colSpan={4} className="px-5 py-10 text-center text-sm font-semibold text-slate-400 dark:text-slate-500">Tidak ada data.</td></tr>
              ) : filtered.map(r=>(
                <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3.5"><span className="rounded-lg bg-slate-100 dark:bg-white/[0.06] px-2.5 py-1 text-[11px] font-black text-amber-600 dark:text-amber-400 uppercase">{r.kode}</span></td>
                  <td className="px-5 py-3.5 font-bold text-slate-800 dark:text-slate-200 text-sm">{r.nama}</td>
                  <td className="px-5 py-3.5"><ActiveToggle value={r.is_active} onChange={v=>setData(p=>p.map(x=>x.id===r.id?{...x,is_active:v}:x))}/></td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={()=>openEdit(r)} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:bg-amber-500/10 hover:text-amber-500 transition-all cursor-pointer"><Pencil className="h-3.5 w-3.5"/></button>
                      <button onClick={()=>setDeleteTarget(r)} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:bg-rose-500/10 hover:text-rose-500 transition-all cursor-pointer"><Trash2 className="h-3.5 w-3.5"/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-slate-100 dark:border-white/[0.04] text-[11px] font-bold text-slate-450 dark:text-slate-500">{filtered.length} dari {data.length} bagian</div>
      </TableCard>

      {/* Modal Create/Edit */}
      <ModalPortal open={modalOpen}>
        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={()=>setModalOpen(false)}/>
        <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
          <div className="pointer-events-auto w-full max-w-md">
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0d1218] shadow-2xl">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/60 to-transparent"/>
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-150 dark:border-white/[0.06]">
                <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-2"><Building2 className="h-4 w-4 text-amber-550 dark:text-amber-400"/>{editTarget?'Edit Bagian':'Tambah Bagian'}</h2>
                <button onClick={()=>setModalOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:text-slate-700 dark:hover:text-slate-355 transition-all cursor-pointer"><X className="h-4 w-4"/></button>
              </div>
              <div className="px-5 py-5 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={labelCls}>Kode *</label>
                    <input type="text" value={form.kode} onChange={e=>setForm(f=>({...f,kode:e.target.value.toUpperCase()}))} placeholder="TID" className={inputCls} maxLength={5}/>
                  </div>
                  <div className="col-span-2">
                    <label className={labelCls}>Nama Bagian *</label>
                    <input type="text" value={form.nama} onChange={e=>setForm(f=>({...f,nama:e.target.value}))} placeholder="Nama departemen" className={inputCls}/>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02] px-4 py-3">
                  <div>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Status Aktif</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Bagian {form.is_active?'aktif dan':'nonaktif, tidak'} terlihat dalam sistem</p>
                  </div>
                  <button onClick={()=>setForm(f=>({...f,is_active:!f.is_active}))}
                    className={`relative flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200 cursor-pointer ${form.is_active?'bg-amber-500':'bg-slate-250 dark:bg-white/[0.1]'}`}>
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all duration-200 ${form.is_active?'left-5':'left-0.5'}`}/>
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 border-t border-slate-150 dark:border-white/[0.06] px-5 py-4">
                <button onClick={()=>setModalOpen(false)} className="rounded-xl border border-slate-250 dark:border-white/[0.08] px-4 py-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-all cursor-pointer">Batal</button>
                <LiquidButton variant="outline" size="sm" onClick={handleSave} className="cursor-pointer font-bold">{editTarget?'Simpan':'Tambahkan'}</LiquidButton>
              </div>
            </div>
          </div>
        </div>
      </ModalPortal>
      <DeleteModal open={!!deleteTarget} name={deleteTarget?.nama??''} onCancel={()=>setDeleteTarget(null)} onConfirm={handleDelete}/>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: SUB BAGIAN
// ═══════════════════════════════════════════════════════════════════════════════
function TabSubBagian() {
  const [bagians]                   = useState<Bagian[]>(INIT_BAGIAN);
  const [data, setData]             = useState<SubBagian[]>(INIT_SUBBAGIAN);
  const [search, setSearch]         = useState('');
  const [filterBagian, setFilterBagian] = useState('Semua');
  const [modalOpen, setModalOpen]   = useState(false);
  const [editTarget, setEditTarget] = useState<SubBagian|null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SubBagian|null>(null);
  const [form, setForm]             = useState({ kode:'', nama:'', bagian_id:'', is_active:true });
  const [toast, setToast]           = useState<{type:'ok'|'err';text:string}|null>(null);

  const showToast = (t:'ok'|'err', text:string) => { setToast({type:t,text}); setTimeout(()=>setToast(null),3000); };
  const openCreate = () => { setEditTarget(null); setForm({kode:'',nama:'',bagian_id:bagians[0]?.id??'',is_active:true}); setModalOpen(true); };
  const openEdit   = (r:SubBagian) => { setEditTarget(r); setForm({kode:r.kode,nama:r.nama,bagian_id:r.bagian_id,is_active:r.is_active}); setModalOpen(true); };

  const handleSave = () => {
    if (!form.kode.trim()||!form.nama.trim()||!form.bagian_id) { showToast('err','Semua field wajib diisi.'); return; }
    if (editTarget) { setData(p=>p.map(r=>r.id===editTarget.id?{...r,...form}:r)); showToast('ok',`"${form.nama}" diperbarui.`); }
    else            { setData(p=>[...p,{...form,id:`sb-${Date.now()}`}]); showToast('ok',`"${form.nama}" ditambahkan.`); }
    setModalOpen(false);
  };
  const handleDelete = () => { if(!deleteTarget)return; setData(p=>p.filter(r=>r.id!==deleteTarget.id)); showToast('ok',`"${deleteTarget.nama}" dihapus.`); setDeleteTarget(null); };

  const getBagianName = (id:string) => bagians.find(b=>b.id===id)?.nama ?? '-';
  const getBagianKode = (id:string) => bagians.find(b=>b.id===id)?.kode ?? '';

  const filtered = data.filter(r=>{
    const q = search.toLowerCase();
    return (r.nama.toLowerCase().includes(q)||r.kode.toLowerCase().includes(q))
      && (filterBagian==='Semua'||r.bagian_id===filterBagian);
  });

  return (
    <>
      <Toast toast={toast}/>
      <div className="flex items-center gap-x-6 gap-y-2 flex-wrap mb-4">
        {[{label:'Total Sub Bagian',value:data.length,color:'text-indigo-500 dark:text-indigo-400'},{label:'Aktif',value:data.filter(r=>r.is_active).length,color:'text-emerald-500 dark:text-emerald-450'}].map((s,i,a)=>(
          <React.Fragment key={s.label}>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-black ${s.color}`}>{s.value}</span>
              <span className="text-xs font-bold text-slate-500">{s.label}</span>
            </div>
            {i<a.length-1&&<span className="h-3.5 w-px bg-slate-200 dark:bg-white/[0.1]"/>}
          </React.Fragment>
        ))}
      </div>
      <TableCard accentColor="via-indigo-500/30">
        <div className="flex flex-col gap-3 px-5 py-4 border-b border-slate-100 dark:border-white/[0.06] sm:flex-row sm:items-center sm:justify-between flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none"/>
              <input type="text" placeholder="Cari sub bagian..." value={search} onChange={e=>setSearch(e.target.value)} className={`${inputCls} pl-10`}/>
            </div>
            <select value={filterBagian} onChange={e=>setFilterBagian(e.target.value)} className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-[#0a0f1a] bg-slate-50 dark:bg-[#0a0f1a] px-3 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-305 outline-none focus:border-indigo-500/40 cursor-pointer transition-all">
              <option value="Semua" className="bg-white dark:bg-[#0a0f1a] text-slate-800 dark:text-slate-100">Semua Bagian</option>
              {bagians.map(b=><option key={b.id} value={b.id} className="bg-white dark:bg-[#0a0f1a] text-slate-800 dark:text-slate-100">{b.kode} — {b.nama}</option>)}
            </select>
          </div>
          <LiquidButton variant="outline" size="sm" onClick={openCreate} className="cursor-pointer font-bold flex items-center gap-2">
            <Plus className="h-4 w-4"/> Tambah Sub Bagian
          </LiquidButton>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-white/[0.04]">
                {['Kode','Nama Sub Bagian','Bagian Induk','Status','Aksi'].map(h=><th key={h} className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 last:text-right">{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.03]">
              {filtered.length===0 ? (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-sm font-semibold text-slate-400 dark:text-slate-500">Tidak ada data.</td></tr>
              ) : filtered.map(r=>(
                <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3.5"><span className="rounded-lg bg-slate-100 dark:bg-white/[0.06] px-2.5 py-1 text-[11px] font-black text-indigo-600 dark:text-indigo-400 uppercase">{r.kode}</span></td>
                  <td className="px-5 py-3.5 font-bold text-slate-800 dark:text-slate-200 text-sm">{r.nama}</td>
                  <td className="px-5 py-3.5">
                    <div>
                      <span className="text-[10px] font-black text-amber-600 dark:text-amber-400">{getBagianKode(r.bagian_id)}</span>
                      <p className="text-[11px] text-slate-450 dark:text-slate-500 mt-0.5">{getBagianName(r.bagian_id)}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3.5"><ActiveToggle value={r.is_active} onChange={v=>setData(p=>p.map(x=>x.id===r.id?{...x,is_active:v}:x))}/></td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={()=>openEdit(r)} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:bg-amber-500/10 hover:text-amber-500 transition-all cursor-pointer"><Pencil className="h-3.5 w-3.5"/></button>
                      <button onClick={()=>setDeleteTarget(r)} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:bg-rose-500/10 hover:text-rose-500 transition-all cursor-pointer"><Trash2 className="h-3.5 w-3.5"/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-slate-100 dark:border-white/[0.04] text-[11px] font-bold text-slate-450 dark:text-slate-500">{filtered.length} dari {data.length} sub bagian</div>
      </TableCard>
      <ModalPortal open={modalOpen}>
        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={()=>setModalOpen(false)}/>
        <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
          <div className="pointer-events-auto w-full max-w-md">
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0d1218] shadow-2xl">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/60 to-transparent"/>
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-150 dark:border-white/[0.06]">
                <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-2"><GitBranch className="h-4 w-4 text-indigo-550 dark:text-indigo-400"/>{editTarget?'Edit Sub Bagian':'Tambah Sub Bagian'}</h2>
                <button onClick={()=>setModalOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:text-slate-700 dark:hover:text-slate-355 transition-all cursor-pointer"><X className="h-4 w-4"/></button>
              </div>
              <div className="px-5 py-5 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={labelCls}>Kode *</label>
                    <input type="text" value={form.kode} onChange={e=>setForm(f=>({...f,kode:e.target.value.toUpperCase()}))} placeholder="IJK" className={inputCls} maxLength={5}/>
                  </div>
                  <div className="col-span-2">
                    <label className={labelCls}>Nama Sub Bagian *</label>
                    <input type="text" value={form.nama} onChange={e=>setForm(f=>({...f,nama:e.target.value}))} placeholder="Nama sub bagian" className={inputCls}/>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Bagian Induk *</label>
                  <select value={form.bagian_id} onChange={e=>setForm(f=>({...f,bagian_id:e.target.value}))} className={`${inputCls} cursor-pointer`}>
                    <option value="" className="bg-white dark:bg-[#0d1218] text-slate-800 dark:text-slate-100">— Pilih Bagian —</option>
                    {bagians.map(b=><option key={b.id} value={b.id} className="bg-white dark:bg-[#0d1218] text-slate-800 dark:text-slate-100">{b.kode} — {b.nama}</option>)}
                  </select>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02] px-4 py-3">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Status Aktif</p>
                  <button onClick={()=>setForm(f=>({...f,is_active:!f.is_active}))} className={`relative flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200 cursor-pointer ${form.is_active?'bg-amber-500':'bg-slate-250 dark:bg-white/[0.1]'}`}>
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all duration-200 ${form.is_active?'left-5':'left-0.5'}`}/>
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 border-t border-slate-150 dark:border-white/[0.06] px-5 py-4">
                <button onClick={()=>setModalOpen(false)} className="rounded-xl border border-slate-250 dark:border-white/[0.08] px-4 py-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-all cursor-pointer">Batal</button>
                <LiquidButton variant="outline" size="sm" onClick={handleSave} className="cursor-pointer font-bold">{editTarget?'Simpan':'Tambahkan'}</LiquidButton>
              </div>
            </div>
          </div>
        </div>
      </ModalPortal>
      <DeleteModal open={!!deleteTarget} name={deleteTarget?.nama??''} onCancel={()=>setDeleteTarget(null)} onConfirm={handleDelete}/>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: STATUS KARYAWAN
// ═══════════════════════════════════════════════════════════════════════════════
function TabStatusKaryawan() {
  const [data, setData]             = useState<StatusKary[]>(INIT_STATUS_KARY);
  const [modalOpen, setModalOpen]   = useState(false);
  const [editTarget, setEditTarget] = useState<StatusKary|null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StatusKary|null>(null);
  const [form, setForm]             = useState({ nama:'', deskripsi:'', is_active:true });
  const [toast, setToast]           = useState<{type:'ok'|'err';text:string}|null>(null);

  const showToast = (t:'ok'|'err', text:string) => { setToast({type:t,text}); setTimeout(()=>setToast(null),3000); };
  const openCreate = () => { setEditTarget(null); setForm({nama:'',deskripsi:'',is_active:true}); setModalOpen(true); };
  const openEdit   = (r:StatusKary) => { setEditTarget(r); setForm({nama:r.nama,deskripsi:r.deskripsi,is_active:r.is_active}); setModalOpen(true); };
  const handleSave = () => {
    if (!form.nama.trim()) { showToast('err','Nama wajib diisi.'); return; }
    if (editTarget) { setData(p=>p.map(r=>r.id===editTarget.id?{...r,...form}:r)); showToast('ok',`"${form.nama}" diperbarui.`); }
    else            { setData(p=>[...p,{...form,id:`sk-${Date.now()}`}]); showToast('ok',`"${form.nama}" ditambahkan.`); }
    setModalOpen(false);
  };
  const handleDelete = () => { if(!deleteTarget)return; setData(p=>p.filter(r=>r.id!==deleteTarget.id)); showToast('ok',`"${deleteTarget.nama}" dihapus.`); setDeleteTarget(null); };

  return (
    <>
      <Toast toast={toast}/>
      <TableCard accentColor="via-emerald-500/30">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/[0.06]">
          <span className="text-[10px] font-bold text-slate-500">{data.length} status terdaftar</span>
          <LiquidButton variant="outline" size="sm" onClick={openCreate} className="cursor-pointer font-bold flex items-center gap-2">
            <Plus className="h-4 w-4"/> Tambah Status
          </LiquidButton>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-100 dark:border-white/[0.04]">{['Nama Status','Deskripsi','Status','Aksi'].map(h=><th key={h} className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 last:text-right">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.03]">
              {data.map(r=>(
                <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3.5 font-bold text-slate-800 dark:text-slate-200">{r.nama}</td>
                  <td className="px-5 py-3.5 text-xs text-slate-600 dark:text-slate-400 max-w-xs">{r.deskripsi||'—'}</td>
                  <td className="px-5 py-3.5"><ActiveToggle value={r.is_active} onChange={v=>setData(p=>p.map(x=>x.id===r.id?{...x,is_active:v}:x))}/></td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={()=>openEdit(r)} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:bg-amber-500/10 hover:text-amber-500 transition-all cursor-pointer"><Pencil className="h-3.5 w-3.5"/></button>
                      <button onClick={()=>setDeleteTarget(r)} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:bg-rose-500/10 hover:text-rose-500 transition-all cursor-pointer"><Trash2 className="h-3.5 w-3.5"/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TableCard>
      <ModalPortal open={modalOpen}>
        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={()=>setModalOpen(false)}/>
        <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
          <div className="pointer-events-auto w-full max-w-md">
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0d1218] shadow-2xl">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent"/>
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-150 dark:border-white/[0.06]">
                <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-2"><Briefcase className="h-4 w-4 text-emerald-555 dark:text-emerald-400"/>{editTarget?'Edit Status Karyawan':'Tambah Status Karyawan'}</h2>
                <button onClick={()=>setModalOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:text-slate-700 dark:hover:text-slate-355 cursor-pointer"><X className="h-4 w-4"/></button>
              </div>
              <div className="px-5 py-5 space-y-4">
                <div><label className={labelCls}>Nama Status *</label><input type="text" value={form.nama} onChange={e=>setForm(f=>({...f,nama:e.target.value}))} placeholder="cth: Karyawan Tetap" className={inputCls}/></div>
                <div><label className={labelCls}>Deskripsi</label><textarea value={form.deskripsi} onChange={e=>setForm(f=>({...f,deskripsi:e.target.value}))} placeholder="Deskripsi singkat..." rows={2} className={`${inputCls} resize-none`}/></div>
                <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02] px-4 py-3">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Status Aktif</p>
                  <button onClick={()=>setForm(f=>({...f,is_active:!f.is_active}))} className={`relative flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200 cursor-pointer ${form.is_active?'bg-amber-500':'bg-slate-250 dark:bg-white/[0.1]'}`}>
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all duration-200 ${form.is_active?'left-5':'left-0.5'}`}/>
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 border-t border-slate-150 dark:border-white/[0.06] px-5 py-4">
                <button onClick={()=>setModalOpen(false)} className="rounded-xl border border-slate-250 dark:border-white/[0.08] px-4 py-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-all cursor-pointer">Batal</button>
                <LiquidButton variant="outline" size="sm" onClick={handleSave} className="cursor-pointer font-bold">{editTarget?'Simpan':'Tambahkan'}</LiquidButton>
              </div>
            </div>
          </div>
        </div>
      </ModalPortal>
      <DeleteModal open={!!deleteTarget} name={deleteTarget?.nama??''} onCancel={()=>setDeleteTarget(null)} onConfirm={handleDelete}/>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: PENDIDIKAN
// ═══════════════════════════════════════════════════════════════════════════════
// TAB: PENDIDIKAN
function TabPendidikan() {
  const [data, setData]             = useState<Pendidikan[]>(INIT_PENDIDIKAN);
  const [modalOpen, setModalOpen]   = useState(false);
  const [editTarget, setEditTarget] = useState<Pendidikan|null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Pendidikan|null>(null);
  const [form, setForm]             = useState({ singkatan:'', nama_lengkap:'', jenjang:1 });
  const [toast, setToast]           = useState<{type:'ok'|'err';text:string}|null>(null);

  const showToast = (t:'ok'|'err', text:string) => { setToast({type:t,text}); setTimeout(()=>setToast(null),3000); };
  const openCreate = () => { setEditTarget(null); setForm({singkatan:'',nama_lengkap:'',jenjang:data.length+1}); setModalOpen(true); };
  const openEdit   = (r:Pendidikan) => { setEditTarget(r); setForm({singkatan:r.singkatan,nama_lengkap:r.nama_lengkap,jenjang:r.jenjang}); setModalOpen(true); };
  const handleSave = () => {
    if (!form.singkatan.trim()||!form.nama_lengkap.trim()) { showToast('err','Semua field wajib diisi.'); return; }
    if (editTarget) { setData(p=>p.map(r=>r.id===editTarget.id?{...r,...form}:r)); showToast('ok',`"${form.nama_lengkap}" diperbarui.`); }
    else            { setData(p=>[...p,{...form,id:`pd-${Date.now()}`}].sort((a,b)=>a.jenjang-b.jenjang)); showToast('ok',`"${form.nama_lengkap}" ditambahkan.`); }
    setModalOpen(false);
  };
  const handleDelete = () => { if(!deleteTarget)return; setData(p=>p.filter(r=>r.id!==deleteTarget.id)); showToast('ok',`"${deleteTarget.nama_lengkap}" dihapus.`); setDeleteTarget(null); };

  return (
    <>
      <Toast toast={toast}/>
      <TableCard accentColor="via-cyan-500/30">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/[0.06]">
          <span className="text-[10px] font-bold text-slate-500">{data.length} jenjang pendidikan</span>
          <LiquidButton variant="outline" size="sm" onClick={openCreate} className="cursor-pointer font-bold flex items-center gap-2"><Plus className="h-4 w-4"/> Tambah Jenjang</LiquidButton>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-100 dark:border-white/[0.04]">{['Jenjang','Singkatan','Nama Lengkap','Aksi'].map(h=><th key={h} className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 last:text-right">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.03]">
              {[...data].sort((a,b)=>a.jenjang-b.jenjang).map(r=>(
                <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3.5 text-xs font-black text-slate-450 dark:text-slate-500">{r.jenjang}</td>
                  <td className="px-5 py-3.5"><span className="rounded-lg bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 text-[11px] font-black text-cyan-600 dark:text-cyan-400">{r.singkatan}</span></td>
                  <td className="px-5 py-3.5 font-bold text-slate-800 dark:text-slate-200">{r.nama_lengkap}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={()=>openEdit(r)} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:bg-amber-500/10 hover:text-amber-500 transition-all cursor-pointer"><Pencil className="h-3.5 w-3.5"/></button>
                      <button onClick={()=>setDeleteTarget(r)} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:bg-rose-500/10 hover:text-rose-500 transition-all cursor-pointer"><Trash2 className="h-3.5 w-3.5"/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TableCard>
      <ModalPortal open={modalOpen}>
        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={()=>setModalOpen(false)}/>
        <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
          <div className="pointer-events-auto w-full max-w-sm">
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0d1218] shadow-2xl">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/60 to-transparent"/>
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-150 dark:border-white/[0.06]">
                <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-2"><GraduationCap className="h-4 w-4 text-cyan-555 dark:text-cyan-400"/>{editTarget?'Edit Pendidikan':'Tambah Pendidikan'}</h2>
                <button onClick={()=>setModalOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:text-slate-700 dark:hover:text-slate-355 cursor-pointer"><X className="h-4 w-4"/></button>
              </div>
              <div className="px-5 py-5 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div><label className={labelCls}>Singkatan *</label><input type="text" value={form.singkatan} onChange={e=>setForm(f=>({...f,singkatan:e.target.value}))} placeholder="S1" className={inputCls}/></div>
                  <div className="col-span-2"><label className={labelCls}>Nama Lengkap *</label><input type="text" value={form.nama_lengkap} onChange={e=>setForm(f=>({...f,nama_lengkap:e.target.value}))} placeholder="Sarjana" className={inputCls}/></div>
                </div>
                <div><label className={labelCls}>Urutan Jenjang</label><input type="number" min={1} value={form.jenjang} onChange={e=>setForm(f=>({...f,jenjang:parseInt(e.target.value)||1}))} className={inputCls}/></div>
              </div>
              <div className="flex items-center justify-end gap-3 border-t border-slate-150 dark:border-white/[0.06] px-5 py-4">
                <button onClick={()=>setModalOpen(false)} className="rounded-xl border border-slate-250 dark:border-white/[0.08] px-4 py-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-all cursor-pointer">Batal</button>
                <LiquidButton variant="outline" size="sm" onClick={handleSave} className="cursor-pointer font-bold">{editTarget?'Simpan':'Tambahkan'}</LiquidButton>
              </div>
            </div>
          </div>
        </div>
      </ModalPortal>
      <DeleteModal open={!!deleteTarget} name={deleteTarget?.nama_lengkap??''} onCancel={()=>setDeleteTarget(null)} onConfirm={handleDelete}/>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: STATUS PERNIKAHAN
// ═══════════════════════════════════════════════════════════════════════════════
function TabStatusNikah() {
  const [data, setData]             = useState<StatusNikah[]>(INIT_STATUS_NIKAH);
  const [modalOpen, setModalOpen]   = useState(false);
  const [editTarget, setEditTarget] = useState<StatusNikah|null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StatusNikah|null>(null);
  const [form, setForm]             = useState({ nama:'' });
  const [toast, setToast]           = useState<{type:'ok'|'err';text:string}|null>(null);

  const showToast = (t:'ok'|'err', text:string) => { setToast({type:t,text}); setTimeout(()=>setToast(null),3000); };
  const openCreate = () => { setEditTarget(null); setForm({nama:''}); setModalOpen(true); };
  const openEdit   = (r:StatusNikah) => { setEditTarget(r); setForm({nama:r.nama}); setModalOpen(true); };
  const handleSave = () => {
    if (!form.nama.trim()) { showToast('err','Nama wajib diisi.'); return; }
    if (editTarget) { setData(p=>p.map(r=>r.id===editTarget.id?{...r,...form}:r)); showToast('ok',`"${form.nama}" diperbarui.`); }
    else            { setData(p=>[...p,{...form,id:`sn-${Date.now()}`}]); showToast('ok',`"${form.nama}" ditambahkan.`); }
    setModalOpen(false);
  };
  const handleDelete = () => { if(!deleteTarget)return; setData(p=>p.filter(r=>r.id!==deleteTarget.id)); showToast('ok','Data dihapus.'); setDeleteTarget(null); };

  return (
    <>
      <Toast toast={toast}/>
      <TableCard accentColor="via-pink-500/30">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/[0.06]">
          <span className="text-[10px] font-bold text-slate-500">{data.length} status nikah terdaftar</span>
          <LiquidButton variant="outline" size="sm" onClick={openCreate} className="cursor-pointer font-bold flex items-center gap-2"><Plus className="h-4 w-4"/> Tambah Status</LiquidButton>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-100 dark:border-white/[0.04]">{['Nama Status Pernikahan','Aksi'].map(h=><th key={h} className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 last:text-right">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.03]">
              {data.map(r=>(
                <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3.5 font-bold text-slate-800 dark:text-slate-200">{r.nama}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={()=>openEdit(r)} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:bg-amber-500/10 hover:text-amber-500 transition-all cursor-pointer"><Pencil className="h-3.5 w-3.5"/></button>
                      <button onClick={()=>setDeleteTarget(r)} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:bg-rose-500/10 hover:text-rose-500 transition-all cursor-pointer"><Trash2 className="h-3.5 w-3.5"/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TableCard>
      <ModalPortal open={modalOpen}>
        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={()=>setModalOpen(false)}/>
        <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
          <div className="pointer-events-auto w-full max-w-sm">
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0d1218] shadow-2xl">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-pink-500/60 to-transparent"/>
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-150 dark:border-white/[0.06]">
                <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-2"><Heart className="h-4 w-4 text-pink-555 dark:text-pink-400"/>{editTarget?'Edit Status':'Tambah Status'}</h2>
                <button onClick={()=>setModalOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:text-slate-700 dark:hover:text-slate-355 cursor-pointer"><X className="h-4 w-4"/></button>
              </div>
              <div className="px-5 py-5 space-y-4">
                <div><label className={labelCls}>Nama Status *</label><input type="text" value={form.nama} onChange={e=>setForm(f=>({...f,nama:e.target.value}))} placeholder="cth: Menikah (Anak 1)" className={inputCls}/></div>
              </div>
              <div className="flex items-center justify-end gap-3 border-t border-slate-150 dark:border-white/[0.06] px-5 py-4">
                <button onClick={()=>setModalOpen(false)} className="rounded-xl border border-slate-250 dark:border-white/[0.08] px-4 py-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-all cursor-pointer">Batal</button>
                <LiquidButton variant="outline" size="sm" onClick={handleSave} className="cursor-pointer font-bold">{editTarget?'Simpan':'Tambahkan'}</LiquidButton>
              </div>
            </div>
          </div>
        </div>
      </ModalPortal>
      <DeleteModal open={!!deleteTarget} name={deleteTarget?.nama??''} onCancel={()=>setDeleteTarget(null)} onConfirm={handleDelete}/>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TABS CONFIG
// ═══════════════════════════════════════════════════════════════════════════════
const TABS = [
  { id:'bagian',      label:'Bagian',            icon:Building2,     accentText:'text-amber-600 dark:text-amber-400',  accentBg:'bg-amber-500/10',  accentBorder:'border-amber-500/30',  Component:TabBagian        },
  { id:'sub-bagian',  label:'Sub Bagian',         icon:GitBranch,     accentText:'text-indigo-600 dark:text-indigo-400', accentBg:'bg-indigo-500/10', accentBorder:'border-indigo-500/30', Component:TabSubBagian     },
  { id:'status-kary', label:'Status Karyawan',    icon:Briefcase,     accentText:'text-emerald-600 dark:text-emerald-450',accentBg:'bg-emerald-500/10',accentBorder:'border-emerald-500/30',Component:TabStatusKaryawan},
  { id:'pendidikan',  label:'Pendidikan',         icon:GraduationCap, accentText:'text-cyan-600 dark:text-cyan-400',   accentBg:'bg-cyan-500/10',   accentBorder:'border-cyan-500/30',   Component:TabPendidikan    },
  { id:'status-nikah',label:'Status Pernikahan',  icon:Heart,         accentText:'text-pink-600 dark:text-pink-400',   accentBg:'bg-pink-500/10',   accentBorder:'border-pink-500/30',   Component:TabStatusNikah   },
];

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function MasterDataPage() {
  const [activeTab, setActiveTab] = useState('bagian');
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
          Kelola data referensi sistem Portal SSO PT INL — Bagian, Sub Bagian, Status Karyawan, Pendidikan, dan Status Pernikahan.
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
