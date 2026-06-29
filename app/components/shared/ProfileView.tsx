'use client';

import React, { useState, useEffect, useRef } from 'react';
import { User, Briefcase, MapPin, Phone, Mail, Calendar, Loader2, ShieldAlert, GitBranch, Camera } from 'lucide-react';
import { api } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';

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

interface ProfileViewProps {
  isAdmin?: boolean;
}

export default function ProfileView({ isAdmin = false }: ProfileViewProps) {
  const [userMe, setUserMe] = useState<UserMe | null>(null);
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoToast, setPhotoToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = async (file: File) => {
    setPhotoUploading(true);
    try {
      const fd = new FormData();
      fd.append('foto', file);
      const token = getAccessToken();
      const res = await fetch('/api/auth/me/photo', {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: fd,
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Gagal mengunggah foto.');
      }
      // Reload profile to get new photo URL via /auth/me
      const meRes = await api.get<any>('/auth/me');
      const updatedMe = meRes.data;
      if (updatedMe?.employee) {
        setProfile(prev => prev ? { ...prev, fotoProfil: updatedMe.employee.fotoProfil || prev.fotoProfil } : prev);
      }
      setPhotoToast('Foto profil berhasil diperbarui!');
      setTimeout(() => setPhotoToast(null), 3000);
    } catch (err: any) {
      setPhotoToast(err.message || 'Gagal mengunggah foto.');
      setTimeout(() => setPhotoToast(null), 3000);
    } finally {
      setPhotoUploading(false);
    }
  };

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
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex items-center gap-2.5">
          <Loader2 className="h-5 w-5 animate-spin text-slate-500 dark:text-slate-400" />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Memuat profil...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[50vh] items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 text-center shadow-sm">
          <ShieldAlert className="mx-auto h-10 w-10 text-rose-500" />
          <h3 className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">Gagal Memuat Profil</h3>
          <p className="mt-1.5 text-xs text-slate-550 dark:text-slate-400 leading-relaxed">{error}</p>
        </div>
      </div>
    );
  }

  // ─── Fallback View (Unlinked SSO User) ──────────────────────────────────────
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

    const fallbackTitle = isAdmin || isSuperAdmin ? 'Data Profil Administrator' : 'Data Profil Pengguna';
    const fallbackDesc = isAdmin || isSuperAdmin
      ? 'Detail data akun administrator Anda pada portal SSO.'
      : 'Detail data akun pengguna Anda pada portal SSO.';

    return (
      <div className="space-y-6 max-w-5xl">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            {fallbackTitle}
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {fallbackDesc}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Avatar Card */}
          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col items-center text-center">
            <div className="h-20 w-20 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-2xl flex items-center justify-center">
              {nameFallback.charAt(0)}
            </div>
            <h2 className="mt-4 text-base font-bold text-slate-900 dark:text-white tracking-tight">{nameFallback}</h2>
            <p className="text-xs font-semibold text-indigo-650 dark:text-indigo-400 mt-0.5">{titleFallback}</p>

            <div className="mt-5 w-full border-t border-slate-100 dark:border-slate-800/80 pt-4 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 dark:text-slate-400">Status Akun</span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 font-bold text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-450 border border-emerald-200/10">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Aktif
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 dark:text-slate-400">Role</span>
                <span className="font-semibold text-slate-700 dark:text-slate-350">{roleLabel}</span>
              </div>
              {bagianFallback && bagianFallback !== '-' && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Bagian</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-355">{bagianFallback}</span>
                </div>
              )}
            </div>
          </div>

          {/* Account Details */}
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800/80 pb-3 mb-4">
                Informasi Akun SSO
              </h3>
              <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                <div>
                  <span className="block text-xs font-medium text-slate-500 dark:text-slate-400">Email</span>
                  <span className="mt-1 block text-sm font-semibold text-slate-900 dark:text-white">{userMe.email}</span>
                </div>
                <div>
                  <span className="block text-xs font-medium text-slate-500 dark:text-slate-400">Hak Akses</span>
                  <span className="mt-1 block text-sm font-semibold text-slate-900 dark:text-white">{roleLabel}</span>
                </div>
                <div>
                  <span className="block text-xs font-medium text-slate-500 dark:text-slate-400">Status Sesi</span>
                  <span className="mt-1 block text-sm font-semibold text-slate-900 dark:text-white">{userMe.isActive ? 'Aktif' : 'Non-Aktif'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  // ─── Standard Profile Layout (Linked Employee) ──────────────────────────────
  const profileTitle = isAdmin ? 'Data Profil Administrator' : 'Data Profil Karyawan';
  const profileDesc = isAdmin
    ? 'Detail data kepegawaian dan profil akses administrator Portal SSO.'
    : 'Detail data kepegawaian Anda yang terdaftar pada sistem database kepegawaian.';

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
          {profileTitle}
        </h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {profileDesc}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Avatar & Quick Status */}
        <div className="rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col items-center text-center">
          {/* Photo toast notification */}
          {photoToast && (
            <div className="fixed top-6 right-6 z-[99999] flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-50/10 px-4 py-3 text-xs font-semibold text-emerald-700 dark:text-emerald-400 shadow-lg backdrop-blur-xl animate-fade-up">
              {photoToast}
            </div>
          )}
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) handlePhotoUpload(file);
              e.target.value = '';
            }}
          />
          {/* Avatar with camera overlay */}
          <div
            className="relative group cursor-pointer"
            onClick={() => userMe?.employeeId && fileInputRef.current?.click()}
            title={userMe?.employeeId ? 'Klik untuk ganti foto profil' : 'Hubungkan ke data karyawan untuk mengganti foto'}
          >
            {profile.fotoProfil ? (
              <img
                src={profile.fotoProfil}
                alt={profile.nama}
                className="h-24 w-24 rounded-full border border-slate-200 dark:border-slate-800 object-cover shadow-sm"
              />
            ) : (
              <div className="h-24 w-24 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-3xl flex items-center justify-center">
                {profile.nama.charAt(0)}
              </div>
            )}
            {/* Camera overlay */}
            <div className={`absolute inset-0 rounded-full flex items-center justify-center transition-all duration-200 ${
              photoUploading
                ? 'bg-black/40'
                : 'bg-black/0 group-hover:bg-black/40'
            }`}>
              {photoUploading ? (
                <Loader2 className="h-6 w-6 text-white animate-spin" />
              ) : (
                <Camera className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              )}
            </div>
          </div>

          <h2 className="mt-4 text-base font-bold text-slate-900 dark:text-white tracking-tight">{profile.nama}</h2>
          <p className="text-xs font-semibold text-slate-550 dark:text-slate-400 mt-0.5">{profile.jabatan}</p>
          <p className="text-[10px] font-bold text-slate-450 dark:text-slate-500 mt-1 uppercase tracking-wider">
            {profile.nrk} {profile.grade && profile.grade !== '-' && profile.grade !== '' ? `• Grade ${profile.grade}` : ''}
          </p>

          <div className="mt-5 w-full border-t border-slate-100 dark:border-slate-800/80 pt-4 space-y-3">
            {profile.statusKaryawan && profile.statusKaryawan !== '-' && profile.statusKaryawan !== '' && (
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-550 dark:text-slate-400">Status Kepegawaian</span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2 py-0.5 font-bold text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400 border border-indigo-200/10">
                  {profile.statusKaryawan}
                </span>
              </div>
            )}
            {profile.pendidikan && profile.pendidikan !== '-' && profile.pendidikan !== '' && (
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-550 dark:text-slate-400">Pendidikan</span>
                <span className="font-semibold text-slate-700 dark:text-slate-350">{profile.pendidikan}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Tabular Detail Cards */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Personal & Contact */}
          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800/80 pb-3 mb-4">
              Informasi Pribadi & Kontak
            </h3>
            <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 text-xs">
              {profile.nama && profile.nama !== '-' && profile.nama !== '' && (
                <div>
                  <span className="block font-medium text-slate-500 dark:text-slate-400">Nama Lengkap</span>
                  <span className="mt-1 block text-sm font-semibold text-slate-900 dark:text-white">{profile.nama}</span>
                </div>
              )}
              {userMe?.email && (
                <div>
                  <span className="block font-medium text-slate-500 dark:text-slate-400">Email</span>
                  <span className="mt-1 block text-sm font-semibold text-slate-900 dark:text-white">{userMe.email}</span>
                </div>
              )}
              {profile.nomorHp && profile.nomorHp !== '-' && profile.nomorHp !== '' && (
                <div>
                  <span className="block font-medium text-slate-500 dark:text-slate-400">Nomor Handphone</span>
                  <span className="mt-1 block text-sm font-semibold text-slate-900 dark:text-white">{profile.nomorHp}</span>
                </div>
              )}
              {profile.alamat && profile.alamat !== '-' && profile.alamat !== '' && (
                <div className="sm:col-span-2">
                  <span className="block font-medium text-slate-500 dark:text-slate-400">Alamat Tinggal</span>
                  <span className="mt-1 block text-sm font-semibold text-slate-900 dark:text-white leading-relaxed">{profile.alamat}</span>
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Employment & Org Unit */}
          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800/80 pb-3 mb-4">
              Informasi Jabatan & Unit Kerja
            </h3>
            <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 text-xs">
              {profile.nrk && profile.nrk !== '-' && profile.nrk !== '' && (
                <div>
                  <span className="block font-medium text-slate-500 dark:text-slate-400">Nomor Registrasi Karyawan (NRK)</span>
                  <span className="mt-1 block text-sm font-semibold text-slate-900 dark:text-white">{profile.nrk}</span>
                </div>
              )}
              {profile.unitOrganisasiPath && profile.unitOrganisasiPath !== '-' && profile.unitOrganisasiPath !== '' && (
                <div className="sm:col-span-2">
                  <span className="block font-medium text-slate-500 dark:text-slate-400">Unit Organisasi (Tree Path)</span>
                  <span className="mt-1 block text-sm font-semibold text-slate-900 dark:text-white leading-relaxed">{profile.unitOrganisasiPath}</span>
                </div>
              )}
              {profile.jabatan && profile.jabatan !== '-' && profile.jabatan !== '' && (
                <div>
                  <span className="block font-medium text-slate-500 dark:text-slate-400">Jabatan & Golongan</span>
                  <span className="mt-1 block text-sm font-semibold text-slate-900 dark:text-white">
                    {profile.jabatan}
                    {profile.grade && profile.grade !== '-' && profile.grade !== '' ? ` / ${profile.grade}` : ''}
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
