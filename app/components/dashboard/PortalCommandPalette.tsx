'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  ArrowRight,
  CornerDownLeft,
  Database,
  GitBranch,
  Home,
  LayoutGrid,
  Network,
  Search,
  ShieldAlert,
  User,
  UserCog,
  Users,
  X,
  FileText,
  Tags,
  CircleCheckBig,
  ScrollText,
  Clock3,
  History,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { ModalPortal } from '@/components/ui/ModalPortal';
import { useSidebar } from '@/components/animate-ui/components/radix/sidebar';
import { cn } from '@/lib/utils';

type CommandItem = {
  label: string;
  description: string;
  group: string;
  path?: string;
  action?: () => void;
  keywords: string[];
  icon: React.ComponentType<{ className?: string }>;
};

const SUPER_ADMIN_COMMANDS: CommandItem[] = [
  { label: 'Dashboard Utama', description: 'Kembali ke ringkasan portal dan master data', group: 'Navigasi Utama', path: '/admin/dashboard', keywords: ['home', 'beranda', 'admin'], icon: Home },
  { label: 'Unit Organisasi', description: 'Kelola bagan struktur organisasi dan unit kerja', group: 'Master Data', path: '/admin/organisasi', keywords: ['organisasi', 'unit', 'divisi', 'departemen'], icon: Network },
  { label: 'Bagan Organisasi Interaktif', description: 'Visualisasi pohon hierarki struktur unit organisasi', group: 'Master Data', path: '/admin/bagan', keywords: ['bagan', 'struktur', 'pohon', 'hierarki'], icon: GitBranch },
  { label: 'Master Data Karyawan', description: 'Kelola data profil, jabatan, dan grade karyawan', group: 'Master Data', path: '/admin/master', keywords: ['karyawan', 'pegawai', 'staff', 'nrk', 'jabatan'], icon: Database },
  { label: 'Role & Izin Akses', description: 'Kelola role administrator dan permission sistem', group: 'Kelola Sistem', path: '/admin/roles', keywords: ['role', 'permission', 'izin', 'hak akses'], icon: UserCog },
  { label: 'Kelola User', description: 'Kelola akun user dan hak akses pengguna', group: 'Kelola Sistem', path: '/admin/users', keywords: ['user', 'akun', 'role', 'akses', 'pengguna'], icon: Users },
  { label: 'Layanan Aplikasi', description: 'Kelola daftar aplikasi yang terhubung ke SSO Portal', group: 'Kelola Sistem', path: '/admin/aplikasi', keywords: ['aplikasi', 'sso', 'warna', 'layanan'], icon: LayoutGrid },
  { label: 'Kategori Dokumen', description: 'Kelola klasifikasi dan kerahasiaan berkas dokumen', group: 'IDMS', path: '/dashboard/dokumen/kategori', keywords: ['dokumen', 'kategori', 'berkas', 'sop', 'lk', 'pb', 'idms'], icon: Tags },
  { label: 'Semua Dokumen', description: 'Cari, upload, dan kelola arsip dokumen internal', group: 'IDMS', path: '/dashboard/dokumen', keywords: ['dokumen', 'upload', 'file', 'berkas', 'semua', 'idms'], icon: FileText },
  { label: 'Dokumen Disetujui', description: 'Lihat dokumen yang sudah disetujui dan siap diunduh', group: 'IDMS', path: '/dashboard/dokumen/approved', keywords: ['dokumen disetujui', 'approved', 'idms', 'download'], icon: CircleCheckBig },
  { label: 'Menunggu Persetujuan', description: 'Pantau pengajuan izin unduh dokumen yang sedang diproses', group: 'IDMS', path: '/dashboard/dokumen/requests', keywords: ['menunggu', 'pending', 'pengajuan', 'akses', 'idms'], icon: Clock3 },
  { label: 'Riwayat Persetujuan', description: 'Lihat riwayat dokumen yang telah diunduh, ditolak, atau kedaluwarsa', group: 'IDMS', path: '/dashboard/dokumen/riwayat', keywords: ['riwayat', 'history', 'unduh', 'ditolak', 'idms'], icon: History },
  { label: 'Persetujuan Akses', description: 'Tinjau dan setujui permintaan izin download dokumen', group: 'IDMS', path: '/dashboard/dokumen/approval', keywords: ['approval', 'persetujuan', 'download', 'masuk', 'idms'], icon: CircleCheckBig },
  { label: 'Log Dokumen', description: 'Lihat jejak riwayat aktivitas dan audit log dokumen', group: 'IDMS', path: '/dashboard/dokumen/audit-log', keywords: ['audit', 'log', 'aktivitas', 'catatan', 'idms'], icon: ScrollText },
  { label: 'Profil Saya', description: 'Lihat data informasi profil Anda', group: 'Akun Saya', path: '/admin/profile', keywords: ['profil', 'profile', 'akun saya'], icon: User },
  { label: 'Keamanan Akun', description: 'Kelola password, passkey, dan autentikasi akun', group: 'Akun Saya', path: '/admin/security', keywords: ['keamanan', 'password', 'passkey', 'sandi'], icon: ShieldAlert },
];

