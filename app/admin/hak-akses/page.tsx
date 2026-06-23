'use client';

import React, { useState } from 'react';
import { ShieldCheck, Check, X, Info, Save } from 'lucide-react';
import { LiquidButton } from '@/components/animate-ui/components/buttons/liquid';

type Role = 'Admin' | 'User' | 'Viewer';

interface PermRow {
  module: string;
  group: string;
  permissions: Record<Role, boolean>;
}

const INITIAL_MATRIX: PermRow[] = [
  { module:'Lihat Daftar Aplikasi',     group:'Manajemen Aplikasi', permissions:{ Admin:true,  User:false, Viewer:false } },
  { module:'Tambah Aplikasi',           group:'Manajemen Aplikasi', permissions:{ Admin:true,  User:false, Viewer:false } },
  { module:'Edit Aplikasi',             group:'Manajemen Aplikasi', permissions:{ Admin:true,  User:false, Viewer:false } },
  { module:'Hapus Aplikasi',            group:'Manajemen Aplikasi', permissions:{ Admin:true,  User:false, Viewer:false } },
  { module:'Toggle Status Aplikasi',    group:'Manajemen Aplikasi', permissions:{ Admin:true,  User:false, Viewer:false } },
  { module:'Lihat Daftar User',         group:'Manajemen User',     permissions:{ Admin:true,  User:false, Viewer:false } },
  { module:'Tambah User Baru',          group:'Manajemen User',     permissions:{ Admin:true,  User:false, Viewer:false } },
  { module:'Edit Data User',            group:'Manajemen User',     permissions:{ Admin:true,  User:false, Viewer:false } },
  { module:'Hapus User',                group:'Manajemen User',     permissions:{ Admin:true,  User:false, Viewer:false } },
  { module:'Suspend / Aktifkan User',   group:'Manajemen User',     permissions:{ Admin:true,  User:false, Viewer:false } },
  { module:'Lihat Matriks Hak Akses',  group:'Hak Akses',          permissions:{ Admin:true,  User:false, Viewer:false } },
  { module:'Ubah Konfigurasi Izin',    group:'Hak Akses',          permissions:{ Admin:true,  User:false, Viewer:false } },
  { module:'Akses Portal Aplikasi',     group:'Portal Umum',        permissions:{ Admin:true,  User:true,  Viewer:true  } },
  { module:'Lihat Profil Diri Sendiri', group:'Portal Umum',        permissions:{ Admin:true,  User:true,  Viewer:true  } },
  { module:'Ganti Password',            group:'Portal Umum',        permissions:{ Admin:true,  User:true,  Viewer:false } },
  { module:'Lihat Notifikasi',          group:'Portal Umum',        permissions:{ Admin:true,  User:true,  Viewer:true  } },
  { module:'Lihat Log Aktivitas',       group:'Portal Umum',        permissions:{ Admin:true,  User:false, Viewer:false } },
];

const ROLE_CONFIG: Record<Role, { label: string; from: string; to: string; text: string; border: string; bg: string; dot: string }> = {
  Admin:  { label:'Admin',  from:'from-amber-500',  to:'to-orange-500',  text:'text-amber-600 dark:text-amber-400',   border:'border-amber-500/20 dark:border-amber-500/30',  bg:'bg-amber-500/5 dark:bg-amber-500/10',  dot:'bg-amber-500 dark:bg-amber-400'  },
  User:   { label:'User',   from:'from-indigo-500', to:'to-violet-500',  text:'text-indigo-600 dark:text-indigo-400',  border:'border-indigo-500/20 dark:border-indigo-500/30', bg:'bg-indigo-500/5 dark:bg-indigo-500/10', dot:'bg-indigo-500 dark:bg-indigo-400' },
  Viewer: { label:'Viewer', from:'from-slate-500',  to:'to-slate-600',   text:'text-slate-650 dark:text-slate-400',   border:'border-slate-200 dark:border-white/[0.1]',   bg:'bg-slate-100 dark:bg-white/[0.05]',  dot:'bg-slate-500 dark:bg-slate-400'  },
};

