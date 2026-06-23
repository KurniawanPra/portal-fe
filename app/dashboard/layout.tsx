'use client';

import React, { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import Navbar from '@/components/dashboard/Navbar';
import { SidebarProvider, SidebarInset } from '@/components/animate-ui/components/radix/sidebar';

// --- MOCK PROFILE INFO (MATCHING ERD TABLES) ---
const MOCK_BAGIAN = {
  id: 'bag-1',
  nama: 'Teknologi Informasi & Digital',
  kode: 'TID',
  is_active: true,
};

const MOCK_SUB_BAGIAN = {
  id: 'sub-1',
  nama: 'Infrastruktur, Jaringan & Keamanan',
  kode: 'IJK',
  bagian_id: 'bag-1',
  is_active: true,
};

const MOCK_EMPLOYEE = {
  id: 'emp-92301',
  nama: 'Budi Santoso, S.T.',
  jabatan: 'IT Lead Specialist',
  bagian: MOCK_BAGIAN,
  sub_bagian: MOCK_SUB_BAGIAN,
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const handleLogout = () => {
    console.log('[Portal SSO] Logging out user');
    router.push('/login');
  };

  return (
    <SidebarProvider>
      <div className="relative flex h-screen w-full bg-gradient-to-br from-slate-50 via-slate-100 to-amber-50/20 dark:from-[#0e1118] dark:via-[#121620] dark:to-[#0e1118] overflow-hidden transition-colors duration-300">
        {/* Background radial highlight */}
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            background:
              'radial-gradient(circle at 70% 30%, rgba(245, 158, 11, 0.03) 0%, transparent 60%)',
          }}
        />

        {/* Sidebar Component */}
        <Sidebar
          employee={MOCK_EMPLOYEE}
          onLogout={handleLogout}
        />

        {/* Main View Area */}
        <SidebarInset>
          {/* Navbar with Suspense for useSearchParams */}
          <Suspense fallback={<div className="h-20 w-full bg-white/40 border-b border-white/60 animate-pulse" />}>
            <Navbar
              employee={MOCK_EMPLOYEE}
            />
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
