'use client';

import { AdminAuthProvider } from '@/components/admin/AdminAuthContext';
import { AdminMessageProvider } from '@/components/admin/AdminMessage';
import AdminApp from '@/components/admin/AdminApp';

export default function AdminClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminMessageProvider>
      <AdminAuthProvider>
        <AdminApp>{children}</AdminApp>
      </AdminAuthProvider>
    </AdminMessageProvider>
  );
}
