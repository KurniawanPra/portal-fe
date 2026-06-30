'use client';

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  Users, Plus, Search, Pencil, Trash2, X, CheckCircle2, AlertCircle,
  Mail, Building2, UserX, UserCheck, ShieldCheck,
  ShieldAlert, UserCog, ChevronDown, Loader2, Lock, User
} from 'lucide-react';
import { ModalPortal } from '@/components/ui/ModalPortal';
import { api, ApiRequestError } from '@/lib/api';
import { PrimaryButton, FilterDropdown, SecondaryButton, DangerButton, Toast, CrudPagination, SearchInput, CrudTable, TableActions } from '@/admin/master/components/shared';
import { resolveImageUrl } from '@/lib/utils';

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
          <SearchInput
            placeholder="Cari nama, email, atau NRK..."
            value={search}
            onChange={setSearch}
          />
          <div className="flex flex-wrap items-center gap-3">
            <FilterDropdown<string>
              value={filterRole}
              onChange={(val) => setFilterRole(val as any)}
              options={[
                { label: 'Semua Role', value: 'Semua' },
                { label: 'Admin', value: 'Admin' },
                { label: 'User', value: 'User' },
              ]}
            />
            <FilterDropdown<string>
              value={filterStatus}
              onChange={(val) => setFilterStatus(val as any)}
              options={[
                { label: 'Semua Status', value: 'Semua' },
                { label: 'Aktif', value: 'Aktif' },
                { label: 'Suspended', value: 'Suspended' },
              ]}
            />
          </div>
        </div>

        {/* Table */}
        <CrudTable<UserData>
          headers={['User','NRK / Jabatan','Role','Status','MFA / Keamanan','Login Terakhir','Aksi']}
          loading={loading}
          loadingText="Memuat data user..."
          emptyText="Tidak ada user yang sesuai."
          data={paginatedData}
          renderRow={(u) => (
            <tr key={u.id} className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors duration-150">
              {/* User */}
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-3">
                  {u.fotoProfil ? (
                    <img
                      src={resolveImageUrl(u.fotoProfil)}
                      alt={u.nama}
                      className="h-9 w-9 shrink-0 rounded-full object-cover shadow-sm border border-slate-100 dark:border-white/[0.08]"
                    />
                  ) : (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800/85 text-slate-400 dark:text-slate-500 border border-slate-205/50 dark:border-white/[0.04] shadow-sm">
                      <User className="h-4 w-4" />
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
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-655 uppercase">MFA Off</span>
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
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-655 uppercase">Passkey Off</span>
                  )}
                </div>
              </td>
              {/* Last Login */}
              <td className="px-5 py-3.5 text-xs font-bold text-slate-555 dark:text-slate-500">{fmtLogin(u.last_login)}</td>
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

                  <TableActions
                    onEdit={() => openEdit(u)}
                    onDelete={() => setDeleteTarget(u)}
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
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-150 dark:border-white/[0.06]">
                <div className="flex items-center gap-2.5">
                  {editTarget ? <Pencil className="h-4 w-4 text-indigo-500 dark:text-indigo-400"/> : <Plus className="h-4 w-4 text-indigo-500 dark:text-indigo-400"/>}
                  <h2 className="text-sm font-black text-slate-800 dark:text-slate-100">{editTarget ? 'Edit Data User' : 'Tambah User Baru'}</h2>
                </div>
                <button onClick={() => setModalOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:text-slate-700 dark:hover:text-slate-300 transition-all cursor-pointer focus:outline-none">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="px-5 py-5 space-y-4 max-h-[65vh] overflow-y-auto hide-scrollbar">
                <div>
                  <label className={labelCls}>Email *</label>
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
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0d1218] shadow-2xl p-6 text-center">
              <div className="mx-auto mb-4 flex items-center justify-center">
                <Trash2 className="h-8 w-8 text-rose-500 dark:text-rose-400" />
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
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0d1218] shadow-2xl p-6 text-center">
              <div className="mx-auto mb-4 flex items-center justify-center">
                <ShieldAlert className="h-8 w-8 text-rose-500 dark:text-rose-400" />
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
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0d1218] shadow-2xl p-6 text-center">
              <div className="mx-auto mb-4 flex items-center justify-center">
                <Trash2 className="h-8 w-8 text-rose-500 dark:text-rose-400" />
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



    </div>
  );
}
