'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import Navbar from '@/components/dashboard/Navbar';
import { SidebarProvider, SidebarInset } from '@/components/animate-ui/components/radix/sidebar';
import { api } from '@/lib/api';
import { getAccessToken, clearTokens } from '@/lib/auth';
import { Loader2 } from 'lucide-react';
import { ApplicationLaunchProvider } from '@/components/motion/ApplicationLaunchAnimation';

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

// Global in-memory cache to persist dashboard auth state across layout remounts
let cachedAuthorized = false;
let cachedEmployee: {
  nama: string;
  jabatan: string;
  bagian: { nama: string };
  foto_profil?: string;
} | null = null;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(cachedAuthorized);
  const [employee, setEmployee] = useState<{
    nama: string;
    jabatan: string;
    bagian: { nama: string };
    foto_profil?: string;
  } | null>(cachedEmployee);

  useEffect(() => {
    // Hanya fetch jika belum terotorisasi
    if (cachedAuthorized && cachedEmployee) {
      return;
    }
    const checkAuth = async () => {
      const token = getAccessToken();
      if (!token) {
        router.push('/login');
        return;
      }
      try {
        const meRes = await api.get<MeResponse>('/auth/me');
        const user = meRes.data;

        if (user.role === 'super_admin') {
          router.push('/admin');
          return;
        }

        if (user.employeeId) {
          const empRes = await api.get<any>(`/employees/${user.employeeId}`);
          const emp = empRes.data;
          
          let unitName = '-';
          if (emp.unitOrganisasiId) {
            try {
              const unitRes = await api.get<UnitOrganisasi>(`/org/unit/${emp.unitOrganisasiId}`);
              if (unitRes.data) {
                unitName = unitRes.data.nama;
              }
            } catch (err) {
              // Ignore unit fetch error
            }
          }

          const profile = {
            nama: emp.nama,
            jabatan: emp.jabatan,
            bagian: { nama: unitName },
            foto_profil: emp.fotoProfil || undefined,
          };
          setEmployee(profile);
          cachedEmployee = profile;
        } else {
          let nameFallback = 'Administrator';
          let titleFallback = 'Admin';
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
            titleFallback = 'User Portal';
            bagianFallback = 'Non-Karyawan';
          }

          const profile = {
            nama: nameFallback,
            jabatan: titleFallback,
            bagian: { nama: bagianFallback },
          };
          setEmployee(profile);
          cachedEmployee = profile;
        }
        setAuthorized(true);
        cachedAuthorized = true;
      } catch {
        clearTokens();
        cachedAuthorized = false;
        cachedEmployee = null;
        router.push('/login');
      }
    };
    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout', {});
    } catch {
      // Ignore
    } finally {
      clearTokens();
      cachedAuthorized = false;
      cachedEmployee = null;
      router.push('/login');
    }
  };

  if (!authorized || !employee) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-50 dark:bg-[#0e1118] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        <span className="text-sm font-semibold text-slate-550 dark:text-slate-400">Memverifikasi sesi...</span>
      </div>
    );
  }

  return (
    <ApplicationLaunchProvider>
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
          employee={employee}
          onLogout={handleLogout}
        />

        {/* Main View Area */}
        <SidebarInset>
          {/* Navbar with Suspense for useSearchParams */}
          <Suspense fallback={<div className="h-20 w-full bg-white/40 border-b border-white/60 animate-pulse" />}>
            <Navbar
              employee={employee}
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
    </ApplicationLaunchProvider>
  );
}
