'use client';

import { usePathname } from 'next/navigation';
import { useAdminAuth } from './AdminAuthContext';
import { useAdminChrome } from './AdminChromeContext';
import { resolveAdminTitle } from './nav';

export default function AdminHeader() {
  const pathname = usePathname();
  const { user, logout } = useAdminAuth();
  const { subtitle } = useAdminChrome();
  const title = resolveAdminTitle(pathname);

  return (
    <header className="shrink-0 min-h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 py-2">
      <div className="min-w-0">
        <h1 className="text-base font-semibold text-[#0E2745] truncate">{title}</h1>
        {subtitle && <p className="text-xs text-gray-500 truncate">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3 text-sm shrink-0">
        {user?.username && <span className="hidden sm:inline text-gray-500">{user.username}</span>}
        <button
          type="button"
          onClick={() => void logout({ reason: 'manual' })}
          className="px-3 py-1.5 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs"
        >
          退出
        </button>
      </div>
    </header>
  );
}