const USER_COMMANDS: CommandItem[] = [
  { label: 'Portal Aplikasi', description: 'Cari dan buka aplikasi yang dapat Anda akses', group: 'Navigasi Utama', path: '/dashboard/aplikasi', keywords: ['aplikasi', 'layanan', 'portal'], icon: LayoutGrid },
  { label: 'Semua Dokumen', description: 'Cari dan lihat arsip dokumen internal perusahaan', group: 'IDMS', path: '/dashboard/dokumen', keywords: ['dokumen', 'arsip', 'perusahaan', 'idms'], icon: FileText },
  { label: 'Dokumen Disetujui', description: 'Lihat daftar dokumen yang telah disetujui dan siap diunduh', group: 'IDMS', path: '/dashboard/dokumen/approved', keywords: ['dokumen disetujui', 'approved', 'download', 'idms'], icon: CircleCheckBig },
  { label: 'Menunggu Persetujuan', description: 'Pantau pengajuan izin unduh dokumen Anda yang sedang diproses', group: 'IDMS', path: '/dashboard/dokumen/requests', keywords: ['menunggu', 'pending', 'pengajuan', 'akses', 'idms'], icon: Clock3 },
  { label: 'Riwayat Persetujuan', description: 'Lihat riwayat dokumen yang telah diunduh, ditolak, atau kedaluwarsa', group: 'IDMS', path: '/dashboard/dokumen/riwayat', keywords: ['riwayat', 'history', 'unduh', 'ditolak', 'idms'], icon: History },
  { label: 'Profil Saya', description: 'Lihat informasi profil Anda', group: 'Akun Saya', path: '/dashboard/profile', keywords: ['profil', 'profile', 'akun saya'], icon: User },
  { label: 'Keamanan Akun', description: 'Kelola password, passkey, dan autentikasi', group: 'Akun Saya', path: '/dashboard/security', keywords: ['keamanan', 'password', 'passkey', 'totp', 'sandi'], icon: ShieldAlert },
];

interface PortalCommandPaletteProps {
  open: boolean;
  onClose: () => void;
  isSuperAdmin?: boolean;
}

