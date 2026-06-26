'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/Sidebar';
import Navbar from '@/components/dashboard/Navbar';
import { SidebarProvider, SidebarInset } from '@/components/animate-ui/components/radix/sidebar';
import { api } from '@/lib/api';
import { getAccessToken, clearTokens } from '@/lib/auth';
import { Loader2 } from 'lucide-react';

interface MeResponse {
  id: string;
  email: string;
  role: 'user' | 'super_admin';
  isActive: boolean;
  employeeId: string | null;
}

interface UnitOrganisasi {
  id: string;
  nama: string;
  kode: string;
  tipe: string;
  parentId: string | null;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [adminProfile, setAdminProfile] = useState<{
    nama: string;
    jabatan: string;
    bagian: { nama: string };
  } | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = getAccessToken();
      if (!token) {
        router.push('/login');
        return;
      }
      try {
        const res = await api.get<MeResponse>('/auth/me');
        const user = res.data;
        if (user.role !== 'super_admin') {
          router.push('/dashboard');
          return;
        }

        if (user.employeeId) {
          const [empRes, unitRes] = await Promise.all([
            api.get<any>(`/employees/${user.employeeId}`),
            api.get<UnitOrganisasi[]>('/org/unit?limit=200'),
          ]);
          const emp = empRes.data;
          const units = unitRes.data || [];
          const unit = units.find(u => u.id === emp.unitOrganisasiId);
          setAdminProfile({
            nama: emp.nama,
            jabatan: emp.jabatan,
            bagian: { nama: unit ? unit.nama : '-' },
          });
        } else {
          let nameFallback = 'Administrator';
          let titleFallback = 'Super Admin';
          let bagianFallback = 'Portal Admin';

          if (user.email === 'admin@inl.co.id') {
            nameFallback = 'Administrator';
            titleFallback = 'Super Admin';
            bagianFallback = 'Teknologi Informasi & Digital';
          } else {
            const localPart = user.email.split('@')[0];
            nameFallback = localPart
              .split(/[\._-]/)
              .map(part => part.charAt(0).toUpperCase() + part.slice(1))
              .join(' ');
          }

          setAdminProfile({
            nama: nameFallback,
            jabatan: titleFallback,
            bagian: { nama: bagianFallback },
          });
        }

        setAuthorized(true);
      } catch {
        clearTokens();
        router.push('/login');
      }
    };
    checkAuth();
  }, [router]);

  if (!authorized || !adminProfile) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-50 dark:bg-[#0e1118] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Memverifikasi hak akses...</span>
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout', {});
    } catch {
      // Ignore
    } finally {
      clearTokens();
      router.push('/login');
    }
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
        <AdminSidebar admin={adminProfile} onLogout={handleLogout} />

        {/* Main View Area */}
        <SidebarInset>
          {/* Reuse same Navbar — shows breadcrumb + notifications */}
          <Suspense fallback={<div className="h-20 w-full bg-white/40 border-b border-white/60 animate-pulse" />}>
            <Navbar employee={adminProfile} />
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
