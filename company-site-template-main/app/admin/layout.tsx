import type { Metadata } from 'next';
import AdminClientLayout from '@/components/admin/AdminClientLayout';

export const metadata: Metadata = {
  title: 'Wintex 管理端',
  description: 'Wintex Logistics 网站内容管理',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F5F7FA] text-gray-900 antialiased">
      <AdminClientLayout>{children}</AdminClientLayout>
    </div>
  );
}
