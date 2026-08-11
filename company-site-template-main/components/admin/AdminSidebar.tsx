'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ADMIN_NAV, type AdminNavItem } from './nav';

function isActive(pathname: string, href: string) {
  if (pathname === href) return true;
  if (href !== '/admin/news' && pathname.startsWith(href + '/')) return true;
  if (href === '/admin/news' && pathname.startsWith('/admin/news')) return true;
  return false;
}

const NAV_GROUPS: { title: string; hrefs: string[] }[] = [
  {
    title: '页面',
    hrefs: [
      '/admin/pages/home',
      '/admin/pages/about',
      '/admin/pages/mission',
      '/admin/pages/equipment',
    ],
  },
  {
    title: '内容',
    hrefs: ['/admin/news', '/admin/equipment-items', '/admin/careers'],
  },
  {
    title: '系统',
    hrefs: ['/admin/settings', '/admin/media'],
  },
];

function NavIcon({ href, active }: { href: string; active: boolean }) {
  const stroke = active ? '#F7B959' : 'currentColor';
  const common = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke,
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true as const,
  };

  switch (href) {
    case '/admin/pages/home':
      return (
        <svg {...common}>
          <path d="M3 11.5 12 4l9 7.5" />
          <path d="M5 10.5V20h14v-9.5" />
        </svg>
      );
    case '/admin/pages/about':
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 20c1.5-3.5 4-5 7-5s5.5 1.5 7 5" />
        </svg>
      );
    case '/admin/pages/mission':
      return (
        <svg {...common}>
          <path d="M12 3v18" />
          <path d="M5 8h10l-1.5 4H6.5L5 8Z" />
          <path d="M12 12h7l-1.2 3.5H12" />
        </svg>
      );
    case '/admin/pages/equipment':
      return (
        <svg {...common}>
          <rect x="3" y="7" width="18" height="12" rx="2" />
          <path d="M7 7V5h10v2" />
          <path d="M8 12h8" />
        </svg>
      );
    case '/admin/news':
      return (
        <svg {...common}>
          <path d="M4 5h12v14H4z" />
          <path d="M16 8h4v11a2 2 0 0 1-2 2h-2" />
          <path d="M7 9h6M7 13h6M7 17h4" />
        </svg>
      );
    case '/admin/timeline':
      return (
        <svg {...common}>
          <path d="M12 4v16" />
          <circle cx="12" cy="8" r="2.5" />
          <circle cx="12" cy="16" r="2.5" />
        </svg>
      );
    case '/admin/equipment-items':
      return (
        <svg {...common}>
          <path d="M4 7h16v12H4z" />
          <path d="M8 7V5h8v2" />
          <path d="M8 12h8M8 16h5" />
        </svg>
      );
    case '/admin/careers':
      return (
        <svg {...common}>
          <rect x="3" y="8" width="18" height="12" rx="2" />
          <path d="M9 8V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
          <path d="M3 13h18" />
        </svg>
      );
    case '/admin/settings':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 3v2.5M12 18.5V21M4.9 6.5l1.8 1.8M17.3 15.7l1.8 1.8M3 12h2.5M18.5 12H21M4.9 17.5l1.8-1.8M17.3 8.3l1.8-1.8" />
        </svg>
      );
    case '/admin/media':
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <circle cx="9" cy="11" r="2" />
          <path d="m21 16-4.5-4.5L9 19" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="7" />
        </svg>
      );
  }
}

function NavLink({ item, pathname }: { item: AdminNavItem; pathname: string }) {
  const active = isActive(pathname, item.href);
  return (
    <Link
      href={item.href}
      className={[
        'group relative flex items-center gap-3 rounded-lg mx-2 px-3 py-2.5 text-[13px] font-medium transition-colors',
        active
          ? 'bg-white/[0.1] text-white'
          : 'text-white/65 hover:bg-white/[0.06] hover:text-white',
      ].join(' ')}
    >
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r bg-[#F7B959]" />
      )}
      <span className="shrink-0 opacity-90">
        <NavIcon href={item.href} active={active} />
      </span>
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const byHref = Object.fromEntries(ADMIN_NAV.map((item) => [item.href, item]));

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col h-screen min-h-0 bg-[#0E2745] text-white">
      <div className="h-14 flex items-center gap-3 px-5 border-b border-white/10">
        <img src="/images/wintex-logo.png" alt="Wintex" className="h-7 brightness-0 invert" />
        <div className="leading-tight min-w-0">
          <div className="text-sm font-semibold tracking-wide truncate">Wintex 管理端</div>
          <div className="text-[10px] text-white/45 tracking-wider uppercase">Content CMS</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 space-y-5">
        {NAV_GROUPS.map((group) => (
          <div key={group.title}>
            <p className="px-5 mb-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-white/35">
              {group.title}
            </p>
            <div className="space-y-0.5">
              {group.hrefs.map((href) => {
                const item = byHref[href];
                if (!item) return null;
                return <NavLink key={href} item={item} pathname={pathname} />;
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-5 py-4 border-t border-white/10">
        <p className="text-[10px] text-white/30 leading-relaxed">Wintex Logistics</p>
      </div>
    </aside>
  );
}
