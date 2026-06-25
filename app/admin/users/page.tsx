'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Users, Plus, Search, Pencil, Trash2, X, CheckCircle2, AlertCircle,
  Mail, Building2, UserX, UserCheck, ShieldCheck,
  ShieldAlert, UserCog, ChevronDown, Loader2, Lock
} from 'lucide-react';
import { ModalPortal } from '@/components/ui/ModalPortal';
import { LiquidButton } from '@/components/animate-ui/components/buttons/liquid';
import { api } from '@/lib/api';

// ─── Types ───────────────────────────────────────────────────────────────────
// Backend roles: 'user' | 'super_admin'
// Frontend display: 'Admin' | 'User'
type UserRole   = 'Admin' | 'User';
type UserStatus = 'Aktif' | 'Suspended';

interface ApiUser {
  id: string;
  email: string;
  role: 'user' | 'super_admin';
  isActive: boolean;
  lastLogin: string | null;
  employeeId: string | null;
  createdAt: string;
}

interface EmployeeBrief {
  id: string;
  nama: string;
  nrk: string;
  jabatan: string;
}

interface UserData {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  last_login: string;
  dibuat_pada: string;
  employeeId?: string;
  // Employee-linked display fields
  nama: string;
  nrk: string;
  jabatan: string;
  unitOrganisasi: string;
}

// ─── Role Mapping ─────────────────────────────────────────────────────────────
function mapRoleFromApi(role: 'user' | 'super_admin'): UserRole {
  return role === 'super_admin' ? 'Admin' : 'User';
}
function mapRoleToApi(role: UserRole): 'user' | 'super_admin' {
  return role === 'Admin' ? 'super_admin' : 'user';
}

const ROLES: UserRole[] = ['Admin', 'User'];
const STATUSES: UserStatus[] = ['Aktif', 'Suspended'];

// Color palettes for UI badges and icons
const ROLE_BADGE: Record<UserRole, string> = {
  Admin:  'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  User:   'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
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
};

const inputCls = 'w-full rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0a0f1a] px-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10 transition-all duration-200';
const labelCls = 'mb-1.5 block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400';

interface FormData {
  email: string;
  password: string;
  role: UserRole;
  status: UserStatus;
  employeeId: string;
}
const emptyForm: FormData = { email: '', password: '', role: 'User', status: 'Aktif', employeeId: '' };