export default function PortalCommandPalette({ open, onClose, isSuperAdmin = false }: PortalCommandPaletteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { state, toggleSidebar } = useSidebar();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const baseCommands = isSuperAdmin || pathname.startsWith('/admin') ? SUPER_ADMIN_COMMANDS : USER_COMMANDS;

  const sidebarToggleCommand: CommandItem = {
    label: state === 'expanded' ? 'Ciutkan Sidebar Navigasi' : 'Perluas Sidebar Navigasi',
    description: 'Buka atau ciutkan tampilan menu sidebar',
    group: 'Kontrol Navigasi',
    action: () => toggleSidebar(),
    keywords: ['sidebar', 'toggle', 'menu', 'ciutkan', 'perluas', 'expand', 'collapse'],
    icon: state === 'expanded' ? PanelLeftClose : PanelLeftOpen,
  };

  const commands = useMemo(() => [sidebarToggleCommand, ...baseCommands], [state, baseCommands]);

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return commands;
    return commands.filter((command) => (
      command.label.toLowerCase().includes(normalized)
      || command.description.toLowerCase().includes(normalized)
      || command.group.toLowerCase().includes(normalized)
      || command.keywords.some((keyword: string) => keyword.includes(normalized))
    ));
  }, [commands, query]);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActiveIndex(0);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const frame = window.requestAnimationFrame(() => inputRef.current?.focus());
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = previousOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    document.getElementById(`portal-command-${activeIndex}`)?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, open]);

  const executeCommand = (command: CommandItem | undefined) => {
    if (!command) return;
    onClose();
    if (command.action) {
      command.action();
    } else if (command.path) {
      router.push(command.path);
    }
  };

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((current) => results.length ? (current + 1) % results.length : 0);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((current) => results.length ? (current - 1 + results.length) % results.length : 0);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      executeCommand(results[activeIndex]);
    }
  };

  return (
    <ModalPortal open={open}>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-6" role="dialog" aria-modal="true" aria-label="Pencarian menu Portal">
        <button type="button" className="absolute inset-0 bg-slate-950/35 backdrop-blur-[2px] dark:bg-slate-950/70" onClick={onClose} aria-label="Tutup pencarian" />

        <div className="relative flex max-h-[min(680px,82dvh)] w-full max-w-2xl flex-col overflow-hidden rounded-[22px] border border-white/80 bg-slate-100 shadow-[18px_18px_42px_rgba(15,23,42,0.24),-12px_-12px_32px_rgba(255,255,255,0.92)] dark:border-white/[0.07] dark:bg-[#151b26] dark:shadow-[18px_18px_42px_rgba(0,0,0,0.58),-10px_-10px_28px_rgba(51,65,85,0.16)]">
          <div className="flex items-center gap-3 border-b border-slate-200/80 px-4 py-3.5 dark:border-white/[0.07] sm:px-5">
            <div className="flex flex-1 items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-100/90 px-3.5 py-1.5 shadow-[inset_2px_2px_5px_rgba(15,23,42,0.07),inset_-2px_-2px_5px_rgba(255,255,255,0.95)] dark:border-white/[0.06] dark:bg-[#111622] dark:shadow-[inset_3px_3px_8px_rgba(0,0,0,0.55),inset_-2px_-2px_6px_rgba(255,255,255,0.03)] focus-within:border-amber-500/60 focus-within:shadow-[inset_2px_2px_4px_rgba(245,158,11,0.12),2px_2px_6px_rgba(15,23,42,0.06),-2px_-2px_6px_rgba(255,255,255,0.9)] dark:focus-within:shadow-[inset_2px_2px_6px_rgba(0,0,0,0.6),inset_-1px_-1px_4px_rgba(245,158,11,0.25)] transition-all duration-200">
              <Search className="h-4.5 w-4.5 shrink-0 text-amber-600 dark:text-amber-400" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={handleInputKeyDown}
                placeholder="Cari menu, halaman, atau pengaturan..."
                className="h-9 min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:font-medium placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
                role="combobox"
                aria-expanded="true"
                aria-controls="portal-command-results"
                aria-activedescendant={results[activeIndex] ? `portal-command-${activeIndex}` : undefined}
              />
            </div>
            <button type="button" onClick={onClose} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-slate-100/90 text-slate-500 shadow-[2px_2px_5px_rgba(15,23,42,0.06),-2px_-2px_5px_rgba(255,255,255,0.9)] hover:text-slate-800 dark:border-white/[0.06] dark:bg-[#111622] dark:text-slate-400 dark:shadow-[3px_3px_8px_rgba(0,0,0,0.5),-2px_-2px_6px_rgba(255,255,255,0.03)] dark:hover:text-slate-100 transition-all duration-200" aria-label="Tutup">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div id="portal-command-results" className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-2.5 sm:p-3 hide-scrollbar" role="listbox">
            {results.length > 0 ? (
              <div className="space-y-1">
                {results.map((command, index) => {
                  const Icon = command.icon;
                  const active = index === activeIndex;
                  return (
                    <button
                      id={`portal-command-${index}`}
                      key={command.path || command.label}
                      type="button"
                      role="option"
                      aria-selected={active}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => executeCommand(command)}
                      className={cn(
                        'flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 transition-all duration-200 text-left',
                        active
                          ? 'border border-amber-400/80 bg-amber-500/10 text-amber-900 shadow-[inset_2px_2px_5px_rgba(245,158,11,0.12),inset_-2px_-2px_5px_rgba(255,255,255,0.8)] dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-300 dark:shadow-[inset_2px_2px_6px_rgba(0,0,0,0.6),inset_-1px_-1px_4px_rgba(245,158,11,0.2)] font-bold'
                          : 'border border-transparent text-slate-700 hover:border-slate-200/80 hover:bg-slate-100/80 hover:shadow-[2px_2px_5px_rgba(15,23,42,0.06),-2px_-2px_5px_rgba(255,255,255,0.9)] dark:text-slate-300 dark:hover:border-white/[0.05] dark:hover:bg-[#111622] dark:hover:shadow-[3px_3px_8px_rgba(0,0,0,0.45),-2px_-2px_6px_rgba(255,255,255,0.02)]'
                      )}
                    >
                      <Icon className={`mr-3 h-5 w-5 shrink-0 ${active ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 dark:text-slate-500'}`} />
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <span className="text-sm font-bold">{command.label}</span>
                          <span className="text-[10px] font-semibold uppercase text-slate-400 dark:text-slate-500">{command.group}</span>
                        </span>
                        <span className="mt-0.5 block truncate text-xs font-medium text-slate-500 dark:text-slate-400">{command.description}</span>
                      </span>
                      <ArrowRight className={`h-4 w-4 shrink-0 transition ${active ? 'translate-x-0 opacity-100' : '-translate-x-1 opacity-0'}`} />
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex min-h-40 flex-col items-center justify-center px-6 text-center">
                <Search className="h-6 w-6 text-slate-300 dark:text-slate-700" />
                <p className="mt-3 text-sm font-bold text-slate-700 dark:text-slate-200">Menu tidak ditemukan</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Coba nama halaman, fitur, atau pengaturan lain.</p>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/80 px-4 py-3 text-[11px] font-semibold text-slate-500 dark:border-white/[0.07] dark:text-slate-400 sm:px-5">
            <span>Gunakan tombol panah untuk memilih</span>
            <span className="inline-flex items-center gap-1.5"><CornerDownLeft className="h-3.5 w-3.5" /> Enter untuk membuka</span>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
