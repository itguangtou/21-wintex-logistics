'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ADMIN_NAV } from './nav';

function isActive(pathname: string, href: string) {
  if (pathname === href) return true;
  if (href !== '/admin/news' && pathname.startsWith(href + '/')) return true;
  if (href === '/admin/news' && pathname.startsWith('/admin/news')) return true;
  return false;
}

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-gray-200 bg-white">
      <div className="h-14 flex items-center gap-2.5 px-4 border-b border-gray-100">
        <img src="/images/wintex-logo.png" alt="Wintex" className="h-7" />
        <div className="leading-tight min-w-0">
          <div className="text-sm font-semibold text-[#0E2745] truncate">Wintex 管理端</div>
          <div className="text-[10px] text-gray-400">内容管理</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        <p className="px-2 mb-2 text-[11px] uppercase tracking-wider text-gray-400">内容模块</p>
        {ADMIN_NAV.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                'flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors',
                active
                  ? 'bg-[#0E2745] text-white'
                  : 'text-gray-700 hover:bg-gray-100',
              ].join(' ')}
            >
              <span>{item.label}</span>
              {!item.ready && (
                <span
                  className={[
                    'text-[10px] px-1.5 py-0.5 rounded',
                    active ? 'bg-white/15 text-white/80' : 'bg-gray-100 text-gray-400',
                  ].join(' ')}
                >
                  待接
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
