'use client';

import React, { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/Sidebar';
import Navbar from '@/components/dashboard/Navbar';
import { SidebarProvider, SidebarInset } from '@/components/animate-ui/components/radix/sidebar';

// Mock admin profile — in production comes from auth/session context
const MOCK_ADMIN = {
  id: 'adm-001',
  nama: 'Budi Santoso, S.T.',
  jabatan: 'IT Lead Specialist',
  bagian: { nama: 'Teknologi Informasi & Digital' },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const handleLogout = () => {
    console.log('[Admin Panel] Logging out admin');
    router.push('/login');
  };

  return (
    <SidebarProvider>
      <div className="relative flex h-screen w-full bg-gradient-to-br from-slate-50 via-slate-100 to-amber-50/20 dark:from-[#0e1118] dark:via-[#121620] dark:to-[#0e1118] overflow-hidden transition-colors duration-300">
        {/* Background radial highlight — same as dashboard */}
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            background:
              'radial-gradient(circle at 70% 30%, rgba(245, 158, 11, 0.03) 0%, transparent 60%)',
          }}
        />

        {/* Admin Sidebar */}
        <AdminSidebar admin={MOCK_ADMIN} onLogout={handleLogout} />

        {/* Main View Area */}
        <SidebarInset>
          {/* Reuse same Navbar — shows breadcrumb + notifications */}
          <Suspense fallback={<div className="h-20 w-full bg-white/40 border-b border-white/60 animate-pulse" />}>
            <Navbar employee={MOCK_ADMIN} />
          </Suspense>

          {/* Content Body */}
          <main className="flex-1 overflow-y-auto p-6 lg:p-8">
            <div className="mx-auto max-w-7xl">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
