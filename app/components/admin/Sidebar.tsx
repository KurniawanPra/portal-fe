'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutGrid, Users, LogOut, Database, UserCog, GitBranch, Network, User, ShieldAlert, ChevronDown, ChevronRight, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
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
  useSidebar,
} from '@/components/animate-ui/components/radix/sidebar';

interface AdminSidebarProps {
  admin: {
    nama: string;
    jabatan: string;
    foto_profil?: string;
  };
  onLogout: () => void;
}

export default function AdminSidebar({ admin, onLogout }: AdminSidebarProps) {
  const pathname = usePathname();
  const { state, setOpen } = useSidebar();
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);

  // Group icons map
  const groupIcons: Record<string, React.ComponentType<any>> = {
    'Navigasi Utama': Home,
    'Kelola Sistem': Layers,
    'Akun Saya': User,
  };

  const menuGroups = [
    {
      label: 'Navigasi Utama',
      items: [
        { id: 'overview', label: 'Overview', path: '/admin', icon: Home },
        { id: 'aplikasi_portal', label: 'Portal Aplikasi', path: '/admin/aplikasi-portal', icon: LayoutGrid },
      ]
    },
    {
      label: 'Kelola Sistem',
      items: [
        { id: 'master', label: 'Master Data', path: '/admin/master', icon: Database },
        { id: 'organisasi', label: 'Unit Organisasi', path: '/admin/organisasi', icon: GitBranch },
        { id: 'employees', label: 'Manajemen Employee', path: '/admin/employees', icon: UserCog },
        { id: 'bagan', label: 'Bagan Organisasi', path: '/admin/bagan', icon: Network },
        { id: 'users', label: 'Manajemen User', path: '/admin/users', icon: Users },
        { id: 'aplikasi', label: 'Manajemen Aplikasi', path: '/admin/aplikasi', icon: LayoutGrid },
      ]
    },
    {
      label: 'Akun Saya',
      items: [
        { id: 'profile', label: 'Profil Saya', path: '/admin/profile', icon: User },
        { id: 'security', label: 'Keamanan Akun', path: '/admin/security', icon: ShieldAlert },
      ]
    }
  ];

  // Auto-open groups containing active items
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
      pathname.startsWith('/admin/aplikasi')
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

  // Automatically open group when route changes
  React.useEffect(() => {
    if (pathname === '/admin' || pathname?.startsWith('/admin/aplikasi-portal')) {
      setOpenGroups(prev => ({ ...prev, 'Navigasi Utama': true }));
    } else if (
      pathname.startsWith('/admin/master') ||
      pathname.startsWith('/admin/organisasi') ||
      pathname.startsWith('/admin/employees') ||
      pathname.startsWith('/admin/bagan') ||
      pathname.startsWith('/admin/users') ||
      pathname.startsWith('/admin/aplikasi')
    ) {
      setOpenGroups(prev => ({ ...prev, 'Kelola Sistem': true }));
    } else if (
      pathname.startsWith('/admin/profile') ||
      pathname.startsWith('/admin/security')
    ) {
      setOpenGroups(prev => ({ ...prev, 'Akun Saya': true }));
    }
  }, [pathname]);

  const toggleGroup = (groupLabel: string) => {
    if (state === 'collapsed') {
      if (setOpen) setOpen(true);
      setOpenGroups(prev => ({ ...prev, [groupLabel]: true }));
    } else {
      setOpenGroups(prev => ({ ...prev, [groupLabel]: !prev[groupLabel] }));
    }
  };

  const renderMenuItem = (item: { id: string; label: string; path: string; icon: React.ComponentType<any> }) => {
    const Icon = item.icon;
    const isActive = item.id === 'overview'
      ? pathname === item.path
      : pathname === item.path || pathname?.startsWith(item.path + '/');

    return (
      <SidebarMenuItem key={item.id}>
        <SidebarMenuButton
          asChild
          tooltip={item.label}
          className={cn(
            'border-l-2 pl-3 transition-all duration-200 ease-out',
            isActive
              ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-500/15 font-bold rounded-r-xl rounded-l-none'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-800/20 hover:text-slate-900 dark:hover:text-white rounded-xl'
          )}
        >
          <Link href={item.path} className="flex items-center w-full">
            <Icon className={cn(
              'h-4.5 w-4.5 shrink-0 transition-colors duration-200',
              isActive ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 dark:text-slate-500'
            )} />
            {state === 'expanded' && <span className="animate-fade-in">{item.label}</span>}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <RadixSidebar collapsible="icon">
      {/* Brand Header */}
      <SidebarHeader>
        <div className={cn(
          'flex items-center gap-3 transition-all duration-300',
          state === 'collapsed' ? 'justify-center p-0' : 'px-2 py-1.5'
        )}>
          <Image
            src="/img/logo.png"
            alt="Logo PT INL"
            width={36}
            height={36}
            className="h-9 w-9 object-contain shrink-0"
          />
          {state === 'expanded' && (
            <div className="flex flex-col animate-fade-in">
              <span className="text-sm font-bold tracking-tight text-slate-800 dark:text-slate-100">PT Industri Nabati Lestari</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-rose-500 dark:text-rose-455">Admin Panel</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      {/* Main Menu */}
      <SidebarContent className="[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] overflow-y-auto">
        {menuGroups.map((group, gIdx) => {
          const GroupIcon = groupIcons[group.label] || Home;
          const isOpen = openGroups[group.label];

          return (
            <SidebarGroup key={group.label} className={gIdx > 0 ? 'pt-2' : ''}>
              {state === 'expanded' ? (
                <button
                  onClick={() => toggleGroup(group.label)}
                  className="flex items-center justify-between w-full text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 mb-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-100/50 dark:hover:bg-slate-800/10 text-left transition-all cursor-pointer focus:outline-none"
                >
                  <div className="flex items-center gap-2">
                    <GroupIcon className="h-3.5 w-3.5" />
                    <span>{group.label}</span>
                  </div>
                  {isOpen ? (
                    <ChevronDown className="h-3 w-3 text-slate-400 shrink-0 transition-transform duration-200" />
                  ) : (
                    <ChevronRight className="h-3 w-3 text-slate-400 shrink-0 transition-transform duration-200" />
                  )}
                </button>
              ) : (
                <button
                  onClick={() => toggleGroup(group.label)}
                  className="flex items-center justify-center w-full text-slate-400 hover:text-amber-500 mb-1 py-2 rounded-lg hover:bg-slate-100/50 dark:hover:bg-slate-800/10 transition-all cursor-pointer focus:outline-none"
                  title={group.label}
                >
                  <GroupIcon className="h-4.5 w-4.5 shrink-0" />
                </button>
              )}

              {/* Sub-menu items */}
              {(isOpen || state === 'collapsed') && (
                <SidebarMenu className={cn(
                  "transition-all duration-300 ease-in-out pl-1.5",
                  state === 'expanded' && "border-l border-slate-100 dark:border-slate-850 ml-3"
                )}>
                  {group.items.map(renderMenuItem)}
                </SidebarMenu>
              )}
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      {/* Footer User Profile */}
      <SidebarFooter>
        <div className={cn(
          'flex items-center w-full gap-3 p-1 rounded-2xl border border-white/40 dark:border-slate-850/40 bg-white/20 dark:bg-[#161b26]/30 shadow-sm',
          state === 'collapsed' ? 'flex-col justify-center py-3 px-1' : 'justify-between px-3 py-2.5'
        )}>
          <Link href="/admin/profile" className="flex items-center gap-2.5 overflow-hidden group hover:opacity-80 transition-opacity cursor-pointer">
            {admin.foto_profil ? (
              <img
                src={admin.foto_profil.startsWith('http') ? admin.foto_profil : `/uploads/${admin.foto_profil}`}
                alt={admin.nama}
                className="h-8 w-8 shrink-0 rounded-full object-cover shadow-md border border-slate-200 dark:border-white/[0.08]"
              />
            ) : (
              <div className="flex h-8 w-8 shrink-0 place-items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white font-bold text-xs shadow-md">
                {admin.nama.charAt(0)}
              </div>
            )}
            {state === 'expanded' && (
              <div className="grid flex-1 text-left text-sm leading-tight animate-fade-in overflow-hidden">
                <span className="truncate font-bold text-slate-800 dark:text-slate-200 group-hover:text-amber-500 transition-colors">{admin.nama}</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="truncate text-[10px] font-semibold text-slate-500 dark:text-slate-400">{admin.jabatan}</span>
                  <span className="shrink-0 rounded-full bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/40 px-1.5 py-px text-[8px] font-black uppercase tracking-wide text-rose-600 dark:text-rose-400">
                    Admin
                  </span>
                </div>
              </div>
            )}
          </Link>

          <button
            onClick={() => setShowLogoutConfirm(true)}
            className={cn(
              'rounded-lg p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-600 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-500/10',
              state === 'collapsed' && 'mt-1'
            )}
            title="Keluar Portal"
          >
            <LogOut className="h-4.5 w-4.5 shrink-0" />
          </button>
        </div>
      </SidebarFooter>

      {/* Logout Confirmation Modal */}
      <ModalPortal open={showLogoutConfirm}>
        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setShowLogoutConfirm(false)} />
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="w-full max-w-sm animate-fade-up bg-white dark:bg-[#0d1218] rounded-2xl border border-slate-200 dark:border-white/[0.08] shadow-2xl p-6 text-center">
            <h3 className="text-base font-black text-slate-800 dark:text-slate-100">Keluar Portal?</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Apakah Anda yakin ingin keluar dari sesi ini?</p>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 rounded-xl border border-slate-200 dark:border-white/[0.08] px-4 py-2.5 text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04]">Batal</button>
              <button onClick={onLogout} className="flex-1 rounded-xl bg-rose-500/90 hover:bg-rose-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-rose-500/20">Keluar Sekarang</button>
            </div>
          </div>
        </div>
      </ModalPortal>
    </RadixSidebar>
  );
}
