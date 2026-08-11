export type AdminNavItem = {
  href: string;
  label: string;
  /** 未实现时仍可点击，页内显示占位 */
  ready?: boolean;
};

export const ADMIN_NAV: AdminNavItem[] = [
  { href: '/admin/pages/home', label: '首页', ready: false },
  { href: '/admin/pages/about', label: '关于我们', ready: false },
  { href: '/admin/pages/mission', label: '实力见证', ready: false },
  { href: '/admin/pages/equipment', label: '装备清单', ready: false },
  { href: '/admin/news', label: '新闻', ready: true },
  { href: '/admin/timeline', label: '时间轴', ready: false },
  { href: '/admin/equipment-items', label: '装备条目', ready: false },
  { href: '/admin/careers', label: '招聘', ready: true },
  { href: '/admin/settings', label: '站点设置', ready: false },
  { href: '/admin/media', label: '媒体库', ready: false },
];

export function resolveAdminTitle(pathname: string): string {
  const exact = ADMIN_NAV.find((item) => item.href === pathname);
  if (exact) return exact.label;

  if (pathname.startsWith('/admin/news')) return '新闻';
  if (pathname.startsWith('/admin/careers')) return '招聘';
  if (pathname.startsWith('/admin/pages/home')) return '首页';
  if (pathname.startsWith('/admin/pages/about')) return '关于我们';
  if (pathname.startsWith('/admin/pages/mission')) return '实力见证';
  if (pathname.startsWith('/admin/pages/equipment')) return '装备清单';

  return '管理端';
}
