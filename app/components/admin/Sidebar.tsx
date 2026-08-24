'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutGrid, Users, LogOut, Database, UserCog, Building2, Network, ShieldAlert, ChevronDown, Loader2, Library, Tags, FileText, ScrollText, Compass, Settings2, UserCircle2, Boxes, FileCheck, UserRound, KeyRound, Palette, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { usePortalBranding } from '@/lib/portal-branding';
import { ModalPortal } from '@/components/ui/ModalPortal';
import {
  Sidebar as RadixSidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/animate-ui/components/radix/sidebar';

interface AdminSidebarProps {
  admin: {
    nama?: string;
    jabatan?: string;
    foto_profil?: string;
    [key: string]: any;
  };
  onLogout: () => void;
}

export default function AdminSidebar({ admin, onLogout }: AdminSidebarProps) {
  const pathname = usePathname();
  const { branding } = usePortalBranding();
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await onLogout();
    } catch (err) {
      console.error(err);
      setIsLoggingOut(false);
    }
  };

  const groupIcons: Record<string, React.ComponentType<any>> = {
    'Navigasi Utama': Compass,
    'Kelola Sistem': Settings2,
    'Akun Saya': UserCircle2,
  };

  const menuGroups = [
    {
      label: 'Navigasi Utama',
      items: [
        { id: 'overview', label: 'Dashboard', path: '/admin', icon: Home },
        { id: 'aplikasi_portal', label: 'Portal Aplikasi', path: '/admin/aplikasi-portal', icon: LayoutGrid },
      ]
    },
    {
      label: 'Kelola Sistem',
      items: [
        { id: 'master', label: 'Data Master', path: '/admin/master', icon: Database },
        { id: 'organisasi', label: 'Unit Organisasi', path: '/admin/organisasi', icon: Building2 },
        { id: 'employees', label: 'Data Karyawan', path: '/admin/employees', icon: UserCog },
        { id: 'bagan', label: 'Struktur Jabatan', path: '/admin/bagan', icon: Network },
        { id: 'users', label: 'Kelola User', path: '/admin/users', icon: Users },
        { id: 'aplikasi', label: 'Layanan Aplikasi', path: '/admin/aplikasi', icon: Boxes },
        { id: 'portal-branding', label: 'Identitas Portal', path: '/admin/settings/branding', icon: Palette },
      ]
    },
    {
      label: 'Akun Saya',
      items: [
        { id: 'profile', label: 'Profil Saya', path: '/admin/profile', icon: UserRound },
        { id: 'security', label: 'Keamanan Akun', path: '/admin/security', icon: KeyRound },
      ]
    }
  ];

  const documentItems = [
    { id: 'document-categories', label: 'Kategori Dokumen', path: '/dashboard/dokumen/kategori', icon: Tags },
    { id: 'documents', label: 'Semua Dokumen', path: '/dashboard/dokumen', icon: FileText },
    { id: 'document-approved', label: 'Dokumen Disetujui', path: '/dashboard/dokumen/approved', icon: FileCheck },
    { id: 'document-global-access', label: 'Akses Global Dokumen', path: '/dashboard/dokumen/akses-global', icon: Globe },
    { id: 'document-approval', label: 'Persetujuan Akses', path: '/dashboard/dokumen/approval', icon: ShieldAlert },
    { id: 'document-audit', label: 'Log Dokumen', path: '/dashboard/dokumen/audit-log', icon: ScrollText },
  ];

  const [docSubGroupOpen, setDocSubGroupOpen] = React.useState(() => pathname?.startsWith('/dashboard/dokumen') ?? false);

  const [openGroups, setOpenGroups] = React.useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {
      'Navigasi Utama': true,
      'Kelola Sistem': false,
      'Akun Saya': false,
    };
    if (pathname === '/admin' || pathname?.startsWith('/admin/aplikasi-portal')) {
      initial['Navigasi Utama'] = true;
    } else if (
      pathname.startsWith('/admin/master') ||
      pathname.startsWith('/admin/organisasi') ||
      pathname.startsWith('/admin/employees') ||
      pathname.startsWith('/admin/bagan') ||
      pathname.startsWith('/admin/users') ||
      pathname.startsWith('/admin/aplikasi') ||
      pathname.startsWith('/admin/settings') ||
      pathname.startsWith('/dashboard/dokumen')
    ) {
      initial['Kelola Sistem'] = true;
    } else if (
      pathname.startsWith('/admin/profile') ||
      pathname.startsWith('/admin/security')
    ) {
      initial['Akun Saya'] = true;
    }
    return initial;
  });

  const [pendingApprovalCount, setPendingApprovalCount] = React.useState(0);

  React.useEffect(() => {
    let active = true;
    const fetchCapabilities = () => {
      api.get<{ pendingApprovalCount?: number }>('/documents/capabilities')
        .then(res => {
          if (active && typeof res.data?.pendingApprovalCount === 'number') {
            setPendingApprovalCount(res.data.pendingApprovalCount);
          }
        })
        .catch(() => { });
    };

    fetchCapabilities();
    window.addEventListener('document-approvals-changed', fetchCapabilities);

    if (pathname === '/admin' || pathname?.startsWith('/admin/aplikasi-portal')) {
      setOpenGroups(prev => prev['Navigasi Utama'] ? prev : ({ ...prev, 'Navigasi Utama': true }));
    } else if (
      pathname.startsWith('/admin/master') ||
      pathname.startsWith('/admin/organisasi') ||
      pathname.startsWith('/admin/employees') ||
      pathname.startsWith('/admin/bagan') ||
      pathname.startsWith('/admin/users') ||
      pathname.startsWith('/admin/aplikasi') ||
      pathname.startsWith('/admin/settings') ||
      pathname.startsWith('/dashboard/dokumen')
    ) {
      setOpenGroups(prev => prev['Kelola Sistem'] ? prev : ({ ...prev, 'Kelola Sistem': true }));
      if (pathname.startsWith('/dashboard/dokumen')) {
        setDocSubGroupOpen(true);
      }
    } else if (
      pathname.startsWith('/admin/profile') ||
      pathname.startsWith('/admin/security')
    ) {
      setOpenGroups(prev => prev['Akun Saya'] ? prev : ({ ...prev, 'Akun Saya': true }));
    }

    return () => {
      active = false;
      window.removeEventListener('document-approvals-changed', fetchCapabilities);
    };
  }, [pathname]);

  const toggleGroup = (groupLabel: string) => {
    setOpenGroups(prev => ({ ...prev, [groupLabel]: !prev[groupLabel] }));
  };

  const isMenuItemActive = (item: { id: string; path: string }) => {
    if (item.id === 'overview') return pathname === item.path;
    if (item.id === 'documents') {
      return pathname === item.path || /^\/dashboard\/dokumen\/[0-9a-f-]{36}$/i.test(pathname);
    }
    return pathname === item.path || pathname?.startsWith(item.path + '/');
  };

  const isDocGroupActive = pathname.startsWith('/dashboard/dokumen');

  const renderMenuItem = (
    item: { id: string; label: string; path: string; icon: React.ComponentType<any> },
    isSubItem = false
  ) => {
    const Icon = item.icon;
    const isActive = isMenuItemActive(item);
    const badge = item.id === 'document-approval' ? pendingApprovalCount : 0;

    return (
      <SidebarMenuItem key={item.id} className="my-0.5">
        <SidebarMenuButton
          asChild
          tooltip={item.label}
          className={cn(
            'transition-all duration-200 ease-out',
            isSubItem
              ? 'ml-2.5 w-[calc(100%-0.625rem)] border-l-2 pl-3.5'
              : 'w-full border-l-2 pl-3',
            isActive
              ? 'border-amber-500 bg-amber-500/10 font-bold text-amber-600 shadow-[inset_2px_2px_5px_rgba(245,158,11,0.12),inset_-2px_-2px_5px_rgba(255,255,255,0.8)] dark:border-amber-500 dark:bg-amber-500/15 dark:text-amber-400 dark:shadow-[inset_2px_2px_6px_rgba(0,0,0,0.6),inset_-1px_-1px_4px_rgba(245,158,11,0.2)]'
              : 'border-transparent text-slate-700 hover:border-amber-400/70 hover:bg-amber-500/10 hover:text-amber-900 hover:font-semibold dark:text-slate-300 dark:hover:border-amber-500/50 dark:hover:bg-amber-500/15 dark:hover:text-amber-300'
          )}
        >
          <Link href={item.path} className="flex w-full items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2.5">
              <Icon className={cn(
                'shrink-0 transition-colors duration-200',
                isSubItem ? 'h-4 w-4' : 'h-4.5 w-4.5',
                isActive ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'
              )} />
              <span className={cn('animate-fade-in truncate', isSubItem ? 'text-[13px] font-semibold text-slate-800 dark:text-slate-200' : 'text-sm font-semibold text-slate-900 dark:text-slate-100')}>
                {item.label}
              </span>
            </div>
            {badge > 0 && (
              <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-black text-white shadow-xs">
                {badge > 99 ? '99+' : badge}
              </span>
            )}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <RadixSidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-3 px-2 py-1.5">
          <Image src="/img/logo.png" alt="Logo PT INL" width={36} height={36} className="h-9 w-9 shrink-0 object-contain" />
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-extrabold tracking-tight text-slate-900 dark:text-slate-100">PT Industri Nabati Lestari</span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-500 dark:text-rose-400">{branding.adminPanelName}</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="overflow-y-auto overflow-x-hidden px-3 py-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" scrollStorageKey="portal-admin-sidebar-scroll">
        {menuGroups.map((group, gIdx) => {
          const GroupIcon = groupIcons[group.label] || Home;
          const isOpen = openGroups[group.label];
          const containsActiveItem = group.items.some(isMenuItemActive) || (group.label === 'Kelola Sistem' && isDocGroupActive);

          return (
            <SidebarGroup key={group.label} className={gIdx > 0 ? 'pt-0 pb-0.5' : 'py-0.5'}>
              <button
                type="button"
                onClick={() => toggleGroup(group.label)}
                aria-expanded={isOpen}
                aria-label={`${isOpen ? 'Tutup' : 'Buka'} grup ${group.label}`}
                className={cn(
                  'group relative mb-0.5 flex min-h-8.5 w-full items-center justify-between rounded-xl border px-2.5 py-1.5 text-left transition-all duration-200 focus-visible:outline-none cursor-pointer',
                  isOpen
                    ? 'border-slate-200/90 bg-slate-100/90 font-bold text-slate-900 shadow-[2px_2px_5px_rgba(15,23,42,0.06),-2px_-2px_5px_rgba(255,255,255,0.9)] dark:border-white/[0.07] dark:bg-[#151a24] dark:text-slate-100 dark:shadow-[3px_3px_8px_rgba(0,0,0,0.5),-2px_-2px_6px_rgba(255,255,255,0.03)]'
                    : containsActiveItem
                      ? 'border-amber-300/70 bg-amber-50/70 font-semibold text-amber-900 shadow-[2px_2px_5px_rgba(245,158,11,0.08)] dark:border-amber-800/70 dark:bg-amber-955/25 dark:text-amber-300'
                      : 'border-transparent text-slate-700 hover:border-amber-400/60 hover:bg-amber-50/60 hover:text-amber-900 dark:text-slate-300 dark:hover:border-amber-500/40 dark:hover:bg-amber-500/10 dark:hover:text-amber-200'
                )}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <GroupIcon className={cn('h-4 w-4 shrink-0', isOpen || containsActiveItem ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400')} />
                  <span className="truncate text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">{group.label}</span>
                </div>
                <span className="ml-2 flex h-4.5 w-4.5 shrink-0 items-center justify-center border-l border-slate-300 pl-1.5 text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  <ChevronDown className={cn('h-3.5 w-3.5 transition-transform duration-200', !isOpen && '-rotate-90')} aria-hidden="true" />
                </span>
              </button>

              <div className={cn('grid transition-[grid-template-rows,opacity] duration-200 ease-out', isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0')}>
                <div className="min-h-0 overflow-hidden">
                  <SidebarMenu className="ml-3 border-l border-slate-200 pl-1.5 dark:border-slate-800">
                    {group.items.map(item => renderMenuItem(item, false))}
                  </SidebarMenu>

                  {group.label === 'Kelola Sistem' && (
                    <div className="mt-2 ml-3 border-t border-slate-200/70 pt-1.5 dark:border-slate-800/70">
                      <button
                        type="button"
                        onClick={() => setDocSubGroupOpen(open => !open)}
                        className={cn(
                          'group/doc relative mb-1 flex min-h-9 w-full items-center justify-between rounded-xl border px-2.5 py-1.5 text-left transition-all duration-200 cursor-pointer shadow-xs',
                          docSubGroupOpen
                            ? 'border-amber-400/90 bg-amber-500/15 font-bold text-amber-950 dark:border-amber-500/70 dark:bg-amber-500/25 dark:text-amber-200'
                            : isDocGroupActive
                              ? 'border-amber-400/80 bg-amber-500/15 font-semibold text-amber-900 dark:border-amber-500/50 dark:bg-amber-500/20 dark:text-amber-300'
                              : 'border-transparent text-slate-700 hover:border-amber-400/70 hover:bg-amber-500/10 hover:text-amber-900 dark:text-slate-300 dark:hover:border-amber-500/50 dark:hover:bg-amber-500/15 dark:hover:text-amber-300'
                        )}
                      >
                        <div className="flex min-w-0 items-center gap-2.5">
                          <Library className={cn(
                            'h-4.5 w-4.5 shrink-0 transition-colors duration-200',
                            docSubGroupOpen || isDocGroupActive ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'
                          )} />
                          <span className="truncate text-xs font-bold tracking-tight text-slate-900 dark:text-slate-100">IDMS</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {pendingApprovalCount > 0 && (
                            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-black text-white animate-pulse">
                              {pendingApprovalCount > 99 ? '99+' : pendingApprovalCount}
                            </span>
                          )}
                          <ChevronDown className={cn(
                            'h-4 w-4 shrink-0 transition-transform duration-200 text-slate-400 dark:text-slate-500',
                            docSubGroupOpen ? 'rotate-0 text-amber-600 dark:text-amber-400' : '-rotate-90'
                          )} />
                        </div>
                      </button>

                      <div className={cn('grid transition-[grid-template-rows,opacity] duration-200 ease-out', docSubGroupOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0')}>
                        <div className="min-h-0 overflow-hidden">
                          <SidebarMenu className="my-1 ml-3.5 space-y-0.5 border-l-2 border-amber-500/40 pl-1.5 dark:border-amber-500/30">
                            {documentItems.map(item => renderMenuItem(item, true))}
                          </SidebarMenu>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarFooter className="border-t border-slate-200/60 p-2 dark:border-slate-800/60">
        <button
          type="button"
          onClick={() => setShowLogoutConfirm(true)}
          className="flex w-full items-center gap-2.5 rounded-xl border border-rose-200/60 bg-rose-50/70 p-2.5 text-xs font-bold text-rose-600 shadow-xs transition-all duration-200 hover:bg-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-500/20 dark:border-rose-900/30 dark:bg-rose-955/20 dark:text-rose-400 dark:hover:bg-rose-955/40"
          title="Keluar Portal"
        >
          <LogOut className="h-4.5 w-4.5 shrink-0 text-rose-500 dark:text-rose-400" />
          <span className="truncate">Keluar Portal</span>
        </button>
      </SidebarFooter>

      <ModalPortal open={showLogoutConfirm}>
        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => !isLoggingOut && setShowLogoutConfirm(false)} />
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="w-full max-w-sm animate-fade-up rounded-2xl border border-slate-300 bg-white p-6 text-center shadow-2xl shadow-slate-900/10 dark:border-white/[0.08] dark:bg-[#0d1218]">
            <h3 className="text-base font-black text-slate-800 dark:text-slate-100">Keluar Portal?</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Apakah Anda yakin ingin keluar dari sesi ini?</p>
            <div className="mt-5 flex gap-3">
              <button
                disabled={isLoggingOut}
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/[0.08] dark:text-slate-400 dark:hover:bg-white/[0.04]"
              >
                Batal
              </button>
              <button
                disabled={isLoggingOut}
                onClick={handleConfirmLogout}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-500/90 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-rose-500/20 hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-75"
              >
                {isLoggingOut ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Keluar...</span>
                  </>
                ) : (
                  <span>Keluar Sekarang</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </ModalPortal>
    </RadixSidebar>
  );
}
