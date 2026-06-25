'use client';

import React, { useState, useCallback } from 'react';
import {
  Users, Plus, Search, Pencil, Trash2, X, CheckCircle2, AlertCircle,
  Mail, Phone, MapPin, Briefcase, Building2, UserCheck, UserX,
  IdCard, CalendarDays, GraduationCap, Heart
} from 'lucide-react';
import { ModalPortal } from '@/components/ui/ModalPortal';
import { LiquidButton } from '@/components/animate-ui/components/buttons/liquid';

// ─── Types ───────────────────────────────────────────────────────────────────
type JenisKelamin = 'L' | 'P';

interface EmployeeData {
  id: string;
  nrk: string;
  nik: string;
  nama: string;
  jenisKelamin: JenisKelamin;
  jabatan: string;
  unitOrganisasi: string;
  tanggalMasuk: string;
  tempatLahir: string;
  tanggalLahir: string;
  nomorHp: string;
  alamat: string;
  isActive: boolean;
  createdAt: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const INITIAL_EMPLOYEES: EmployeeData[] = [
  { id: 'emp-1', nrk: 'NRK-260901', nik: '3201234567890001', nama: 'Budi Santoso, S.T.',  jenisKelamin: 'L', jabatan: 'IT Lead Specialist',       unitOrganisasi: 'Teknologi Informasi & Digital', tanggalMasuk: '2020-03-15', tempatLahir: 'Jakarta',   tanggalLahir: '1990-05-12', nomorHp: '0812-3456-7890', alamat: 'Jl. Sudirman No. 10, Jakarta Pusat',     isActive: true,  createdAt: '2024-01-10' },
  { id: 'emp-2', nrk: 'NRK-260902', nik: '3201234567890002', nama: 'Hendra Gunawan',      jenisKelamin: 'L', jabatan: 'Accounting Manager',       unitOrganisasi: 'Keuangan',                      tanggalMasuk: '2019-07-01', tempatLahir: 'Bandung',   tanggalLahir: '1988-11-22', nomorHp: '0812-7654-3210', alamat: 'Jl. Gatot Subroto No. 45, Jakarta Selatan', isActive: true,  createdAt: '2024-01-12' },
  { id: 'emp-3', nrk: 'NRK-260903', nik: '3201234567890003', nama: 'Citra Anggraini',     jenisKelamin: 'P', jabatan: 'HR Specialist',             unitOrganisasi: 'SDM & Umum',                    tanggalMasuk: '2021-01-10', tempatLahir: 'Surabaya',  tanggalLahir: '1993-03-08', nomorHp: '0813-8888-9999', alamat: 'Jl. HR Rasuna Said No. 20, Jakarta',       isActive: true,  createdAt: '2024-02-05' },
  { id: 'emp-4', nrk: 'NRK-260904', nik: '3201234567890004', nama: 'Rian Hidayat',        jenisKelamin: 'L', jabatan: 'Plant Operator',             unitOrganisasi: 'Operasional Pabrik',             tanggalMasuk: '2022-06-20', tempatLahir: 'Medan',     tanggalLahir: '1995-09-15', nomorHp: '0852-1111-2222', alamat: 'Jl. Industri No. 88, Cikarang',            isActive: true,  createdAt: '2024-02-20' },
  { id: 'emp-5', nrk: 'NRK-260905', nik: '3201234567890005', nama: 'Dewi Lestari',        jenisKelamin: 'P', jabatan: 'Marketing Communicator',     unitOrganisasi: 'Pemasaran',                      tanggalMasuk: '2021-09-01', tempatLahir: 'Yogyakarta', tanggalLahir: '1992-12-03', nomorHp: '0811-2222-3333', alamat: 'Jl. Thamrin No. 55, Jakarta Pusat',        isActive: true,  createdAt: '2024-03-01' },
  { id: 'emp-6', nrk: 'NRK-260906', nik: '3201234567890006', nama: 'Agus Pratama',        jenisKelamin: 'L', jabatan: 'Procurement Specialist',     unitOrganisasi: 'Logistik',                       tanggalMasuk: '2023-02-15', tempatLahir: 'Semarang',  tanggalLahir: '1991-07-20', nomorHp: '0856-4444-5555', alamat: 'Jl. Pemuda No. 12, Tangerang',             isActive: false, createdAt: '2024-04-10' },
  { id: 'emp-7', nrk: 'NRK-260907', nik: '3201234567890007', nama: 'Siti Nurhaliza',      jenisKelamin: 'P', jabatan: 'Legal Officer',               unitOrganisasi: 'Hukum & Kepatuhan',              tanggalMasuk: '2020-11-05', tempatLahir: 'Makassar',  tanggalLahir: '1994-01-28', nomorHp: '0822-6666-7777', alamat: 'Jl. Kuningan No. 33, Jakarta Selatan',     isActive: true,  createdAt: '2024-04-15' },
];

const UNIT_ORGANISASI = [
  'Teknologi Informasi & Digital',
  'Keuangan',
  'SDM & Umum',
  'Operasional Pabrik',
  'Pemasaran',
  'Logistik',
  'Hukum & Kepatuhan',
];

// Color palettes
const STATUS_BADGE = {
  true:  'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border-emerald-500/20',
  false: 'bg-rose-500/10 text-rose-600 dark:text-rose-450 border-rose-500/20',
} as Record<string, string>;

const STATUS_DOT = {
  true:  'bg-emerald-500 dark:bg-emerald-400',
  false: 'bg-rose-500 dark:bg-rose-400',
} as Record<string, string>;

const GENDER_BADGE: Record<JenisKelamin, string> = {
  L: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  P: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20',
};

const GENDER_AVATAR: Record<JenisKelamin, string> = {
  L: 'from-blue-400 to-blue-600',
  P: 'from-pink-400 to-pink-600',
};

const inputCls = 'w-full rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0a0f1a] px-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10 transition-all duration-200';
const labelCls = 'mb-1.5 block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400';

type FormData = Omit<EmployeeData, 'id' | 'createdAt'>;
const emptyForm: FormData = {
  nrk: '', nik: '', nama: '', jenisKelamin: 'L', jabatan: '',
  unitOrganisasi: UNIT_ORGANISASI[0], tanggalMasuk: '', tempatLahir: '',
  tanggalLahir: '', nomorHp: '', alamat: '', isActive: true,
};

export default function ManajemenEmployeePage() {
  const [employees, setEmployees] = useState<EmployeeData[]>(INITIAL_EMPLOYEES);
  const [search, setSearch]       = useState('');
  const [filterStatus, setFilterStatus] = useState<'Semua' | 'Aktif' | 'Non-Aktif'>('Semua');
  const [filterGender, setFilterGender] = useState<'Semua' | 'L' | 'P'>('Semua');

  const [modalOpen,    setModalOpen]    = useState(false);
  const [editTarget,   setEditTarget]   = useState<EmployeeData | null>(null);
  const [form,         setForm]         = useState<FormData>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<EmployeeData | null>(null);
  const [toast,        setToast]        = useState<{ type:'ok'|'err'; text:string } | null>(null);

  const showToast = (type: 'ok'|'err', text: string) => { setToast({ type, text }); setTimeout(() => setToast(null), 3200); };

  const filtered = employees.filter(e => {
    const q = search.toLowerCase();
    const matchSearch = e.nama.toLowerCase().includes(q) || e.nrk.toLowerCase().includes(q) || e.nik.includes(q) || e.jabatan.toLowerCase().includes(q);
    const matchStatus = filterStatus === 'Semua' || (filterStatus === 'Aktif' ? e.isActive : !e.isActive);
    const matchGender = filterGender === 'Semua' || e.jenisKelamin === filterGender;
    return matchSearch && matchStatus && matchGender;
  });

  const openCreate = useCallback(() => { setEditTarget(null); setForm(emptyForm); setModalOpen(true); }, []);
  const openEdit   = useCallback((e: EmployeeData) => {
    setEditTarget(e);
    setForm({
      nrk: e.nrk, nik: e.nik, nama: e.nama, jenisKelamin: e.jenisKelamin, jabatan: e.jabatan,
      unitOrganisasi: e.unitOrganisasi, tanggalMasuk: e.tanggalMasuk, tempatLahir: e.tempatLahir,
      tanggalLahir: e.tanggalLahir, nomorHp: e.nomorHp, alamat: e.alamat, isActive: e.isActive,
    });
    setModalOpen(true);
  }, []);

  const handleSave = useCallback(() => {
    if (!form.nama.trim())                      { showToast('err', 'Nama wajib diisi.'); return; }
    if (!form.nrk.trim())                       { showToast('err', 'NRK wajib diisi.'); return; }
    if (!form.nik.trim() || form.nik.length !== 16) { showToast('err', 'NIK harus 16 digit.'); return; }
    if (!form.jabatan.trim())                   { showToast('err', 'Jabatan wajib diisi.'); return; }

    if (editTarget) {
      setEmployees(p => p.map(e => e.id === editTarget.id ? { ...e, ...form } : e));
      showToast('ok', `"${form.nama}" berhasil diperbarui.`);
    } else {
      setEmployees(p => [...p, { ...form, id: `emp-${Date.now()}`, createdAt: new Date().toISOString().slice(0, 10) }]);
      showToast('ok', `"${form.nama}" berhasil ditambahkan.`);
    }
    setModalOpen(false);
  }, [form, editTarget]);

  const handleDelete = useCallback(() => {
    if (!deleteTarget) return;
    setEmployees(p => p.filter(e => e.id !== deleteTarget.id));
    showToast('ok', `"${deleteTarget.nama}" dihapus.`);
    setDeleteTarget(null);
  }, [deleteTarget]);

  const fmtDate = (s: string) => {
    if (!s || s === '-') return '-';
    try { return new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch { return s; }
  };

  const activeCount   = employees.filter(e => e.isActive).length;
  const inactiveCount = employees.filter(e => !e.isActive).length;
  const maleCount     = employees.filter(e => e.jenisKelamin === 'L').length;
  const femaleCount   = employees.filter(e => e.jenisKelamin === 'P').length;

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
            <Briefcase className="h-6 w-6 text-amber-500 dark:text-amber-400" />
            Manajemen Employee
          </h1>
          <p className="mt-1 text-sm font-semibold text-slate-550 dark:text-slate-400">Kelola data karyawan PT Industri Nabati Lestari.</p>
        </div>
        <LiquidButton variant="outline" size="sm" onClick={openCreate} className="cursor-pointer flex items-center gap-2 font-bold">
          <Plus className="h-4 w-4" />
          Tambah Employee
        </LiquidButton>
      </div>

      {/* Stats — flat inline */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        {[
          { label: 'Total',    value: employees.length, icon: Users,     color: 'text-amber-500 dark:text-amber-400'    },
          { label: 'Aktif',    value: activeCount,      icon: UserCheck, color: 'text-emerald-500 dark:text-emerald-450' },
          { label: 'Non-Aktif',value: inactiveCount,    icon: UserX,     color: 'text-rose-500 dark:text-rose-405'      },
          { label: 'Laki-laki',value: maleCount,        icon: Users,     color: 'text-blue-500 dark:text-blue-400'      },
          { label: 'Perempuan',value: femaleCount,       icon: Users,     color: 'text-pink-500 dark:text-pink-400'      },
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
            <input type="text" placeholder="Cari nama, NRK, NIK, jabatan..." value={search} onChange={e => setSearch(e.target.value)}
              className={`${inputCls} pl-10`} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1">
              {(['Semua', 'Aktif', 'Non-Aktif'] as const).map(s => (
                <button key={s} onClick={() => setFilterStatus(s)}
                  className={`rounded-lg px-2.5 py-1.5 text-[11px] font-black uppercase tracking-wide transition-all cursor-pointer focus:outline-none ${filterStatus===s ? 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 dark:border-amber-500/30' : 'text-slate-550 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 border border-transparent'}`}>
                  {s}
                </button>
              ))}
            </div>
            <div className="h-3.5 w-px bg-slate-200 dark:bg-white/[0.08]" />
            <div className="flex items-center gap-1">
              {(['Semua', 'L', 'P'] as const).map(g => (
                <button key={g} onClick={() => setFilterGender(g)}
                  className={`rounded-lg px-2.5 py-1.5 text-[11px] font-black uppercase tracking-wide transition-all cursor-pointer focus:outline-none ${filterGender===g ? 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 dark:border-amber-500/30' : 'text-slate-550 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 border border-transparent'}`}>
                  {g === 'L' ? 'Laki-laki' : g === 'P' ? 'Perempuan' : g}
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
                {['Employee', 'NIK', 'Jabatan / Unit', 'Jenis Kelamin', 'Status', 'Tgl Masuk', 'Aksi'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 last:text-right">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.03]">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-sm font-semibold text-slate-400 dark:text-slate-500">Tidak ada employee yang sesuai.</td></tr>
              ) : filtered.map(e => (
                <tr key={e.id} className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors duration-150">
                  {/* Employee */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-black text-sm text-white bg-gradient-to-br ${GENDER_AVATAR[e.jenisKelamin]}`}>
                        {e.nama.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 dark:text-slate-100 truncate">{e.nama}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <IdCard className="h-3 w-3 text-slate-400 dark:text-slate-500 shrink-0" />
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{e.nrk}</p>
                        </div>
                      </div>
                    </div>
                  </td>
                  {/* NIK */}
                  <td className="px-5 py-3.5">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono">{e.nik}</p>
                  </td>
                  {/* Jabatan / Unit */}
                  <td className="px-5 py-3.5">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{e.jabatan}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Building2 className="h-3 w-3 text-slate-400 dark:text-slate-500 shrink-0" />
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">{e.unitOrganisasi}</p>
                    </div>
                  </td>
                  {/* Jenis Kelamin */}
                  <td className="px-5 py-3.5">
                    <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide ${GENDER_BADGE[e.jenisKelamin]}`}>
                      {e.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                    </span>
                  </td>
                  {/* Status */}
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide ${STATUS_BADGE[String(e.isActive)]}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[String(e.isActive)]}`} />
                      {e.isActive ? 'Aktif' : 'Non-Aktif'}
                    </span>
                  </td>
                  {/* Tgl Masuk */}
                  <td className="px-5 py-3.5 text-xs font-bold text-slate-550 dark:text-slate-500">{fmtDate(e.tanggalMasuk)}</td>
                  {/* Actions */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      {e.isActive ? (
                        <button title="Non-Aktifkan" onClick={() => setEmployees(p => p.map(x => x.id===e.id ? {...x, isActive: false} : x))}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:bg-rose-500/10 hover:text-rose-500 transition-all cursor-pointer focus:outline-none">
                          <UserX className="h-3.5 w-3.5" />
                        </button>
                      ) : (
                        <button title="Aktifkan" onClick={() => setEmployees(p => p.map(x => x.id===e.id ? {...x, isActive: true} : x))}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:bg-emerald-500/10 hover:text-emerald-500 transition-all cursor-pointer focus:outline-none">
                          <UserCheck className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button onClick={() => openEdit(e)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:bg-amber-500/10 hover:text-amber-500 transition-all cursor-pointer focus:outline-none">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setDeleteTarget(e)}
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
          {filtered.length} dari {employees.length} employee
        </div>
      </div>

      {/* Create/Edit Modal via Portal */}
      <ModalPortal open={modalOpen}>
        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
        <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
          <div className="pointer-events-auto w-full max-w-xl animate-fade-up">
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0d1218] shadow-2xl">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/60 to-transparent" />
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-150 dark:border-white/[0.06]">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                    {editTarget ? <Pencil className="h-4 w-4 text-indigo-500 dark:text-indigo-400"/> : <Plus className="h-4 w-4 text-indigo-500 dark:text-indigo-400"/>}
                  </div>
                  <h2 className="text-sm font-black text-slate-800 dark:text-slate-100">{editTarget ? 'Edit Data Employee' : 'Tambah Employee Baru'}</h2>
                </div>
                <button onClick={() => setModalOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:text-slate-700 dark:hover:text-slate-300 transition-all cursor-pointer focus:outline-none">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="px-5 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
                {/* Nama */}
                <div>
                  <label className={labelCls}>Nama Lengkap *</label>
                  <input type="text" value={form.nama} onChange={e => setForm(f=>({...f, nama:e.target.value}))} placeholder="cth: Budi Santoso, S.T." className={inputCls} />
                </div>
                {/* NRK & NIK */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>NRK *</label>
                    <input type="text" value={form.nrk} onChange={e => setForm(f=>({...f, nrk:e.target.value}))} placeholder="NRK-XXXXXX" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>NIK (16 digit) *</label>
                    <input type="text" value={form.nik} onChange={e => setForm(f=>({...f, nik:e.target.value.replace(/\D/g, '').slice(0, 16)}))} placeholder="320123456789xxxx" maxLength={16} className={inputCls} />
                  </div>
                </div>
                {/* Jenis Kelamin & Jabatan */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Jenis Kelamin *</label>
                    <select value={form.jenisKelamin} onChange={e => setForm(f=>({...f, jenisKelamin: e.target.value as JenisKelamin}))} className={`${inputCls} cursor-pointer`}>
                      <option value="L" className="bg-white dark:bg-[#0d1218] text-slate-800 dark:text-slate-100">Laki-laki</option>
                      <option value="P" className="bg-white dark:bg-[#0d1218] text-slate-800 dark:text-slate-100">Perempuan</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Jabatan *</label>
                    <input type="text" value={form.jabatan} onChange={e => setForm(f=>({...f, jabatan:e.target.value}))} placeholder="cth: IT Specialist" className={inputCls} />
                  </div>
                </div>
                {/* Unit Organisasi */}
                <div>
                  <label className={labelCls}>Unit Organisasi</label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                    <select value={form.unitOrganisasi} onChange={e => setForm(f=>({...f, unitOrganisasi:e.target.value}))} className={`${inputCls} pl-10 cursor-pointer`}>
                      {UNIT_ORGANISASI.map(u => <option key={u} value={u} className="bg-white dark:bg-[#0d1218] text-slate-800 dark:text-slate-100">{u}</option>)}
                    </select>
                  </div>
                </div>
                {/* Tempat Lahir & Tanggal Lahir */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Tempat Lahir</label>
                    <input type="text" value={form.tempatLahir} onChange={e => setForm(f=>({...f, tempatLahir:e.target.value}))} placeholder="cth: Jakarta" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Tanggal Lahir</label>
                    <input type="date" value={form.tanggalLahir} onChange={e => setForm(f=>({...f, tanggalLahir:e.target.value}))} className={inputCls} />
                  </div>
                </div>
                {/* Tanggal Masuk & Status */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Tanggal Masuk</label>
                    <input type="date" value={form.tanggalMasuk} onChange={e => setForm(f=>({...f, tanggalMasuk:e.target.value}))} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Status</label>
                    <select value={form.isActive ? 'true' : 'false'} onChange={e => setForm(f=>({...f, isActive: e.target.value === 'true'}))} className={`${inputCls} cursor-pointer`}>
                      <option value="true" className="bg-white dark:bg-[#0d1218] text-slate-800 dark:text-slate-100">Aktif</option>
                      <option value="false" className="bg-white dark:bg-[#0d1218] text-slate-800 dark:text-slate-100">Non-Aktif</option>
                    </select>
                  </div>
                </div>
                {/* Nomor HP */}
                <div>
                  <label className={labelCls}>Nomor HP</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                    <input type="tel" value={form.nomorHp} onChange={e => setForm(f=>({...f, nomorHp:e.target.value}))} placeholder="08xx-xxxx-xxxx" className={`${inputCls} pl-10`} />
                  </div>
                </div>
                {/* Alamat */}
                <div>
                  <label className={labelCls}>Alamat</label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-3 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                    <textarea value={form.alamat} onChange={e => setForm(f=>({...f, alamat:e.target.value}))} placeholder="Alamat lengkap..." rows={2}
                      className={`${inputCls} pl-10 resize-none`} />
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
              <h3 className="text-base font-black text-slate-800 dark:text-slate-100">Hapus Employee?</h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Data karyawan <span className="font-bold text-slate-800 dark:text-slate-200">&quot;{deleteTarget?.nama}&quot;</span> akan dihapus permanen dari sistem.
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