export default function HakAksesPage() {
  const [matrix, setMatrix] = useState<PermRow[]>(INITIAL_MATRIX);
  const [saved,  setSaved]  = useState(false);

  const toggle = (rowIdx: number, role: Role) => {
    setMatrix(prev => prev.map((row, i) =>
      i === rowIdx ? { ...row, permissions: { ...row.permissions, [role]: !row.permissions[role] } } : row
    ));
    setSaved(false);
  };

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2500); };

  const totalEnabled = (role: Role) => matrix.filter(r => r.permissions[role]).length;

  const groups = Array.from(new Set(matrix.map(r => r.group)));

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2.5">
            <ShieldCheck className="h-6 w-6 text-amber-500 dark:text-amber-400" />
            Matriks Hak Akses
          </h1>
          <p className="mt-1 text-sm font-semibold text-slate-550 dark:text-slate-400">
            Konfigurasi izin per role untuk seluruh modul Portal SSO PT INL.
          </p>
        </div>
        <LiquidButton
          variant="outline"
          size="sm"
          onClick={handleSave}
          className={`cursor-pointer font-bold flex items-center gap-2 transition-all duration-300 ${saved ? 'opacity-80' : ''}`}
        >
          {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saved ? 'Tersimpan!' : 'Simpan Konfigurasi'}
        </LiquidButton>
      </div>

      {/* Role Stats — flat inline, no cards */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        {(['Admin', 'User', 'Viewer'] as Role[]).map((role, i, arr) => {
          const c = ROLE_CONFIG[role];
          return (
            <React.Fragment key={role}>
              <div className="flex items-center gap-2">
                <ShieldCheck className={`h-4 w-4 shrink-0 ${c.text}`} />
                <span className={`text-sm font-black ${c.text}`}>{totalEnabled(role)}</span>
                <span className="text-xs font-bold text-slate-500">{c.label} · {totalEnabled(role)}/{matrix.length} modul</span>
              </div>
              {i < arr.length - 1 && <span className="h-3.5 w-px bg-slate-200 dark:bg-white/[0.1] shrink-0" />}
            </React.Fragment>
          );
        })}
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
        <Info className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
        <p className="text-xs font-bold text-amber-800 dark:text-amber-300/80">
          Klik sel pada tabel untuk toggle izin. Klik <strong className="text-amber-600 dark:text-amber-400">Simpan Konfigurasi</strong> untuk menyimpan perubahan. Perubahan yang belum disimpan akan hilang saat halaman di-refresh.
        </p>
      </div>

      {/* Permission Matrix Table — grouped by section */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-white/[0.06] bg-white dark:bg-[#0f1623] shadow-lg">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rose-500/30 to-transparent" />

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-white/[0.06]">
                <th className="px-5 py-3.5 text-left text-[10px] font-black uppercase tracking-widest text-slate-450 dark:text-slate-500">Modul / Fitur</th>
                {(['Admin', 'User', 'Viewer'] as Role[]).map(role => {
                  const c = ROLE_CONFIG[role];
                  return (
                    <th key={role} className="px-4 py-3.5 text-center w-28">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border ${c.border} ${c.bg} px-3 py-1 text-[10px] font-black uppercase tracking-widest ${c.text}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
                        {role}
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {groups.map(group => {
                const rows = matrix.map((r, i) => ({ ...r, idx: i })).filter(r => r.group === group);
                return (
                  <React.Fragment key={group}>
                    {/* Group header row */}
                    <tr className="bg-slate-50/50 dark:bg-white/[0.02]">
                      <td colSpan={4} className="px-5 py-2.5">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-450 dark:text-slate-500">{group}</span>
                      </td>
                    </tr>
                    {rows.map(row => (
                      <tr key={row.idx} className="border-t border-slate-100 dark:border-white/[0.03] hover:bg-slate-50/20 dark:hover:bg-white/[0.015] transition-colors duration-100">
                        <td className="px-5 py-3 pl-8">
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-350">{row.module}</p>
                        </td>
                        {(['Admin', 'User', 'Viewer'] as Role[]).map(role => {
                          const enabled = row.permissions[role];
                          const c = ROLE_CONFIG[role];
                          return (
                            <td
                              key={role}
                              onClick={() => toggle(row.idx, role)}
                              className="px-4 py-3 text-center cursor-pointer transition-all duration-150 select-none group/cell hover:bg-slate-50 dark:hover:bg-white/[0.03]"
                            >
                              <div className="flex items-center justify-center">
                                {enabled ? (
                                  <div className="flex h-5 w-5 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-450 scale-100 group-hover/cell:scale-110 transition-transform">
                                    <Check className="h-3.5 w-3.5" />
                                  </div>
                                ) : (
                                  <div className="flex h-5 w-5 items-center justify-center rounded-lg bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] text-slate-300 dark:text-slate-700 opacity-60 group-hover/cell:opacity-100 transition-opacity">
                                    <X className="h-3.5 w-3.5" />
                                  </div>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
