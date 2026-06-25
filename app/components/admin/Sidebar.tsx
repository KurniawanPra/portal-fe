'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutGrid, Users, LogOut, Database, UserCog, GitBranch } from 'lucide-react';
import { cn } from '@/lib/utils';
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
  useSidebar,
} from '@/components/animate-ui/components/radix/sidebar';

interface AdminSidebarProps {
  admin: {
    nama: string;
    jabatan: string;
  };
  onLogout: () => void;
}

export default function AdminSidebar({ admin, onLogout }: AdminSidebarProps) {
  const pathname = usePathname();
  const { state } = useSidebar();

  const menuItems = [
    { id: 'overview',   label: 'Overview',              path: '/admin',             icon: Home        },
    { id: 'aplikasi',   label: 'Manajemen Aplikasi',    path: '/admin/aplikasi',    icon: LayoutGrid  },
    { id: 'users',      label: 'Manajemen User',        path: '/admin/users',       icon: Users       },
    { id: 'employees',  label: 'Manajemen Employee',    path: '/admin/employees',   icon: UserCog     },
    { id: 'organisasi', label: 'Unit Organisasi',       path: '/admin/organisasi',  icon: GitBranch   },
    { id: 'master',     label: 'Master Data',           path: '/admin/master',      icon: Database    },
  ];

  const renderMenuItem = (item: typeof menuItems[number]) => {
    const Icon = item.icon;
    // Overview hanya aktif jika pathname persis /admin
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
              <span className="text-[10px] font-bold uppercase tracking-widest text-rose-500 dark:text-rose-400">Admin Panel</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      {/* Main Menu */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Admin</SidebarGroupLabel>
          <SidebarMenu>
            {menuItems.map(renderMenuItem)}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer User Profile */}
      <SidebarFooter>
        <div className={cn(
          'flex items-center w-full gap-3 p-1 rounded-2xl border border-white/40 dark:border-slate-850/40 bg-white/20 dark:bg-[#161b26]/30 shadow-sm',
          state === 'collapsed' ? 'flex-col justify-center py-3 px-1' : 'justify-between px-3 py-2.5'
        )}>
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-8 w-8 shrink-0 place-items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white font-bold text-xs shadow-md">
              {admin.nama.charAt(0)}
            </div>
            {state === 'expanded' && (
              <div className="grid flex-1 text-left text-sm leading-tight animate-fade-in overflow-hidden">
                <span className="truncate font-bold text-slate-800 dark:text-slate-200">{admin.nama}</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="truncate text-[10px] font-semibold text-slate-500 dark:text-slate-400">{admin.jabatan}</span>
                  <span className="shrink-0 rounded-full bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/40 px-1.5 py-px text-[8px] font-black uppercase tracking-wide text-rose-600 dark:text-rose-400">
                    Admin
                  </span>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={onLogout}
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
    </RadixSidebar>
  );
}
