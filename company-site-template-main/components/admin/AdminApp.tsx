'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAdminAuth } from './AdminAuthContext';
import AdminLogin from './AdminLogin';
import AdminShell from './AdminShell';

export default function AdminApp({ children }: { children: React.ReactNode }) {
  const { checking, user } = useAdminAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (checking) return;
    if (!user) {
      if (pathname !== '/admin') {
        router.replace('/admin');
      }
      return;
    }
    if (pathname === '/admin') {
      router.replace('/admin/news');
    }
  }, [checking, user, pathname, router]);

  if (checking) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-3 bg-[#0E2745]">
        <img src="/images/wintex-logo.png" alt="Wintex" className="h-10 brightness-0 invert opacity-90" />
        <p className="text-white/70 text-sm tracking-wide">正在进入管理端…</p>
      </main>
    );
  }

  if (!user) {
    return <AdminLogin />;
  }

  if (pathname === '/admin') {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-3 bg-[#F5F7FA]">
        <p className="text-sm text-gray-500">正在进入新闻管理…</p>
      </main>
    );
  }

  return <AdminShell>{children}</AdminShell>;
}