export default function ManajemenUserPage() {
  const [users, setUsers]     = useState<UserData[]>([]);
  const [allEmployees, setAllEmployees] = useState<EmployeeBrief[]>([]);
  const [search, setSearch]   = useState('');
  const [filterRole,   setFilterRole]   = useState<UserRole | 'Semua'>('Semua');
  const [filterStatus, setFilterStatus] = useState<UserStatus | 'Semua'>('Semua');
  const [loading, setLoading] = useState(true);

  const [modalOpen,    setModalOpen]    = useState(false);
  const [editTarget,   setEditTarget]   = useState<UserData | null>(null);
  const [form,         setForm]         = useState<FormData>(emptyForm);
  const [saving,       setSaving]       = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserData | null>(null);
  const [deleting,     setDeleting]     = useState(false);
  const [toast,        setToast]        = useState<{ type:'ok'|'err'; text:string } | null>(null);

  const showToast = (type: 'ok'|'err', text: string) => { setToast({ type, text }); setTimeout(() => setToast(null), 3200); };

  // ─── Fetch Data ───────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    try {
      const [usersRes, employeesRes] = await Promise.all([
        api.get<ApiUser[]>('/users?limit=200'),
        api.get<EmployeeBrief[]>('/employees?limit=200'),
      ]); 

      const empMap = new Map<string, EmployeeBrief>();
      (employeesRes.data || []).forEach(e => empMap.set(e.id, e));

      setAllEmployees(employeesRes.data || []);

      const mapped: UserData[] = (usersRes.data || []).map(u => {
        const emp = u.employeeId ? empMap.get(u.employeeId) : undefined;
        return {
          id: u.id,
          email: u.email,
          role: mapRoleFromApi(u.role),
          status: u.isActive ? 'Aktif' : 'Suspended',
          last_login: u.lastLogin || '-',
          dibuat_pada: u.createdAt ? u.createdAt.slice(0, 10) : '-',
          employeeId: u.employeeId || undefined,
          nama: emp?.nama || u.email.split('@')[0],
          nrk: emp?.nrk || '-',
          jabatan: emp?.jabatan || '-',
          unitOrganisasi: '-',
        };
      });

      setUsers(mapped);
    } catch (err) {
      showToast('err', err instanceof Error ? err.message : 'Gagal memuat data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // ─── Filtering ────────────────────────────────────────────────────────────
  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return (u.nama.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.nrk.toLowerCase().includes(q))
      && (filterRole   === 'Semua' || u.role   === filterRole)
      && (filterStatus === 'Semua' || u.status === filterStatus);
  });

  // Employee yang sudah di-assign ke user lain tidak bisa dipilih lagi
  const assignedEmployeeIds = useMemo(() => new Set(users.filter(u => u.employeeId).map(u => u.employeeId!)), [users]);
  const availableEmployees = useMemo(() => allEmployees.filter(e => !assignedEmployeeIds.has(e.id)), [allEmployees, assignedEmployeeIds]);

  const openCreate = useCallback(() => { setEditTarget(null); setForm(emptyForm); setModalOpen(true); }, []);
  const openEdit   = useCallback((u: UserData) => {
    setEditTarget(u);
    setForm({ email: u.email, password: '', role: u.role, status: u.status, employeeId: u.employeeId ?? '' });
    setModalOpen(true);
  }, []);

  // ─── Save (Create/Update) ─────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!form.email.trim())     { showToast('err', 'Email wajib diisi.'); return; }
    if (!form.email.includes('@')) { showToast('err', 'Format email tidak valid.'); return; }
    if (!editTarget && !form.password.trim()) { showToast('err', 'Password wajib diisi untuk user baru.'); return; }

    setSaving(true);
    try {
      const isActive = form.role === 'Admin' ? true : form.status === 'Aktif';
      if (editTarget) {
        // Update
        const body: Record<string, unknown> = {
          email: form.email,
          role: mapRoleToApi(form.role),
          isActive,
          employeeId: form.employeeId || null,
        };
        if (form.password.trim()) body.password = form.password;

        await api.put(`/users/${editTarget.id}`, body);
        showToast('ok', `"${form.email}" berhasil diperbarui.`);
      } else {
        // Create
        await api.post('/users', {
          email: form.email,
          password: form.password,
          role: mapRoleToApi(form.role),
          isActive,
          employeeId: form.employeeId || null,
        });
        showToast('ok', `"${form.email}" berhasil ditambahkan.`);
      }
      setModalOpen(false);
      setLoading(true);
      await fetchUsers();
    } catch (err) {
      showToast('err', err instanceof Error ? err.message : 'Gagal menyimpan.');
    } finally {
      setSaving(false);
    }
  }, [form, editTarget, fetchUsers]);

  // ─── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/users/${deleteTarget.id}`);
      showToast('ok', `"${deleteTarget.nama}" dihapus.`);
      setDeleteTarget(null);
      setLoading(true);
      await fetchUsers();
    } catch (err) {
      showToast('err', err instanceof Error ? err.message : 'Gagal menghapus.');
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, fetchUsers]);

  // ─── Toggle Status ────────────────────────────────────────────────────────
  const toggleStatus = useCallback(async (u: UserData) => {
    if (u.role === 'Admin') {
      showToast('err', 'Akun administrator tidak dapat di-nonaktifkan.');
      return;
    }
    try {
      await api.put(`/users/${u.id}`, { isActive: u.status !== 'Aktif' });
      await fetchUsers();
    } catch (err) {
      showToast('err', err instanceof Error ? err.message : 'Gagal mengubah status.');
    }
  }, [fetchUsers]);

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
        <div className={`fixed top-6 right-6 z-[99999] flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-semibold shadow-2xl backdrop-blur-xl animate-fade-up ${toast.type==='ok' ? 'bg-[#0f1a10]/95 border-emerald-500/30 text-emerald-300' : 'bg-[#1a0f10]/95 border-rose-500/30 text-rose-300'}`}>
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
            <input type="text" placeholder="Cari nama, email, atau NRK..." value={search} onChange={e => setSearch(e.target.value)}
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
          {loading ? (
            <div className="flex items-center justify-center py-20 gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
              <span className="text-sm font-semibold text-slate-400">Memuat data user...</span>
            </div>
          ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-white/[0.04]">
                {['User','NRK / Jabatan','Role','Status','Login Terakhir','Aksi'].map(h => (
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
                        {u.nama.charAt(0).toUpperCase()}
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
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">{u.jabatan}</p>
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
                      {u.role === 'Admin' ? (
                        <button disabled title="Admin selalu aktif"
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-200 dark:text-slate-800 cursor-not-allowed">
                          <UserX className="h-3.5 w-3.5 opacity-30" />
                        </button>
                      ) : u.status === 'Aktif' ? (
                        <button title="Suspend" onClick={() => toggleStatus(u)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:bg-rose-500/10 hover:text-rose-500 transition-all cursor-pointer focus:outline-none">
                          <UserX className="h-3.5 w-3.5" />
                        </button>
                      ) : (
                        <button title="Aktifkan" onClick={() => toggleStatus(u)}
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
          )}
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
              <div className="px-5 py-5 space-y-4 max-h-[65vh] overflow-y-auto hide-scrollbar">
                <div>
                  <label className={labelCls}>Email SSO *</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                    <input type="email" value={form.email} onChange={e => setForm(f=>({...f, email:e.target.value}))} placeholder="nama@inl.co.id" className={`${inputCls} pl-10`} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>{editTarget ? 'Password Baru (kosongkan jika tidak diubah)' : 'Password *'}</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                    <input type="password" value={form.password} onChange={e => setForm(f=>({...f, password:e.target.value}))} placeholder={editTarget ? '••••••••' : 'Min 8 karakter, huruf kapital + angka'} className={`${inputCls} pl-10`} />
                  </div>
                  {!editTarget && <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">Min. 8 karakter, mengandung huruf kapital dan angka.</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Role Akses</label>
                    <div className="relative">
                      <select
                        value={form.role}
                        onChange={e => {
                          const nextRole = e.target.value as UserRole;
                          setForm(f=>({
                            ...f,
                            role: nextRole,
                            status: nextRole === 'Admin' ? 'Aktif' : f.status
                          }));
                        }}
                        className={`${inputCls} appearance-none pr-10 cursor-pointer`}
                      >
                        {ROLES.map(r => <option key={r} value={r} className="bg-white dark:bg-[#0d1218] text-slate-800 dark:text-slate-100">{r}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Status Akun</label>
                    <div className="relative">
                      <select
                        disabled={form.role === 'Admin'}
                        value={form.role === 'Admin' ? 'Aktif' : form.status}
                        onChange={e => setForm(f=>({...f, status:e.target.value as UserStatus}))}
                        className={`${inputCls} appearance-none pr-10 ${form.role === 'Admin' ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                      >
                        {STATUSES.map(s => <option key={s} value={s} className="bg-white dark:bg-[#0d1218] text-slate-800 dark:text-slate-100">{s}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Link ke Employee</label>
                  <div className="relative">
                    <UserCog className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                    <select
                      value={form.employeeId ?? ''}
                      onChange={e => setForm(f=>({...f, employeeId: e.target.value || ''}))}
                      className={`${inputCls} pl-10 pr-10 appearance-none cursor-pointer`}
                    >
                      <option value="" className="bg-white dark:bg-[#0d1218] text-slate-800 dark:text-slate-100">— Tidak dikaitkan —</option>
                      {/* Show currently linked employee if editing */}
                      {editTarget?.employeeId && (() => {
                        const emp = allEmployees.find(e => e.id === editTarget.employeeId);
                        return emp ? <option key={emp.id} value={emp.id} className="bg-white dark:bg-[#0d1218] text-slate-800 dark:text-slate-100">{emp.nama} — {emp.nrk}</option> : null;
                      })()}
                      {availableEmployees.filter(e => e.id !== editTarget?.employeeId).map(emp => (
                        <option key={emp.id} value={emp.id} className="bg-white dark:bg-[#0d1218] text-slate-800 dark:text-slate-100">{emp.nama} — {emp.nrk}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                  </div>
                  <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">Hubungkan akun user ke data employee yang tersedia.</p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 border-t border-slate-150 dark:border-white/[0.06] px-5 py-4">
                <button onClick={() => setModalOpen(false)} className="rounded-xl border border-slate-250 dark:border-white/[0.08] px-4 py-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04] hover:text-slate-700 dark:hover:text-slate-200 transition-all cursor-pointer focus:outline-none">Batal</button>
                <LiquidButton variant="outline" size="sm" onClick={handleSave} disabled={saving} className="cursor-pointer font-bold">
                  {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Menyimpan...</> : editTarget ? 'Simpan Perubahan' : 'Tambahkan'}
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
                <button onClick={handleDelete} disabled={deleting} className="flex-1 rounded-xl bg-rose-500/90 hover:bg-rose-500 px-4 py-2.5 text-sm font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer focus:outline-none shadow-lg shadow-rose-500/20 disabled:opacity-50">
                  {deleting ? <><Loader2 className="h-4 w-4 animate-spin inline mr-1" /> Menghapus...</> : 'Hapus Sekarang'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </ModalPortal>

    </div>
  );
}
