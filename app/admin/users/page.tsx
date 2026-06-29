'use client';

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  Users, Plus, Search, Pencil, Trash2, X, CheckCircle2, AlertCircle,
  Mail, Building2, UserX, UserCheck, ShieldCheck,
  ShieldAlert, UserCog, ChevronDown, Loader2, Lock
} from 'lucide-react';
import { ModalPortal } from '@/components/ui/ModalPortal';
import { api, ApiRequestError } from '@/lib/api';
import { PrimaryButton } from '@/admin/master/components/shared';

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
  totpEnabled: boolean;
  passkeyCount: number;
}

interface EmployeeBrief {
  id: string;
  nama: string;
  nrk: string;
  jabatan: string;
  fotoProfil: string | null;
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
  fotoProfil?: string;
  totpEnabled: boolean;
  passkeyCount: number;
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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterRole, filterStatus]);
  const [loading, setLoading] = useState(true);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const roleDropdownRef = useRef<HTMLDivElement>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  const [modalOpen,    setModalOpen]    = useState(false);
  const [editTarget,   setEditTarget]   = useState<UserData | null>(null);
  const [form,         setForm]         = useState<FormData>(emptyForm);
  const [errors,       setErrors]       = useState<Record<string, string>>({});
  const [saving,       setSaving]       = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserData | null>(null);
  const [deleting,     setDeleting]     = useState(false);
  const [toast,        setToast]        = useState<{ type:'ok'|'err'; text:string } | null>(null);
  const [reset2faTarget, setReset2faTarget] = useState<UserData | null>(null);
  const [resetPasskeyTarget, setResetPasskeyTarget] = useState<UserData | null>(null);
  const [resettingMfa, setResettingMfa] = useState(false);

  // App Access states
  const [appAccessTarget, setAppAccessTarget] = useState<UserData | null>(null);
  const [allApps, setAllApps] = useState<any[]>([]);
  const [userApps, setUserApps] = useState<any[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [savingAppAccess, setSavingAppAccess] = useState<Record<string, boolean>>({});

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
          fotoProfil: emp?.fotoProfil || undefined,
          totpEnabled: u.totpEnabled || false,
          passkeyCount: Number(u.passkeyCount) || 0,
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

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(e.target as Node)) {
        setRoleDropdownOpen(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target as Node)) {
        setStatusDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ─── Filtering ────────────────────────────────────────────────────────────
  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return (u.nama.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.nrk.toLowerCase().includes(q))
      && (filterRole   === 'Semua' || u.role   === filterRole)
      && (filterStatus === 'Semua' || u.status === filterStatus);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginatedData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Employee yang sudah di-assign ke user lain tidak bisa dipilih lagi
  const assignedEmployeeIds = useMemo(() => new Set(users.filter(u => u.employeeId).map(u => u.employeeId!)), [users]);
  const availableEmployees = useMemo(() => allEmployees.filter(e => !assignedEmployeeIds.has(e.id)), [allEmployees, assignedEmployeeIds]);

  const openCreate = useCallback(() => { setEditTarget(null); setForm(emptyForm); setErrors({}); setModalOpen(true); }, []);
  const openEdit   = useCallback((u: UserData) => {
    setEditTarget(u);
    setErrors({});
    setForm({ email: u.email, password: '', role: u.role, status: u.status, employeeId: u.employeeId ?? '' });
    setModalOpen(true);
  }, []);

  // ─── Save (Create/Update) ─────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    setErrors({});
    if (!form.email.trim())     { setErrors(e => ({ ...e, email: 'Email wajib diisi.' })); showToast('err', 'Email wajib diisi.'); return; }
    if (!form.email.includes('@')) { setErrors(e => ({ ...e, email: 'Format email tidak valid.' })); showToast('err', 'Format email tidak valid.'); return; }
    if (!editTarget && !form.password.trim()) { setErrors(e => ({ ...e, password: 'Password wajib diisi.' })); showToast('err', 'Password wajib diisi untuk user baru.'); return; }

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
      if (err instanceof ApiRequestError && err.details) {
        const fieldErrors: Record<string, string> = {};
        err.details.forEach(d => {
          let fieldName = d.field;
          if (fieldName === 'isActive') fieldName = 'status';
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

  // ─── Reset 2FA ─────────────────────────────────────────────────────────────
  const handleReset2fa = useCallback(async () => {
    if (!reset2faTarget) return;
    setResettingMfa(true);
    try {
      await api.post(`/users/${reset2faTarget.id}/2fa/disable`, {});
      showToast('ok', `2FA untuk "${reset2faTarget.email}" berhasil dinonaktifkan.`);
      setReset2faTarget(null);
      setLoading(true);
      await fetchUsers();
    } catch (err) {
      showToast('err', err instanceof Error ? err.message : 'Gagal mereset 2FA.');
    } finally {
      setResettingMfa(false);
    }
  }, [reset2faTarget, fetchUsers]);

  // ─── Reset Passkeys ────────────────────────────────────────────────────────
  const handleResetPasskeys = useCallback(async () => {
    if (!resetPasskeyTarget) return;
    setResettingMfa(true);
    try {
      await api.delete(`/users/${resetPasskeyTarget.id}/passkeys`);
      showToast('ok', `Semua passkey untuk "${resetPasskeyTarget.email}" berhasil dihapus.`);
      setResetPasskeyTarget(null);
      setLoading(true);
      await fetchUsers();
    } catch (err) {
      showToast('err', err instanceof Error ? err.message : 'Gagal mereset Passkey.');
    } finally {
      setResettingMfa(false);
    }
  }, [resetPasskeyTarget, fetchUsers]);

  // ─── Manage App Access ──────────────────────────────────────────────────────
  const openAppAccess = useCallback(async (u: UserData) => {
    setAppAccessTarget(u);
    setLoadingApps(true);
    try {
      const [appsRes, userAppsRes] = await Promise.all([
        api.get<any[]>('/apps?limit=100'),
        api.get<any[]>(`/users/${u.id}/apps`),
      ]);
      setAllApps(appsRes.data || []);
      setUserApps(userAppsRes.data || []);
    } catch (err) {
      showToast('err', err instanceof Error ? err.message : 'Gagal memuat data akses aplikasi.');
    } finally {
      setLoadingApps(false);
    }
  }, []);

  const handleToggleAppAccess = async (appId: string, isGranted: boolean) => {
    if (!appAccessTarget) return;
    setSavingAppAccess(prev => ({ ...prev, [appId]: true }));
    try {
      if (isGranted) {
        await api.delete(`/users/${appAccessTarget.id}/revoke-app/${appId}`);
        setUserApps(prev => prev.filter(ua => ua.app.id !== appId));
        showToast('ok', 'Akses aplikasi berhasil dicabut.');
      } else {
        const res = await api.post<{ id: string }>(`/users/${appAccessTarget.id}/grant-app`, { appId });
        const appInfo = allApps.find(a => a.id === appId);
        setUserApps(prev => [
          ...prev,
          {
            accessId: res.data.id,
            app: appInfo,
          }
        ]);
        showToast('ok', 'Akses aplikasi berhasil diberikan.');
      }
    } catch (err) {
      showToast('err', err instanceof Error ? err.message : 'Gagal mengubah akses aplikasi.');
    } finally {
      setSavingAppAccess(prev => ({ ...prev, [appId]: false }));
    }
  };

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
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            Manajemen User
          </h1>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Kelola pengguna dan hak akses Portal SSO PT INL.</p>
        </div>
        <PrimaryButton onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Tambah User
        </PrimaryButton>
      </div>

      {/* Stats — flat inline, no cards */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 bg-white dark:bg-slate-900 px-5 py-4 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        {[
          { label:'Total User', value:users.length, icon:Users,       color:'text-amber-600 dark:text-amber-400'   },
          { label:'Admin',      value:adminCount,   icon:ShieldCheck, color:'text-indigo-650 dark:text-indigo-400'  },
          { label:'Aktif',      value:activeCount,  icon:UserCheck,   color:'text-emerald-650 dark:text-emerald-450' },
          { label:'Suspended',  value:suspendCount, icon:ShieldAlert, color:'text-rose-650 dark:text-rose-455'    },
        ].map((s, i, arr) => {
          const Icon = s.icon;
          return (
            <React.Fragment key={s.label}>
              <div className="flex items-center gap-2">
                <Icon className={`h-4 w-4 shrink-0 ${s.color}`} />
                <span className="text-sm font-bold text-slate-850 dark:text-white">{s.value}</span>
                <span className="text-xs font-semibold text-slate-550 dark:text-slate-400">{s.label}</span>
              </div>
              {i < arr.length - 1 && <span className="h-4 w-px bg-slate-200 dark:bg-slate-850 shrink-0" />}
            </React.Fragment>
          );
        })}
      </div>

      {/* Table Card */}
      <div className="relative overflow-hidden rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">

        {/* Toolbar */}
        <div className="flex flex-col gap-3 px-5 py-4 border-b border-slate-100 dark:border-white/[0.06] sm:flex-row sm:items-center sm:justify-between flex-wrap">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
            <input type="text" placeholder="Cari nama, email, atau NRK..." value={search} onChange={e => setSearch(e.target.value)}
              className={`${inputCls} pl-10`} />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Role Dropdown */}
            <div 
              ref={roleDropdownRef}
              className="relative"
            >
              <button
                type="button"
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className="flex items-center justify-between gap-2.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0a0f1a] px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-white/[0.15] hover:bg-slate-100/50 dark:hover:bg-white/[0.02] focus:outline-none transition-all cursor-pointer min-w-[140px]"
              >
                <div className="flex items-center gap-2">
                  {filterRole === 'Admin' && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
                  {filterRole === 'User' && <span className="h-1.5 w-1.5 rounded-full bg-indigo-505" />}
                  {filterRole === 'Semua' && <span className="h-1.5 w-1.5 rounded-full bg-slate-450" />}
                  <span>{filterRole === 'Semua' ? 'Semua Role' : filterRole}</span>
                </div>
                <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${roleDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {roleDropdownOpen && (
                <div className="absolute left-0 mt-1.5 z-50 min-w-[150px] rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0d121c] p-1.5 shadow-[0_12px_30px_-6px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_30px_-6px_rgba(0,0,0,0.5)] animate-scale-in">
                  {(['Semua', ...ROLES] as const).map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => {
                        setFilterRole(r);
                        setRoleDropdownOpen(false);
                      }}
                      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition-all cursor-pointer text-left ${
                        filterRole === r
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.03]'
                      }`}
                    >
                      {r === 'Admin' && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
                      {r === 'User' && <span className="h-1.5 w-1.5 rounded-full bg-indigo-505" />}
                      {r === 'Semua' && <span className="h-1.5 w-1.5 rounded-full bg-slate-450" />}
                      <span>{r === 'Semua' ? 'Semua Role' : r}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Status Dropdown */}
            <div 
              ref={statusDropdownRef}
              className="relative"
            >
              <button
                type="button"
                onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                className="flex items-center justify-between gap-2.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0a0f1a] px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-white/[0.15] hover:bg-slate-100/50 dark:hover:bg-white/[0.02] focus:outline-none transition-all cursor-pointer min-w-[140px]"
              >
                <div className="flex items-center gap-2">
                  {filterStatus === 'Aktif' && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                  {filterStatus === 'Suspended' && <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />}
                  {filterStatus === 'Semua' && <span className="h-1.5 w-1.5 rounded-full bg-slate-450" />}
                  <span>{filterStatus === 'Semua' ? 'Semua Status' : filterStatus}</span>
                </div>
                <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${statusDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {statusDropdownOpen && (
                <div className="absolute left-0 mt-1.5 z-50 min-w-[150px] rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0d121c] p-1.5 shadow-[0_12px_30px_-6px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_30px_-6px_rgba(0,0,0,0.5)] animate-scale-in">
                  {(['Semua', ...STATUSES] as const).map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setFilterStatus(s as UserStatus | 'Semua');
                        setStatusDropdownOpen(false);
                      }}
                      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition-all cursor-pointer text-left ${
                        filterStatus === s
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.03]'
                      }`}
                    >
                      {s === 'Aktif' && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                      {s === 'Suspended' && <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />}
                      {s === 'Semua' && <span className="h-1.5 w-1.5 rounded-full bg-slate-450" />}
                      <span>{s === 'Semua' ? 'Semua Status' : s}</span>
                    </button>
                  ))}
                </div>
              )}
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
                {['User','NRK / Jabatan','Role','Status','MFA / Keamanan','Login Terakhir','Aksi'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 last:text-right">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.03]">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-sm font-semibold text-slate-455 dark:text-slate-500">Tidak ada user yang sesuai.</td></tr>
              ) : paginatedData.map(u => (
                <tr key={u.id} className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors duration-150">
                  {/* User */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      {u.fotoProfil ? (
                        <img
                          src={u.fotoProfil.startsWith('http') ? u.fotoProfil : `/uploads/${u.fotoProfil}`}
                          alt={u.nama}
                          className="h-9 w-9 shrink-0 rounded-full object-cover shadow-sm border border-slate-100 dark:border-white/[0.08]"
                        />
                      ) : (
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-black text-sm text-white bg-gradient-to-br ${ROLE_AVATAR[u.role]}`}>
                          {u.nama.charAt(0).toUpperCase()}
                        </div>
                      )}
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
                  {/* MFA / Keamanan */}
                  <td className="px-5 py-3.5">
                    <div className="flex flex-col gap-1.5 py-1">
                      {u.totpEnabled ? (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border border-emerald-500/20">
                            MFA Aktif
                          </span>
                          <button
                            onClick={() => setReset2faTarget(u)}
                            className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/15 hover:bg-rose-600 text-rose-600 dark:text-rose-400 hover:text-white border border-rose-500/30 transition-all cursor-pointer focus:outline-none"
                            title="Reset MFA (Nonaktifkan 2FA)"
                          >
                            Reset
                          </button>
                        </div>
                      ) : (
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-650 uppercase">MFA Off</span>
                      )}
                      {u.passkeyCount > 0 ? (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-450 border border-indigo-500/20">
                            Passkey ({u.passkeyCount})
                          </span>
                          <button
                            onClick={() => setResetPasskeyTarget(u)}
                            className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/15 hover:bg-rose-600 text-rose-600 dark:text-rose-400 hover:text-white border border-rose-500/30 transition-all cursor-pointer focus:outline-none"
                            title="Hapus Semua Passkey"
                          >
                            Delete
                          </button>
                        </div>
                      ) : (
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-650 uppercase">Passkey Off</span>
                      )}
                    </div>
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
                      <button onClick={() => openAppAccess(u)} title="Kelola Akses Aplikasi"
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:bg-indigo-500/10 hover:text-indigo-500 transition-all cursor-pointer focus:outline-none">
                        <UserCog className="h-3.5 w-3.5" />
                      </button>
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
        {/* Pagination Footer */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-5 py-4 border-t border-slate-100 dark:border-white/[0.04] bg-slate-50/50 dark:bg-white/[0.01] text-[11px] font-bold text-slate-550 dark:text-slate-400">
          <div>
            {filtered.length === 0 ? (
              <span>Menampilkan 0 entri</span>
            ) : (
              <span>
                Menampilkan {Math.min((currentPage - 1) * itemsPerPage + 1, filtered.length)} - {Math.min(currentPage * itemsPerPage, filtered.length)} dari {filtered.length} entri
                {filtered.length !== users.length && ` (disaring dari ${users.length} total)`}
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
                    <input type="email" value={form.email} onChange={e => setForm(f=>({...f, email:e.target.value}))} placeholder="nama@inl.co.id" className={`${inputCls} pl-10 ${errors.email ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/10 dark:border-rose-500/50' : ''}`} />
                  </div>
                  {errors.email && <span className="text-[10px] text-rose-500 mt-1 block font-bold">{errors.email}</span>}
                </div>
                <div>
                  <label className={labelCls}>{editTarget ? 'Password Baru (kosongkan jika tidak diubah)' : 'Password *'}</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                    <input type="password" value={form.password} onChange={e => setForm(f=>({...f, password:e.target.value}))} placeholder={editTarget ? '••••••••' : 'Min 8 karakter, huruf kapital + angka'} className={`${inputCls} pl-10 ${errors.password ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/10 dark:border-rose-500/50' : ''}`} />
                  </div>
                  {errors.password && <span className="text-[10px] text-rose-500 mt-1 block font-bold">{errors.password}</span>}
                  {!editTarget && !errors.password && <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">Min. 8 karakter, mengandung huruf kapital dan angka.</p>}
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
                      className={`${inputCls} pl-10 pr-10 appearance-none cursor-pointer ${errors.employeeId ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/10 dark:border-rose-500/50' : ''}`}
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
                  {errors.employeeId && <span className="text-[10px] text-rose-500 mt-1 block font-bold">{errors.employeeId}</span>}
                  {!errors.employeeId && <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">Hubungkan akun user ke data employee yang tersedia.</p>}
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 border-t border-slate-150 dark:border-white/[0.06] px-5 py-4">
                <button onClick={() => setModalOpen(false)} className="rounded-xl border border-slate-250 dark:border-white/[0.08] px-4 py-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04] hover:text-slate-700 dark:hover:text-slate-200 transition-all cursor-pointer focus:outline-none">Batal</button>
                <PrimaryButton onClick={handleSave} disabled={saving}>
                  {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Menyimpan...</> : editTarget ? 'Simpan Perubahan' : 'Tambahkan'}
                </PrimaryButton>
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

      {/* Reset 2FA Modal via Portal */}
      <ModalPortal open={!!reset2faTarget}>
        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setReset2faTarget(null)} />
        <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
          <div className="pointer-events-auto w-full max-w-sm animate-fade-up">
            <div className="relative overflow-hidden rounded-2xl border border-rose-500/20 bg-white dark:bg-[#0d1218] shadow-2xl p-6 text-center">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rose-500/50 to-transparent" />
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20">
                <ShieldAlert className="h-6 w-6 text-rose-500 dark:text-rose-400" />
              </div>
              <h3 className="text-base font-black text-slate-800 dark:text-slate-100">Reset MFA User?</h3>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Multi-Factor Authentication (MFA / 2FA) untuk user <span className="font-bold text-slate-800 dark:text-slate-200">&quot;{reset2faTarget?.email}&quot;</span> akan dinonaktifkan. User dapat masuk hanya menggunakan password.
              </p>
              <div className="mt-5 flex gap-3">
                <button onClick={() => setReset2faTarget(null)} className="flex-1 rounded-xl border border-slate-200 dark:border-white/[0.08] px-4 py-2.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04] hover:text-slate-700 dark:hover:text-slate-200 transition-all cursor-pointer focus:outline-none">Batal</button>
                <button onClick={handleReset2fa} disabled={resettingMfa} className="flex-1 rounded-xl bg-rose-500/90 hover:bg-rose-500 px-4 py-2.5 text-xs font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer focus:outline-none shadow-lg shadow-rose-500/20 disabled:opacity-50">
                  {resettingMfa ? <><Loader2 className="h-3.5 w-3.5 animate-spin inline mr-1" /> Mereset...</> : 'Reset Sekarang'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </ModalPortal>

      {/* Reset Passkey Modal via Portal */}
      <ModalPortal open={!!resetPasskeyTarget}>
        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setResetPasskeyTarget(null)} />
        <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
          <div className="pointer-events-auto w-full max-w-sm animate-fade-up">
            <div className="relative overflow-hidden rounded-2xl border border-rose-500/20 bg-white dark:bg-[#0d1218] shadow-2xl p-6 text-center">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rose-500/50 to-transparent" />
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20">
                <Trash2 className="h-6 w-6 text-rose-500 dark:text-rose-400" />
              </div>
              <h3 className="text-base font-black text-slate-800 dark:text-slate-100">Hapus Semua Passkey?</h3>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Semua perangkat Passkey yang terdaftar untuk user <span className="font-bold text-slate-800 dark:text-slate-200">&quot;{resetPasskeyTarget?.email}&quot;</span> ({resetPasskeyTarget?.passkeyCount} perangkat) akan dihapus secara permanen.
              </p>
              <div className="mt-5 flex gap-3">
                <button onClick={() => setResetPasskeyTarget(null)} className="flex-1 rounded-xl border border-slate-200 dark:border-white/[0.08] px-4 py-2.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04] hover:text-slate-700 dark:hover:text-slate-200 transition-all cursor-pointer focus:outline-none">Batal</button>
                <button onClick={handleResetPasskeys} disabled={resettingMfa} className="flex-1 rounded-xl bg-rose-500/90 hover:bg-rose-500 px-4 py-2.5 text-xs font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer focus:outline-none shadow-lg shadow-rose-500/20 disabled:opacity-50">
                  {resettingMfa ? <><Loader2 className="h-3.5 w-3.5 animate-spin inline mr-1" /> Menghapus...</> : 'Hapus Sekarang'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </ModalPortal>

      {/* Manage Application Access Modal */}
      <ModalPortal open={!!appAccessTarget}>
        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setAppAccessTarget(null)} />
        <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
          <div className="pointer-events-auto w-full max-w-md animate-fade-up">
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0d1218] shadow-2xl">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/60 to-transparent" />
              
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-150 dark:border-white/[0.06]">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                    <UserCog className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
                  </div>
                  <h2 className="text-sm font-black text-slate-800 dark:text-slate-100">Kelola Akses Aplikasi</h2>
                </div>
                <button onClick={() => setAppAccessTarget(null)} className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:text-slate-700 dark:hover:text-slate-300 transition-all cursor-pointer focus:outline-none">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Body */}
              <div className="px-5 py-5 space-y-4 max-h-[60vh] overflow-y-auto hide-scrollbar">
                <div className="bg-slate-50 dark:bg-white/[0.01] p-3.5 border border-slate-150 dark:border-white/[0.04] rounded-xl">
                  <p className="text-xs text-slate-500 dark:text-slate-450 leading-tight">
                    Mengatur hak akses aplikasi untuk user:
                  </p>
                  <p className="text-sm font-black text-slate-800 dark:text-slate-150 mt-1">
                    {appAccessTarget?.nama} <span className="font-medium text-slate-400">({appAccessTarget?.email})</span>
                  </p>
                </div>

                {loadingApps ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
                    <span className="text-xs text-slate-400 font-bold">Memuat daftar aplikasi...</span>
                  </div>
                ) : allApps.length === 0 ? (
                  <p className="text-center text-xs text-slate-455 dark:text-slate-500 py-8 font-semibold">Tidak ada aplikasi yang terdaftar.</p>
                ) : (
                  <div className="space-y-3.5">
                    {allApps.map(app => {
                      const userApp = userApps.find(ua => ua.app.id === app.id);
                      const isGranted = !!userApp;
                      const isSaving = !!savingAppAccess[app.id];

                      return (
                        <div key={app.id} className="flex items-center justify-between p-3.5 border border-slate-150 dark:border-white/[0.04] rounded-xl bg-white dark:bg-[#090d16] hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-all">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isGranted}
                              disabled={isSaving}
                              onChange={() => handleToggleAppAccess(app.id, isGranted)}
                              className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500/25 cursor-pointer disabled:opacity-50"
                            />
                            <div>
                              <p className="text-xs font-black text-slate-800 dark:text-slate-200">{app.nama}</p>
                              <p className="text-[10px] text-slate-455 dark:text-slate-500 truncate max-w-[200px]">{app.url}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-500 shrink-0" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end border-t border-slate-150 dark:border-white/[0.06] px-5 py-4 bg-slate-50/50 dark:bg-white/[0.01]">
                <button
                  onClick={() => setAppAccessTarget(null)}
                  className="rounded-xl border border-slate-250 dark:border-white/[0.08] bg-white dark:bg-[#0f1623] px-4 py-2 text-xs font-bold text-slate-650 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-all cursor-pointer focus:outline-none"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      </ModalPortal>

    </div>
  );
}
