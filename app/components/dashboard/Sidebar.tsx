'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, User, ShieldAlert, LogOut } from 'lucide-react';
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
  const { state } = useSidebar();

  const menuItems = [
    { id: 'apps',     label: 'Aplikasi Saya',  path: '/dashboard/aplikasi', icon: LayoutGrid  },
    { id: 'profile',  label: 'Profil Saya',    path: '/dashboard/profile',  icon: User        },
    { id: 'security', label: 'Keamanan Akun',  path: '/dashboard/security', icon: ShieldAlert },
  ];

  const renderMenuItem = (item: typeof menuItems[number]) => {
    const Icon = item.icon;
    const isActive = pathname === item.path || pathname?.startsWith(item.path + '/');
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
              isActive ? 'text-amber-600 dark:text-amber-450' : 'text-slate-400 dark:text-slate-500'
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
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-500">Portal SSO</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      {/* Main Menu */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Utama</SidebarGroupLabel>
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
            {employee.foto_profil ? (
              <img
                src={employee.foto_profil}
                alt={employee.nama}
                className="h-8 w-8 shrink-0 rounded-full object-cover shadow-sm border border-slate-200 dark:border-white/[0.08]"
              />
            ) : (
              <div className="flex h-8 w-8 shrink-0 place-items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white font-bold text-xs shadow-md">
                {employee.nama.charAt(0)}
              </div>
            )}
            {state === 'expanded' && (
              <div className="grid flex-1 text-left text-sm leading-tight animate-fade-in overflow-hidden">
                <span className="truncate font-bold text-slate-800 dark:text-slate-200">{employee.nama}</span>
                <span className="truncate text-[10px] font-semibold text-slate-500 dark:text-slate-450 mt-0.5">{employee.jabatan}</span>
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
