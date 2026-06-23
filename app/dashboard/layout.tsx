'use client';

import React, { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import Navbar from '@/components/dashboard/Navbar';

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
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  const handleLogout = () => {
    console.log('[Portal SSO] Logging out user');
    router.push('/login');
  };

  return (
    <div className="relative flex h-screen w-full bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-50/30 dark:from-[#0e1118] dark:via-[#121620] dark:to-[#0e1118] overflow-hidden transition-colors duration-300">
      {/* Background radial highlight */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background:
            'radial-gradient(circle at 70% 30%, rgba(99, 102, 241, 0.05) 0%, transparent 60%)',
        }}
      />

      {/* Sidebar Component */}
      <Sidebar
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        employee={MOCK_EMPLOYEE}
        onLogout={handleLogout}
      />

      {/* Main View Area */}
      <div className="relative z-10 flex flex-1 flex-col overflow-hidden">
        {/* Navbar with Suspense for useSearchParams */}
        <Suspense fallback={<div className="h-20 w-full bg-white/40 border-b border-white/60 animate-pulse" />}>
          <Navbar
            setSidebarOpen={setSidebarOpen}
            employee={MOCK_EMPLOYEE}
          />
        </Suspense>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
