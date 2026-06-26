'use client';

import React, { useState, useEffect } from 'react';
import { User, Briefcase, MapPin, Phone, Mail, Calendar, Loader2, ShieldAlert } from 'lucide-react';
import { api } from '@/lib/api';

interface UserMe {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  employeeId: string | null;
}

interface UnitOrganisasi {
  id: string;
  nama: string;
  kode: string;
  tipe: string;
  parentId: string | null;
}

interface EmployeeProfile {
  nrk: string;
  nik: string;
  nama: string;
  jenisKelamin: string;
  jabatan: string;
  grade: string;
  unitOrganisasiPath: string;
  unitOrganisasiTipe: string;
  tanggalMasuk: string;
  tempatLahir: string;
  tanggalLahir: string;
  nomorHp: string;
  alamat: string;
  statusKaryawan: string;
  pendidikan: string;
  statusPernikahan: string;
  fotoProfil: string | null;
}

export default function ProfilePage() {
  const [userMe, setUserMe] = useState<UserMe | null>(null);
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const meRes = await api.get<UserMe>('/auth/me');
        const user = meRes.data;
        setUserMe(user);

        if (!user.employeeId) {
          setLoading(false);
          return;
        }

        // Fetch all necessary data in parallel
        const [empRes, statusRes, eduRes, marRes, gradeRes, unitRes] = await Promise.all([
          api.get<any>(`/employees/${user.employeeId}`),
          api.get<any[]>('/master/status-karyawan'),
          api.get<any[]>('/master/pendidikan'),
          api.get<any[]>('/master/status-pernikahan'),
          api.get<any[]>('/master/grade'),
          api.get<UnitOrganisasi[]>('/org/unit?limit=200'),
        ]);

        const emp = empRes.data;
        const statuses = statusRes.data || [];
        const educations = eduRes.data || [];
        const marriages = marRes.data || [];
        const grades = gradeRes.data || [];
        const units = unitRes.data || [];

        // Build unit path string
        let unitPathStr = '-';
        let unitTipeStr = '-';
        if (emp.unitOrganisasiId) {
          const pathParts: string[] = [];
          let curr: UnitOrganisasi | undefined = units.find((u) => u.id === emp.unitOrganisasiId);
          if (curr) {
            const getLabel = (t: string) => {
              if (t === 'direktorat') return 'Direktorat';
              if (t === 'sevp') return 'SEVP';
              if (t === 'bagian') return 'Bagian';
              if (t === 'sub_bagian') return 'Sub Bagian';
              if (t === 'seksi') return 'Seksi';
              return t;
            };
            unitTipeStr = getLabel(curr.tipe);
            
            while (curr) {
              pathParts.unshift(curr.nama);
              const pId: string | null = curr.parentId;
              curr = pId ? units.find((u) => u.id === pId) : undefined;
            }
            unitPathStr = pathParts.join(' > ');
          }
        }

        // Lookups
        const statusLabel = statuses.find((s) => s.id === emp.statusKaryawanId)?.label || '-';
        const eduLabel = educations.find((e) => e.id === emp.pendidikanTerakhirId)?.label || '-';
        const marLabel = marriages.find((m) => m.id === emp.statusPernikahanId)?.label || '-';
        const gradeLabel = grades.find((g) => g.id === emp.gradeId)?.label || '-';

        setProfile({
          nrk: emp.nrk,
          nik: emp.nik,
          nama: emp.nama,
          jenisKelamin: emp.jenisKelamin === 'L' ? 'Laki-Laki' : emp.jenisKelamin === 'P' ? 'Perempuan' : '-',
          jabatan: emp.jabatan,
          grade: gradeLabel,
          unitOrganisasiPath: unitPathStr,
          unitOrganisasiTipe: unitTipeStr,
          tanggalMasuk: emp.tanggalMasuk || '',
          tempatLahir: emp.tempatLahir || '',
          tanggalLahir: emp.tanggalLahir || '',
          nomorHp: emp.nomorHp || '',
          alamat: emp.alamat || '',
          statusKaryawan: statusLabel,
          pendidikan: eduLabel,
          statusPernikahan: marLabel,
          fotoProfil: emp.fotoProfil || null,
        });
      } catch (err: any) {
        setError(err.message || 'Gagal memuat profil.');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
          <p className="text-sm font-semibold text-slate-550 dark:text-slate-400">Memuat profil Anda...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[60vh] items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-rose-500/20 bg-rose-500/5 dark:bg-rose-500/10 p-6 text-center shadow-lg">
          <ShieldAlert className="mx-auto h-12 w-12 text-rose-500" />
          <h3 className="mt-4 text-base font-black text-rose-800 dark:text-rose-455">Gagal Memuat Profil</h3>
          <p className="mt-2 text-sm text-rose-600 dark:text-rose-500 leading-relaxed font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  if (userMe && !userMe.employeeId) {
    const isSuperAdmin = userMe.role === 'super_admin';
    const isBudi = userMe.email === 'admin@inl.co.id';
    
    let nameFallback = 'Administrator';
    let titleFallback = isSuperAdmin ? 'Super Admin' : 'User Portal';
    let bagianFallback = 'Portal Admin';

    if (isBudi) {
      nameFallback = 'Administrator';
      titleFallback = 'Super Admin';
      bagianFallback = 'Teknologi Informasi & Digital';
    } else {
      const localPart = userMe.email.split('@')[0];
      nameFallback = localPart
        .split(/[\._-]/)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
      if (!isSuperAdmin) {
        bagianFallback = 'Non-Karyawan';
      }
    }

    const roleLabel = isSuperAdmin ? 'Super Admin' : 'User Portal';

    return (
      <div className="space-y-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 sm:text-3xl">
            {isSuperAdmin ? 'Data Profil Administrator' : 'Data Profil Pengguna'}
          </h1>
          <p className="mt-1 text-sm font-semibold text-slate-600 dark:text-slate-400">
            {isSuperAdmin ? 'Detail data akun administrator Anda pada portal SSO.' : 'Detail data akun pengguna Anda pada portal SSO.'}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-white/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/70 p-6 shadow-sm backdrop-blur-xl flex flex-col items-center text-center">
            <div className="grid h-28 w-28 place-items-center rounded-full bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 text-white font-bold text-4xl shadow-md border-4 border-white dark:border-slate-800">
              {nameFallback.charAt(0)}
            </div>
            <h2 className="mt-4 text-xl font-bold text-slate-800 dark:text-slate-200">{nameFallback}</h2>
            <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">{titleFallback}</p>

            <div className="mt-6 w-full border-t border-slate-100 dark:border-slate-800 pt-5 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-555 dark:text-slate-400">Status Akun</span>
                <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 px-2.5 py-0.5 font-bold text-emerald-700 dark:text-emerald-450">
                  {userMe.isActive ? 'Aktif' : 'Non-Aktif'}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-555 dark:text-slate-400">Role</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">{roleLabel}</span>
              </div>
              {bagianFallback && bagianFallback !== '-' && (
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-555 dark:text-slate-400">Bagian</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{bagianFallback}</span>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-3xl border border-white/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/70 p-6 shadow-sm backdrop-blur-xl">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-850 pb-3 flex items-center gap-2">
                <User className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400" />
                Informasi Akun SSO
              </h3>
              <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <Mail className="h-4.5 w-4.5 text-slate-400 dark:text-slate-500 mt-1" />
                  <div>
                    <span className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Email SSO</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{userMe.email}</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <User className="h-4.5 w-4.5 text-slate-400 dark:text-slate-500 mt-1" />
                  <div>
                    <span className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Hak Akses</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{roleLabel}</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <ShieldAlert className="h-4.5 w-4.5 text-slate-400 dark:text-slate-500 mt-1" />
                  <div>
                    <span className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Status Sesi</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{userMe.isActive ? 'Aktif' : 'Non-Aktif'}</span>
                  </div>
                </div>
                {bagianFallback && bagianFallback !== '-' && (
                  <div className="flex items-start gap-3">
                    <Briefcase className="h-4.5 w-4.5 text-slate-400 dark:text-slate-500 mt-1" />
                    <div>
                      <span className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Unit Kerja / Bagian</span>
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{bagianFallback}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-amber-500/20 bg-amber-500/5 dark:bg-amber-500/10 p-6 shadow-sm backdrop-blur-xl flex gap-4">
              <ShieldAlert className="h-6 w-6 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-black text-amber-800 dark:text-amber-400">Belum Terhubung dengan Data Employee</h4>
                <p className="mt-1 text-xs text-amber-700 dark:text-amber-500 leading-relaxed font-semibold">
                  {isSuperAdmin
                    ? 'Akun administrator Anda saat ini belum dihubungkan dengan data profil karyawan. Silakan hubungi administrator utama atau perbarui data user Anda di menu Manajemen User untuk menghubungkan akun ini ke data profil employee Anda.'
                    : 'Akun Anda saat ini belum dihubungkan dengan data profil karyawan. Silakan hubungi bagian IT/SDM atau Administrator untuk menghubungkan akun ini ke data profil employee Anda.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="transition-colors duration-300">
      {/* Header Section */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 sm:text-3xl">
          Data Profil Karyawan
        </h1>
        <p className="mt-1 text-sm font-semibold text-slate-600 dark:text-slate-400">
          Detail data diri Anda yang terdaftar pada sistem database kepegawaian.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Avatar and Status Card */}
        <div className="rounded-3xl border border-white/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/70 p-6 shadow-sm backdrop-blur-xl flex flex-col items-center text-center">
          <div className="relative group">
            {profile.fotoProfil ? (
              <img
                src={profile.fotoProfil.startsWith('http') ? profile.fotoProfil : `/uploads/${profile.fotoProfil}`}
                alt={profile.nama}
                className="h-28 w-28 rounded-full object-cover shadow-md border-4 border-white dark:border-slate-800"
              />
            ) : (
              <div className="grid h-28 w-28 place-items-center rounded-full bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 text-white font-bold text-4xl shadow-md border-4 border-white dark:border-slate-800">
                {profile.nama.charAt(0)}
              </div>
            )}
            <span className="absolute bottom-0 right-1.5 flex h-4 w-4 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
          </div>

          <h2 className="mt-4 text-xl font-bold text-slate-800 dark:text-slate-200">{profile.nama}</h2>
          <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">{profile.jabatan}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-semibold">
            {profile.nrk}
            {profile.grade && profile.grade !== '-' && profile.grade !== '' ? ` • ${profile.grade}` : ''}
          </p>

          <div className="mt-6 w-full border-t border-slate-100 dark:border-slate-800 pt-5 space-y-3">
            {profile.statusKaryawan && profile.statusKaryawan !== '-' && profile.statusKaryawan !== '' && (
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-555 dark:text-slate-400">Status Kepegawaian</span>
                <span className="rounded-full bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 px-2.5 py-0.5 font-bold text-indigo-700 dark:text-indigo-400">
                  {profile.statusKaryawan}
                </span>
              </div>
            )}
            {profile.pendidikan && profile.pendidikan !== '-' && profile.pendidikan !== '' && (
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-555 dark:text-slate-400">Pendidikan Terakhir</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">{profile.pendidikan}</span>
              </div>
            )}
            {profile.statusPernikahan && profile.statusPernikahan !== '-' && profile.statusPernikahan !== '' && (
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-555 dark:text-slate-400">Status Pernikahan</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">{profile.statusPernikahan}</span>
              </div>
            )}
          </div>
        </div>

        {/* Middle & Right Column: Details Grid */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-3xl border border-white/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/70 p-6 shadow-sm backdrop-blur-xl">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-850 pb-3 flex items-center gap-2">
              <User className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400" />
              Informasi Pribadi & Kontak
            </h3>
            <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
              {profile.nama && profile.nama !== '-' && profile.nama !== '' && (
                <div className="flex items-start gap-3">
                  <User className="h-4.5 w-4.5 text-slate-400 dark:text-slate-500 mt-1" />
                  <div>
                    <span className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Nama Lengkap</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{profile.nama}</span>
                  </div>
                </div>
              )}
              {userMe?.email && (
                <div className="flex items-start gap-3">
                  <Mail className="h-4.5 w-4.5 text-slate-400 dark:text-slate-500 mt-1" />
                  <div>
                    <span className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Email SSO</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{userMe.email}</span>
                  </div>
                </div>
              )}
              {profile.nomorHp && profile.nomorHp !== '-' && profile.nomorHp !== '' && (
                <div className="flex items-start gap-3">
                  <Phone className="h-4.5 w-4.5 text-slate-400 dark:text-slate-500 mt-1" />
                  <div>
                    <span className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Nomor Handphone</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{profile.nomorHp}</span>
                  </div>
                </div>
              )}
              {((profile.tempatLahir && profile.tempatLahir !== '-') || profile.tanggalLahir) && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-4.5 w-4.5 text-slate-400 dark:text-slate-500 mt-1" />
                  <div>
                    <span className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Tempat, Tanggal Lahir</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {profile.tempatLahir && profile.tempatLahir !== '-' ? profile.tempatLahir : ''}
                      {profile.tanggalLahir ? `${profile.tempatLahir && profile.tempatLahir !== '-' ? ', ' : ''}${new Date(profile.tanggalLahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}` : ''}
                    </span>
                  </div>
                </div>
              )}
              {profile.jenisKelamin && profile.jenisKelamin !== '-' && profile.jenisKelamin !== '' && (
                <div className="flex items-start gap-3">
                  <User className="h-4.5 w-4.5 text-slate-400 dark:text-slate-500 mt-1" />
                  <div>
                    <span className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Jenis Kelamin</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{profile.jenisKelamin}</span>
                  </div>
                </div>
              )}
              {profile.alamat && profile.alamat !== '-' && profile.alamat !== '' && (
                <div className="flex items-start gap-3 sm:col-span-2 border-t border-slate-50 dark:border-slate-850 pt-4">
                  <MapPin className="h-4.5 w-4.5 text-slate-400 dark:text-slate-500 mt-1" />
                  <div>
                    <span className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Alamat Tinggal</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-relaxed">{profile.alamat}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-white/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/70 p-6 shadow-sm backdrop-blur-xl">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-850 pb-3 flex items-center gap-2">
              <Briefcase className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400" />
              Informasi Jabatan & Unit Kerja
            </h3>
            <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
              {profile.nrk && profile.nrk !== '-' && profile.nrk !== '' && (
                <div>
                  <span className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Nomor Registrasi Karyawan (NRK)</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{profile.nrk}</span>
                </div>
              )}
              {profile.nik && profile.nik !== '-' && profile.nik !== '' && (
                <div>
                  <span className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Nomor Induk Kependudukan (NIK)</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{profile.nik}</span>
                </div>
              )}
              {profile.unitOrganisasiPath && profile.unitOrganisasiPath !== '-' && profile.unitOrganisasiPath !== '' && (
                <div className="sm:col-span-2">
                  <span className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Unit Organisasi (Tree Path)</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{profile.unitOrganisasiPath}</span>
                </div>
              )}
              {profile.unitOrganisasiTipe && profile.unitOrganisasiTipe !== '-' && profile.unitOrganisasiTipe !== '' && (
                <div>
                  <span className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Tipe Unit</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{profile.unitOrganisasiTipe}</span>
                </div>
              )}
              {profile.jabatan && profile.jabatan !== '-' && profile.jabatan !== '' && (
                <div>
                  <span className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Jabatan / Golongan</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {profile.jabatan}
                    {profile.grade && profile.grade !== '-' && profile.grade !== '' ? ` / ${profile.grade}` : ''}
                  </span>
                </div>
              )}
              {profile.tanggalMasuk && profile.tanggalMasuk !== '-' && profile.tanggalMasuk !== '' && (
                <div>
                  <span className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Tanggal Mulai Bekerja</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {new Date(profile.tanggalMasuk).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
