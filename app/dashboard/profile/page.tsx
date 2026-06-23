'use client';

import React from 'react';
import { User, Briefcase, MapPin, Phone, Mail, Calendar } from 'lucide-react';

// --- MOCK DATABASE REPRESENTING ERD TABLES ---
const MOCK_BAGIAN = {
  id: 'bag-1',
  nama: 'Teknologi Informasi & Digital',
  kode: 'TID',
};

const MOCK_SUB_BAGIAN = {
  id: 'sub-1',
  nama: 'Infrastruktur, Jaringan & Keamanan',
  kode: 'IJK',
};

const MOCK_EMPLOYEE = {
  nrk: 'NRK-260901',
  nik: 'NIK-34710123456789',
  nama: 'Budi Santoso, S.T.',
  jenis_kelamin: 'Laki-laki',
  jabatan: 'IT Lead Specialist',
  grade: 'Grade 9',
  bagian: MOCK_BAGIAN,
  sub_bagian: MOCK_SUB_BAGIAN,
  tanggal_masuk: '2022-03-01',
  tempat_lahir: 'Medan',
  tanggal_lahir: '1994-08-15',
  nomor_hp: '0812-3456-7890',
  alamat: 'Jalan Sei Mangkei No. 12, Simalungun, Sumatera Utara',
  status_karyawan: { label: 'Karyawan Tetap' },
  pendidikan: { label: 'Sarjana (S1)' },
  status_pernikahan: { label: 'Menikah (Tanpa Anak)' },
};

export default function ProfilePage() {
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
            <div className="grid h-28 w-28 place-items-center rounded-full bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 text-white font-bold text-4xl shadow-md border-4 border-white dark:border-slate-800">
              {MOCK_EMPLOYEE.nama.charAt(0)}
            </div>
            <span className="absolute bottom-0 right-1.5 flex h-4 w-4 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
          </div>

          <h2 className="mt-4 text-xl font-bold text-slate-800 dark:text-slate-200">{MOCK_EMPLOYEE.nama}</h2>
          <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">{MOCK_EMPLOYEE.jabatan}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-semibold">{MOCK_EMPLOYEE.nrk} • {MOCK_EMPLOYEE.grade}</p>

          <div className="mt-6 w-full border-t border-slate-100 dark:border-slate-800 pt-5 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-500 dark:text-slate-455">Status Kepegawaian</span>
              <span className="rounded-full bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 px-2.5 py-0.5 font-bold text-indigo-700 dark:text-indigo-400">
                {MOCK_EMPLOYEE.status_karyawan.label}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-500 dark:text-slate-455">Pendidikan Terakhir</span>
              <span className="font-bold text-slate-700 dark:text-slate-350">{MOCK_EMPLOYEE.pendidikan.label}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-500 dark:text-slate-455">Status Pernikahan</span>
              <span className="font-bold text-slate-700 dark:text-slate-350">{MOCK_EMPLOYEE.status_pernikahan.label}</span>
            </div>
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
              <div className="flex items-start gap-3">
                <User className="h-4.5 w-4.5 text-slate-400 dark:text-slate-500 mt-1" />
                <div>
                  <span className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Nama Lengkap</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{MOCK_EMPLOYEE.nama}</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="h-4.5 w-4.5 text-slate-400 dark:text-slate-500 mt-1" />
                <div>
                  <span className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Email SSO</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">budi.santoso@inl.co.id</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="h-4.5 w-4.5 text-slate-400 dark:text-slate-500 mt-1" />
                <div>
                  <span className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Nomor Handphone</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{MOCK_EMPLOYEE.nomor_hp}</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="h-4.5 w-4.5 text-slate-400 dark:text-slate-500 mt-1" />
                <div>
                  <span className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Tempat, Tanggal Lahir</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{MOCK_EMPLOYEE.tempat_lahir}, {new Date(MOCK_EMPLOYEE.tanggal_lahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
              </div>
              <div className="flex items-start gap-3 sm:col-span-2 border-t border-slate-50 dark:border-slate-850 pt-4">
                <MapPin className="h-4.5 w-4.5 text-slate-400 dark:text-slate-500 mt-1" />
                <div>
                  <span className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Alamat Tinggal</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-relaxed">{MOCK_EMPLOYEE.alamat}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/70 p-6 shadow-sm backdrop-blur-xl">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-850 pb-3 flex items-center gap-2">
              <Briefcase className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400" />
              Informasi Jabatan & Unit Kerja
            </h3>
            <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <span className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Nomor Registrasi Karyawan (NRK)</span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{MOCK_EMPLOYEE.nrk}</span>
              </div>
              <div>
                <span className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Nomor Induk Kependudukan (NIK)</span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{MOCK_EMPLOYEE.nik}</span>
              </div>
              <div>
                <span className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Bagian (Unit Kerja)</span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{MOCK_EMPLOYEE.bagian.nama} ({MOCK_EMPLOYEE.bagian.kode})</span>
              </div>
              <div>
                <span className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Sub Bagian</span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{MOCK_EMPLOYEE.sub_bagian.nama} ({MOCK_EMPLOYEE.sub_bagian.kode})</span>
              </div>
              <div>
                <span className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Jabatan / Golongan</span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{MOCK_EMPLOYEE.jabatan} / {MOCK_EMPLOYEE.grade}</span>
              </div>
              <div>
                <span className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Tanggal Mulai Bekerja</span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{new Date(MOCK_EMPLOYEE.tanggal_masuk).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
