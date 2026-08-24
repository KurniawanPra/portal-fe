'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/Sidebar';
import Navbar from '@/components/dashboard/Navbar';
import { SidebarProvider, SidebarInset } from '@/components/animate-ui/components/radix/sidebar';
import { api } from '@/lib/api';
import { clearTokens } from '@/lib/auth';
import { Loader2 } from 'lucide-react';
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

// Global in-memory cache to persist admin auth state across layout remounts
let cachedAuthorized = false;
let cachedProfile: { nama: string; jabatan: string; bagian: { nama: string } } | null = null;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(cachedAuthorized);
  const [adminProfile, setAdminProfile] = useState<{
    nama: string;
    jabatan: string;
    bagian: { nama: string };
  } | null>(cachedProfile);

  useEffect(() => {
    // Hanya fetch jika belum terotorisasi
    if (cachedAuthorized && cachedProfile) {
      return;
    }
    const checkAuth = async () => {
      try {
        const res = await api.get<MeResponse>('/auth/me');
        const user = res.data;
        if (user.role !== 'super_admin') {
          router.push('/dashboard');
          return;
        }

        let profile = {
          nama: user.email === 'admin@inl.co.id' ? 'Administrator' : user.email.split('@')[0].split(/[\._-]/).map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' '),
          jabatan: 'Super Admin',
          bagian: { nama: 'Teknologi Informasi & Digital' },
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
                  // Ignore
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
            console.warn('Gagal memuat detail karyawan untuk admin:', empErr);
          }
        }

        setAdminProfile(profile);
        cachedProfile = profile;
        setAuthorized(true);
        cachedAuthorized = true;
      } catch (err) {
        console.error('Verifikasi auth admin gagal:', err);
        clearTokens();
        cachedAuthorized = false;
        cachedProfile = null;
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
      cachedAuthorized = false;
      cachedProfile = null;
      router.push('/login');
    }
  };

  return (
    <SidebarProvider defaultOpen>
      <PresenceTracker />
      <div className="relative flex h-screen w-full bg-gradient-to-br from-[#e9eff6] via-[#f0f4f9] to-[#e2ebf5] dark:from-[#0b0e14] dark:via-[#0f131c] dark:to-[#080a0f] overflow-hidden transition-colors duration-300">
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
            <Navbar employee={adminProfile} isSuperAdmin={true} onLogout={handleLogout} />
          </Suspense>

          {/* Content Body */}
          <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto overflow-x-hidden p-3 sm:p-5 lg:p-8">
            <div className="portal-admin-content mx-auto min-w-0 max-w-7xl">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
