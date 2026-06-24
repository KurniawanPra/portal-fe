'use client';

import React, { useState, useCallback } from 'react';
import {
  Users, Plus, Search, Pencil, Trash2, X, CheckCircle2, AlertCircle,
  Mail, Building2, UserX, UserCheck, ShieldCheck,
  ShieldAlert, Phone
} from 'lucide-react';
import { ModalPortal } from '@/components/ui/ModalPortal';
import { LiquidButton } from '@/components/animate-ui/components/buttons/liquid';

// ─── Types ───────────────────────────────────────────────────────────────────
type UserRole   = 'Admin' | 'User' | 'Viewer';
type UserStatus = 'Aktif' | 'Suspended';

interface UserData {
  id: string;
  nama: string;
  email: string;
  nrk: string;
  nomor_hp: string;
  jabatan: string;
  bagian: string;
  role: UserRole;
  status: UserStatus;
  last_login: string;
  dibuat_pada: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const INITIAL_USERS: UserData[] = [
  { id: 'u-1', nama: 'Budi Santoso, S.T.',     email: 'budi.santoso@inl.co.id',     nrk: 'NRK-260901', nomor_hp: '0812-3456-7890', jabatan: 'IT Lead Specialist',       bagian: 'TID', role: 'Admin',  status: 'Aktif',     last_login: '2026-06-23T20:15:00', dibuat_pada: '2024-01-10' },
  { id: 'u-2', nama: 'Hendra Gunawan',         email: 'hendra.gunawan@inl.co.id',   nrk: 'NRK-260902', nomor_hp: '0812-7654-3210', jabatan: 'Accounting Manager',       bagian: 'KEU', role: 'User',   status: 'Suspended', last_login: '2026-06-20T11:40:00', dibuat_pada: '2024-01-12' },
  { id: 'u-3', nama: 'Citra Anggraini',        email: 'citra.anggraini@inl.co.id',  nrk: 'NRK-260903', nomor_hp: '0813-8888-9999', jabatan: 'HR Specialist',             bagian: 'SDM', role: 'User',   status: 'Aktif',     last_login: '2026-06-23T08:22:00', dibuat_pada: '2024-02-05' },
  { id: 'u-4', nama: 'Rian Hidayat',           email: 'rian.hidayat@inl.co.id',     nrk: 'NRK-260904', nomor_hp: '0852-1111-2222', jabatan: 'Plant Operator',           bagian: 'OPR', role: 'Viewer', status: 'Aktif',     last_login: '2026-06-22T17:05:00', dibuat_pada: '2024-02-20' },
  { id: 'u-5', nama: 'Dewi Lestari',           email: 'dewi.lestari@inl.co.id',     nrk: 'NRK-260905', nomor_hp: '0811-2222-3333', jabatan: 'Marketing Communicator',   bagian: 'MKT', role: 'User',   status: 'Aktif',     last_login: '2026-06-23T14:50:00', dibuat_pada: '2024-03-01' },
];

const ROLES: UserRole[] = ['Admin', 'User', 'Viewer'];
const STATUSES: UserStatus[] = ['Aktif', 'Suspended'];
const BAGIANS = ['TID', 'KEU', 'SDM', 'OPR', 'MKT', 'LGL', 'LOG'];

// Color palettes for UI badges and icons
const ROLE_BADGE: Record<UserRole, string> = {
  Admin:  'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  User:   'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
  Viewer: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
};

const STATUS_BADGE: Record<UserStatus, string> = {
  Aktif:     'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border-emerald-500/20',
  Suspended: 'bg-rose-500/10 text-rose-600 dark:text-rose-450 border-rose-500/20',
};

const STATUS_DOT: Record<UserStatus, string> = {
  Aktif:     'bg-emerald-500 dark:bg-emerald-400',
  Suspended: 'bg-rose-500 dark:bg-rose-400',
};

const ROLE_AVATAR: Record<UserRole, string> = {
  Admin:  'from-amber-400  to-amber-600',
  User:   'from-indigo-400 to-indigo-600',
  Viewer: 'from-slate-500  to-slate-700',
};

const inputCls = 'w-full rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0a0f1a] px-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10 transition-all duration-200';
const labelCls = 'mb-1.5 block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400';

type FormData = Omit<UserData, 'id' | 'last_login' | 'dibuat_pada'>;
const emptyForm: FormData = { nama:'', email:'', nrk:'', nomor_hp:'', jabatan:'', bagian:'TID', role:'User', status:'Aktif' };

export default function ManajemenUserPage() {
  const [users, setUsers]     = useState<UserData[]>(INITIAL_USERS);
  const [search, setSearch]   = useState('');
  const [filterRole,   setFilterRole]   = useState<UserRole | 'Semua'>('Semua');
  const [filterStatus, setFilterStatus] = useState<UserStatus | 'Semua'>('Semua');

  const [modalOpen,    setModalOpen]    = useState(false);
  const [editTarget,   setEditTarget]   = useState<UserData | null>(null);
  const [form,         setForm]         = useState<FormData>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<UserData | null>(null);
  const [toast,        setToast]        = useState<{ type:'ok'|'err'; text:string } | null>(null);

  const showToast = (type: 'ok'|'err', text: string) => { setToast({ type, text }); setTimeout(() => setToast(null), 3200); };

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return (u.nama.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.nrk.toLowerCase().includes(q) || u.bagian.toLowerCase().includes(q))
      && (filterRole   === 'Semua' || u.role   === filterRole)
      && (filterStatus === 'Semua' || u.status === filterStatus);
  });

  const openCreate = useCallback(() => { setEditTarget(null); setForm(emptyForm); setModalOpen(true); }, []);
  const openEdit   = useCallback((u: UserData) => { setEditTarget(u); setForm({ nama:u.nama, email:u.email, nrk:u.nrk, nomor_hp:u.nomor_hp, jabatan:u.jabatan, bagian:u.bagian, role:u.role, status:u.status }); setModalOpen(true); }, []);

  const handleSave = useCallback(() => {
    if (!form.nama.trim() || !form.email.trim()) { showToast('err', 'Nama dan Email wajib diisi.'); return; }
    if (!form.email.includes('@'))                { showToast('err', 'Format email tidak valid.'); return; }
    if (editTarget) {
      setUsers(p => p.map(u => u.id === editTarget.id ? { ...u, ...form } : u));
      showToast('ok', `"${form.nama}" berhasil diperbarui.`);
    } else {
      setUsers(p => [...p, { ...form, id:`u-${Date.now()}`, last_login:'-', dibuat_pada:new Date().toISOString().slice(0,10) }]);
      showToast('ok', `"${form.nama}" berhasil ditambahkan.`);
    }
    setModalOpen(false);
  }, [form, editTarget]);

  const handleDelete = useCallback(() => {
    if (!deleteTarget) return;
    setUsers(p => p.filter(u => u.id !== deleteTarget.id));
    showToast('ok', `"${deleteTarget.nama}" dihapus.`);
    setDeleteTarget(null);
  }, [deleteTarget]);

  const fmtLogin = (s: string) => {
    if (s === '-') return '-';
    try { return new Date(s).toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }); }
    catch { return s; }
  };

  const adminCount   = users.filter(u => u.role === 'Admin').length;
  const activeCount  = users.filter(u => u.status === 'Aktif').length;
  const suspendCount = users.filter(u => u.status === 'Suspended').length;

  return (
    <div className="space-y-6">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[9998] flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-semibold shadow-2xl backdrop-blur-xl animate-fade-up ${toast.type==='ok' ? 'bg-[#0f1a10]/95 border-emerald-500/30 text-emerald-300' : 'bg-[#1a0f10]/95 border-rose-500/30 text-rose-300'}`}>
          {toast.type==='ok' ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400"/> : <AlertCircle className="h-4 w-4 shrink-0 text-rose-400"/>}
          {toast.text}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2.5">
            <Users className="h-6 w-6 text-amber-500 dark:text-amber-400" />
            Manajemen User
          </h1>
          <p className="mt-1 text-sm font-semibold text-slate-550 dark:text-slate-400">Kelola pengguna dan hak akses Portal SSO PT INL.</p>
        </div>
        <LiquidButton variant="outline" size="sm" onClick={openCreate} className="cursor-pointer flex items-center gap-2 font-bold">
          <Plus className="h-4 w-4" />
          Tambah User
        </LiquidButton>
      </div>

      {/* Stats — flat inline, no cards */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        {[
          { label:'Total User', value:users.length, icon:Users,       color:'text-amber-500 dark:text-amber-400'   },
          { label:'Admin',      value:adminCount,   icon:ShieldCheck, color:'text-indigo-500 dark:text-indigo-400'  },
          { label:'Aktif',      value:activeCount,  icon:UserCheck,   color:'text-emerald-500 dark:text-emerald-450' },
          { label:'Suspended',  value:suspendCount, icon:ShieldAlert, color:'text-rose-500 dark:text-rose-405'    },
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

      {/* Table Card */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-white/[0.06] bg-white dark:bg-[#0f1623] shadow-lg">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />

        {/* Toolbar */}
        <div className="flex flex-col gap-3 px-5 py-4 border-b border-slate-100 dark:border-white/[0.06] sm:flex-row sm:items-center sm:justify-between flex-wrap">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
            <input type="text" placeholder="Cari nama, email, NRK, atau bagian..." value={search} onChange={e => setSearch(e.target.value)}
              className={`${inputCls} pl-10`} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1">
              {(['Semua', ...ROLES] as const).map(r => (
                <button key={r} onClick={() => setFilterRole(r)}
                  className={`rounded-lg px-2.5 py-1.5 text-[11px] font-black uppercase tracking-wide transition-all cursor-pointer focus:outline-none ${filterRole===r ? 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 dark:border-amber-500/30' : 'text-slate-550 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 border border-transparent'}`}>
                  {r}
                </button>
              ))}
            </div>
            <div className="h-3.5 w-px bg-slate-200 dark:bg-white/[0.08]" />
            <div className="flex items-center gap-1">
              {(['Semua', ...STATUSES] as const).map(s => (
                <button key={s} onClick={() => setFilterStatus(s as UserStatus | 'Semua')}
                  className={`rounded-lg px-2.5 py-1.5 text-[11px] font-black uppercase tracking-wide transition-all cursor-pointer focus:outline-none ${filterStatus===s ? 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 dark:border-amber-500/30' : 'text-slate-550 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 border border-transparent'}`}>
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
                {['User','NRK / Bagian','Role','Status','Login Terakhir','Aksi'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 last:text-right">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.03]">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-sm font-semibold text-slate-400 dark:text-slate-500">Tidak ada user yang sesuai.</td></tr>
              ) : filtered.map(u => (
                <tr key={u.id} className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors duration-150">
                  {/* User */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-black text-sm text-white bg-gradient-to-br ${ROLE_AVATAR[u.role]}`}>
                        {u.nama.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 dark:text-slate-100 truncate">{u.nama}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Mail className="h-3 w-3 text-slate-400 dark:text-slate-500 shrink-0" />
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{u.email}</p>
                        </div>
                      </div>
                    </div>
                  </td>
                  {/* NRK */}
                  <td className="px-5 py-3.5">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{u.nrk}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Building2 className="h-3 w-3 text-slate-400 dark:text-slate-500 shrink-0" />
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">{u.bagian} — {u.jabatan}</p>
                    </div>
                  </td>
                  {/* Role */}
                  <td className="px-5 py-3.5">
                    <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide ${ROLE_BADGE[u.role]}`}>{u.role}</span>
                  </td>
                  {/* Status */}
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide ${STATUS_BADGE[u.status]}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[u.status]}`} />
                      {u.status}
                    </span>
                  </td>
                  {/* Last Login */}
                  <td className="px-5 py-3.5 text-xs font-bold text-slate-550 dark:text-slate-500">{fmtLogin(u.last_login)}</td>
                  {/* Actions */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      {u.status === 'Aktif' ? (
                        <button title="Suspend" onClick={() => setUsers(p => p.map(x => x.id===u.id ? {...x, status:'Suspended'} : x))}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:bg-rose-500/10 hover:text-rose-500 transition-all cursor-pointer focus:outline-none">
                          <UserX className="h-3.5 w-3.5" />
                        </button>
                      ) : (
                        <button title="Aktifkan" onClick={() => setUsers(p => p.map(x => x.id===u.id ? {...x, status:'Aktif'} : x))}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:bg-emerald-500/10 hover:text-emerald-500 transition-all cursor-pointer focus:outline-none">
                          <UserCheck className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button onClick={() => openEdit(u)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:bg-amber-500/10 hover:text-amber-500 transition-all cursor-pointer focus:outline-none">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setDeleteTarget(u)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:bg-rose-500/10 hover:text-rose-500 transition-all cursor-pointer focus:outline-none">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-slate-100 dark:border-white/[0.04] text-[11px] font-bold text-slate-450 dark:text-slate-500">
          {filtered.length} dari {users.length} user
        </div>
      </div>

      {/* Create/Edit Modal via Portal */}
      <ModalPortal open={modalOpen}>
        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
        <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
          <div className="pointer-events-auto w-full max-w-lg animate-fade-up">
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0d1218] shadow-2xl">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/60 to-transparent" />
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-150 dark:border-white/[0.06]">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                    {editTarget ? <Pencil className="h-4 w-4 text-indigo-500 dark:text-indigo-400"/> : <Plus className="h-4 w-4 text-indigo-500 dark:text-indigo-400"/>}
                  </div>
                  <h2 className="text-sm font-black text-slate-800 dark:text-slate-100">{editTarget ? 'Edit Data User' : 'Tambah User Baru'}</h2>
                </div>
                <button onClick={() => setModalOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:text-slate-700 dark:hover:text-slate-300 transition-all cursor-pointer focus:outline-none">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="px-5 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
                <div>
                  <label className={labelCls}>Nama Lengkap *</label>
                  <input type="text" value={form.nama} onChange={e => setForm(f=>({...f, nama:e.target.value}))} placeholder="cth: Budi Santoso, S.T." className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Email SSO *</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                    <input type="email" value={form.email} onChange={e => setForm(f=>({...f, email:e.target.value}))} placeholder="nama@inl.co.id" className={`${inputCls} pl-10`} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>NRK</label>
                    <input type="text" value={form.nrk} onChange={e => setForm(f=>({...f, nrk:e.target.value}))} placeholder="NRK-XXXXXX" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Nomor HP</label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                      <input type="tel" value={form.nomor_hp} onChange={e => setForm(f=>({...f, nomor_hp:e.target.value}))} placeholder="08xx-xxxx-xxxx" className={`${inputCls} pl-10`} />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Jabatan</label>
                    <input type="text" value={form.jabatan} onChange={e => setForm(f=>({...f, jabatan:e.target.value}))} placeholder="cth: IT Specialist" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Bagian (Unit)</label>
                    <select value={form.bagian} onChange={e => setForm(f=>({...f, bagian:e.target.value}))} className={`${inputCls} cursor-pointer`}>
                      {BAGIANS.map(b => <option key={b} value={b} className="bg-white dark:bg-[#0d1218] text-slate-800 dark:text-slate-100">{b}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Role Akses</label>
                    <select value={form.role} onChange={e => setForm(f=>({...f, role:e.target.value as UserRole}))} className={`${inputCls} cursor-pointer`}>
                      {ROLES.map(r => <option key={r} value={r} className="bg-white dark:bg-[#0d1218] text-slate-800 dark:text-slate-100">{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Status Akun</label>
                    <select value={form.status} onChange={e => setForm(f=>({...f, status:e.target.value as UserStatus}))} className={`${inputCls} cursor-pointer`}>
                      {STATUSES.map(s => <option key={s} value={s} className="bg-white dark:bg-[#0d1218] text-slate-800 dark:text-slate-100">{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 border-t border-slate-150 dark:border-white/[0.06] px-5 py-4">
                <button onClick={() => setModalOpen(false)} className="rounded-xl border border-slate-250 dark:border-white/[0.08] px-4 py-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04] hover:text-slate-700 dark:hover:text-slate-200 transition-all cursor-pointer focus:outline-none">Batal</button>
                <LiquidButton variant="outline" size="sm" onClick={handleSave} className="cursor-pointer font-bold">
                  {editTarget ? 'Simpan Perubahan' : 'Tambahkan'}
                </LiquidButton>
              </div>
            </div>
          </div>
        </div>
      </ModalPortal>

      {/* Delete Modal via Portal */}
      <ModalPortal open={!!deleteTarget}>
        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
        <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
          <div className="pointer-events-auto w-full max-w-sm animate-fade-up">
            <div className="relative overflow-hidden rounded-2xl border border-rose-500/20 bg-white dark:bg-[#0d1218] shadow-2xl p-6 text-center">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rose-500/50 to-transparent" />
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20">
                <Trash2 className="h-6 w-6 text-rose-500 dark:text-rose-400" />
              </div>
              <h3 className="text-base font-black text-slate-800 dark:text-slate-100">Hapus User?</h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                User <span className="font-bold text-slate-800 dark:text-slate-200">&quot;{deleteTarget?.nama}&quot;</span> akan dihapus permanen dari sistem.
              </p>
              <div className="mt-5 flex gap-3">
                <button onClick={() => setDeleteTarget(null)} className="flex-1 rounded-xl border border-slate-200 dark:border-white/[0.08] px-4 py-2.5 text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04] hover:text-slate-700 dark:hover:text-slate-200 transition-all cursor-pointer focus:outline-none">Batal</button>
                <button onClick={handleDelete} className="flex-1 rounded-xl bg-rose-500/90 hover:bg-rose-500 px-4 py-2.5 text-sm font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer focus:outline-none shadow-lg shadow-rose-500/20">Hapus Sekarang</button>
              </div>
            </div>
          </div>
        </div>
      </ModalPortal>

    </div>
  );
}
