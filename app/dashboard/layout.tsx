'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import AdminSidebar from '@/components/admin/Sidebar';
import Navbar from '@/components/dashboard/Navbar';
import { SidebarProvider, SidebarInset } from '@/components/animate-ui/components/radix/sidebar';
import { api } from '@/lib/api';
import { getAccessToken, clearTokens } from '@/lib/auth';
import { Loader2 } from 'lucide-react';
import { ApplicationLaunchProvider } from '@/components/motion/ApplicationLaunchAnimation';
import { PresenceTracker } from '@/components/shared/PresenceTracker';

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
let cachedRole: MeResponse['role'] | null = null;
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
  const pathname = usePathname();
  const isDocumentRoute = pathname.startsWith('/dashboard/dokumen');
  const [authorized, setAuthorized] = useState(cachedAuthorized);
  const [role, setRole] = useState<MeResponse['role'] | null>(cachedRole);
  const [employee, setEmployee] = useState<{
    nama: string;
    jabatan: string;
    bagian: { nama: string };
    foto_profil?: string;
  } | null>(cachedEmployee);

  useEffect(() => {
    // Hanya fetch jika belum terotorisasi
    if (cachedAuthorized && cachedEmployee && cachedRole) {
      if (cachedRole === 'super_admin' && !isDocumentRoute) router.push('/admin');
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

        if (user.role === 'super_admin' && !isDocumentRoute) {
          router.push('/admin');
          return;
        }
        setRole(user.role);
        cachedRole = user.role;

        let profile = {
          nama: user.email === 'admin@inl.co.id' ? 'Administrator' : user.email.split('@')[0].split(/[\._-]/).map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' '),
          jabatan: user.role === 'super_admin' ? 'Super Admin' : 'User Portal',
          bagian: { nama: user.role === 'super_admin' ? 'Teknologi Informasi & Digital' : 'Non-Karyawan' },
          foto_profil: undefined as string | undefined,
        };

        if (user.employeeId) {
          try {
            const empRes = await api.get<any>(`/employees/${user.employeeId}`);
            const emp = empRes.data;
            if (emp) {
              let unitName = '-';
              if (emp.unitOrganisasiId) {
                try {
                  const unitRes = await api.get<UnitOrganisasi>(`/org/unit/${emp.unitOrganisasiId}`);
                  if (unitRes.data) unitName = unitRes.data.nama;
                } catch {
                  // Ignore unit fetch error
                }
              }
              profile = {
                nama: emp.nama || profile.nama,
                jabatan: emp.jabatan || profile.jabatan,
                bagian: { nama: unitName },
                foto_profil: emp.fotoProfil || undefined,
              };
            }
          } catch (empErr) {
            console.warn('Gagal memuat detail karyawan untuk dashboard:', empErr);
          }
        }

        setEmployee(profile);
        cachedEmployee = profile;
        setAuthorized(true);
        cachedAuthorized = true;
      } catch {
        clearTokens();
        cachedAuthorized = false;
        cachedEmployee = null;
        cachedRole = null;
        router.push('/login');
      }
    };
    checkAuth();
  }, [isDocumentRoute, router]);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout', {});
    } catch {
      // Ignore
    } finally {
      clearTokens();
      cachedAuthorized = false;
      cachedEmployee = null;
      cachedRole = null;
      router.push('/login');
    }
  };

  if (!authorized || !employee || !role) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-50 dark:bg-[#0e1118] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        <span className="text-sm font-semibold text-slate-550 dark:text-slate-400">Memverifikasi sesi...</span>
      </div>
    );
  }

  return (
    <ApplicationLaunchProvider>
      <PresenceTracker />
      <SidebarProvider defaultOpen>
        <div className="relative flex h-screen w-full bg-gradient-to-br from-[#e9eff6] via-[#f0f4f9] to-[#e2ebf5] dark:from-[#0b0e14] dark:via-[#0f131c] dark:to-[#080a0f] overflow-hidden transition-colors duration-300">
        {/* Background radial highlight */}
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            background:
              'radial-gradient(circle at 70% 30%, rgba(245, 158, 11, 0.03) 0%, transparent 60%)',
          }}
        />

        {/* Sidebar Component */}
        {role === 'super_admin' ? (
          <AdminSidebar admin={employee} onLogout={handleLogout} />
        ) : (
          <Sidebar employee={employee} onLogout={handleLogout} />
        )}

        {/* Main View Area */}
        <SidebarInset>
          {/* Navbar with Suspense for useSearchParams */}
          <Suspense fallback={<div className="h-20 w-full bg-white/40 border-b border-white/60 animate-pulse" />}>
            <Navbar
              employee={employee}
              isSuperAdmin={role === 'super_admin'}
              onLogout={handleLogout}
            />
          </Suspense>

          {/* Content Body */}
          <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 lg:p-8">
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
