'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import AdminFooter from './AdminFooter';
import { AdminChromeProvider } from './AdminChromeContext';
import { ADMIN_NAV } from './nav';

function MobileNav() {
  const pathname = usePathname();
  return (
    <div className="md:hidden border-b border-white/10 bg-[#0E2745] overflow-x-auto">
      <div className="flex gap-1 px-2 py-2.5 min-w-max">
        {ADMIN_NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <a
              key={item.href}
              href={item.href}
              className={[
                'px-3 py-1.5 rounded-md text-xs whitespace-nowrap transition-colors',
                active ? 'bg-[#F7B959] text-[#0E2745] font-semibold' : 'bg-white/10 text-white/80',
              ].join(' ')}
            >
              {item.label}
            </a>
          );
        })}
      </div>
    </div>
  );
}

export default function AdminShell({ children }: { children: ReactNode }) {
  return (
    <AdminChromeProvider>
      <div className="h-screen overflow-hidden flex bg-[#F5F7FA]">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0 min-h-0 h-screen overflow-hidden">
          <AdminHeader />
          <MobileNav />
          <main className="flex-1 min-h-0 overflow-y-auto">{children}</main>
          <AdminFooter />
        </div>
      </div>
    </AdminChromeProvider>
  );
}
