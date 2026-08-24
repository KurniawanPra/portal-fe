'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, ShieldAlert, LogOut, Loader2, Library, FileText, FileCheck, Clock, History, ChevronDown, UserRound, KeyRound } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { ModalPortal } from '@/components/ui/ModalPortal';
import {
  Sidebar as RadixSidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/animate-ui/components/radix/sidebar';

interface SidebarProps {
  employee: {
    nama: string;
    jabatan: string;
    bagian: { nama: string };
    foto_profil?: string;
  };
  onLogout: () => void;
}

export default function Sidebar({ employee, onLogout }: SidebarProps) {
  const pathname = usePathname();
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const [documentsOpen, setDocumentsOpen] = React.useState(() => pathname?.startsWith('/dashboard/dokumen') ?? false);
  const [documentCapabilities, setDocumentCapabilities] = React.useState({
    canApproveDownload: false,
    pendingApprovalCount: 0,
    myPendingCount: 0,
    myApprovedCount: 0,
  });

  React.useEffect(() => {
    if (pathname?.startsWith('/dashboard/dokumen')) {
      setDocumentsOpen(true);
    }
  }, [pathname]);

  React.useEffect(() => {
    let active = true;
    const loadCapabilities = () => api.get<{
      canApproveDownload: boolean;
      pendingApprovalCount: number;
      myPendingCount?: number;
      myApprovedCount?: number;
    }>('/documents/capabilities')
      .then(response => {
        if (active) {
          setDocumentCapabilities({
            canApproveDownload: Boolean(response.data.canApproveDownload),
            pendingApprovalCount: Number(response.data.pendingApprovalCount || 0),
            myPendingCount: Number(response.data.myPendingCount || 0),
            myApprovedCount: Number(response.data.myApprovedCount || 0),
          });
        }
      })
      .catch(() => undefined);
    loadCapabilities();
    window.addEventListener('document-approvals-changed', loadCapabilities);
    return () => { active = false; window.removeEventListener('document-approvals-changed', loadCapabilities); };
  }, [pathname]);

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await onLogout();
    } catch (err) {
      console.error(err);
      setIsLoggingOut(false);
    }
  };

  const menuItems = [
    { id: 'apps', label: 'Portal Aplikasi', path: '/dashboard/aplikasi', icon: LayoutGrid },
    { id: 'profile', label: 'Profil Saya', path: '/dashboard/profile', icon: UserRound },
    { id: 'security', label: 'Keamanan Akun', path: '/dashboard/security', icon: KeyRound },
  ];

  const documentItems = [
    { id: 'documents', label: 'Semua Dokumen', path: '/dashboard/dokumen', icon: FileText, badge: 0 },
    { id: 'document-approved', label: 'Dokumen Disetujui', path: '/dashboard/dokumen/approved', icon: FileCheck, badge: documentCapabilities.myApprovedCount || 0 },
    { id: 'document-requests', label: 'Menunggu Persetujuan', path: '/dashboard/dokumen/requests', icon: Clock, badge: documentCapabilities.myPendingCount || 0 },
    { id: 'document-history', label: 'Riwayat Persetujuan', path: '/dashboard/dokumen/riwayat', icon: History, badge: 0 },
    ...(documentCapabilities.canApproveDownload ? [{
      id: 'document-approval',
      label: 'Persetujuan Akses',
      path: '/dashboard/dokumen/approval',
      icon: ShieldAlert,
      badge: documentCapabilities.pendingApprovalCount,
    }] : []),
  ];

  const renderMenuItem = (item: typeof menuItems[number]) => {
    const Icon = item.icon;
    const isActive = pathname === item.path || pathname?.startsWith(item.path + '/');
    return (
      <SidebarMenuItem key={item.id} className="my-0.5">
        <SidebarMenuButton
          asChild
          tooltip={item.label}
          className={cn(
            'w-full border-l-2 pl-3 transition-all duration-200 ease-out',
            isActive
              ? 'border-amber-500 bg-amber-500/10 font-bold text-amber-600 shadow-[inset_2px_2px_5px_rgba(245,158,11,0.12),inset_-2px_-2px_5px_rgba(255,255,255,0.8)] dark:border-amber-500 dark:bg-amber-500/15 dark:text-amber-400 dark:shadow-[inset_2px_2px_6px_rgba(0,0,0,0.6),inset_-1px_-1px_4px_rgba(245,158,11,0.2)]'
              : 'border-transparent text-slate-700 hover:border-amber-400/70 hover:bg-amber-500/10 hover:text-amber-900 hover:font-semibold dark:text-slate-300 dark:hover:border-amber-500/50 dark:hover:bg-amber-500/15 dark:hover:text-amber-300'
          )}
        >
          <Link href={item.path} className="flex w-full items-center gap-2.5">
            <Icon className={cn('h-4.5 w-4.5 shrink-0 transition-colors duration-200', isActive ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400')} />
            <span className="animate-fade-in text-sm font-semibold text-slate-900 dark:text-slate-100">{item.label}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  const renderDocumentItem = (item: typeof documentItems[number]) => {
    const Icon = item.icon;
    const isActive = item.id === 'documents'
      ? pathname === item.path || /^\/dashboard\/dokumen\/[0-9a-f-]{36}$/i.test(pathname)
      : pathname === item.path || pathname?.startsWith(item.path + '/');
    return (
      <SidebarMenuItem key={item.id} className="my-0.5">
        <SidebarMenuButton asChild tooltip={item.label} className={cn(
          'ml-2.5 w-[calc(100%-0.625rem)] border-l-2 pl-3.5 transition-all duration-200 ease-out',
          isActive
            ? 'border-amber-500 bg-amber-500/10 font-bold text-amber-600 dark:border-amber-500 dark:bg-amber-500/15 dark:text-amber-400 shadow-[inset_2px_2px_5px_rgba(245,158,11,0.12),inset_-2px_-2px_5px_rgba(255,255,255,0.8)] dark:shadow-[inset_2px_2px_6px_rgba(0,0,0,0.6),inset_-1px_-1px_4px_rgba(245,158,11,0.2)]'
            : 'border-transparent text-slate-700 hover:border-amber-400/70 hover:bg-amber-500/10 hover:text-amber-900 hover:font-semibold dark:text-slate-300 dark:hover:border-amber-500/50 dark:hover:bg-amber-500/15 dark:hover:text-amber-300'
        )}>
          <Link href={item.path} className="flex w-full items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2.5">
              <Icon className={cn('h-4 w-4 shrink-0 transition-colors', isActive ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400')} />
              <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-slate-800 dark:text-slate-200">{item.label}</span>
            </div>
            {item.badge > 0 && (
              <span className={cn(
                'flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-[10px] font-black text-white shadow-xs',
                item.id === 'document-approved' ? 'bg-emerald-600' : item.id === 'document-requests' ? 'bg-amber-500' : 'bg-rose-500'
              )}>
                {item.badge > 99 ? '99+' : item.badge}
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
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-500">InTes (Enterprise System)</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="overflow-y-auto overflow-x-hidden px-3 py-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" scrollStorageKey="portal-dashboard-sidebar-scroll">
        <SidebarGroup>
          <SidebarGroupLabel>Menu Utama</SidebarGroupLabel>
          <SidebarMenu>
            {menuItems.map(renderMenuItem)}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="pt-0">
          <button
            type="button"
            onClick={() => setDocumentsOpen(open => !open)}
            className={cn(
              'group/doc relative mb-1 flex min-h-9 w-full items-center justify-between rounded-xl border px-2.5 py-1.5 text-left transition-all duration-200 cursor-pointer shadow-xs',
              documentsOpen
                ? 'border-amber-400/90 bg-amber-500/15 font-bold text-amber-950 dark:border-amber-500/70 dark:bg-amber-500/25 dark:text-amber-200'
                : 'border-transparent text-slate-700 hover:border-amber-400/70 hover:bg-amber-500/10 hover:text-amber-900 dark:text-slate-300 dark:hover:border-amber-500/50 dark:hover:bg-amber-500/15 dark:hover:text-amber-300'
            )}
          >
            <span className="flex min-w-0 items-center gap-2.5">
              <Library className={cn(
                'h-4.5 w-4.5 shrink-0 transition-colors duration-200',
                documentsOpen ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'
              )} />
              <span className="truncate text-xs font-bold tracking-tight text-slate-900 dark:text-slate-100">IDMS</span>
            </span>
            <ChevronDown className={cn(
              'h-4 w-4 shrink-0 transition-transform duration-200 text-slate-400 dark:text-slate-500',
              documentsOpen ? 'rotate-0 text-amber-600 dark:text-amber-400' : '-rotate-90'
            )} />
          </button>

          <div className={cn('grid transition-[grid-template-rows,opacity] duration-200', documentsOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0')}>
            <div className="min-h-0 overflow-hidden">
              <SidebarMenu className="ml-3 border-l border-slate-200 pl-1.5 dark:border-slate-800">
                {documentItems.map(renderDocumentItem)}
              </SidebarMenu>
            </div>
          </div>
        </SidebarGroup>
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
