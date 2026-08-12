export type AdminNavItem = {
  href: string;
  label: string;
  /** 未实现时仍可点击，页内显示占位 */
  ready?: boolean;
};

/** 与官网顶栏顺序对齐：首页 + 关于我们 → … → 招聘；系统单独一组 */
export const ADMIN_NAV: AdminNavItem[] = [
  { href: '/admin/pages/home', label: '首页', ready: false },
  { href: '/admin/pages/about', label: '关于我们', ready: true },
  { href: '/admin/pages/mission', label: '实力见证', ready: true },
  { href: '/admin/news', label: '新闻', ready: true },
  { href: '/admin/pages/equipment', label: '装备清单', ready: true },
  { href: '/admin/careers', label: '招贤纳士', ready: true },
  { href: '/admin/settings', label: '站点设置', ready: false },
  { href: '/admin/media', label: '媒体库', ready: false },
];

/** 侧栏分组：页面+内容合并；系统单独 */
export const ADMIN_NAV_GROUPS: { title: string; hrefs: string[] }[] = [
  {
    title: '内容',
    hrefs: [
      '/admin/pages/home',
      '/admin/pages/about',
      '/admin/pages/mission',
      '/admin/news',
      '/admin/pages/equipment',
      '/admin/careers',
    ],
  },
  {
    title: '系统',
    hrefs: ['/admin/settings', '/admin/media'],
  },
];

export function resolveAdminTitle(pathname: string): string {
  const exact = ADMIN_NAV.find((item) => item.href === pathname);
  if (exact) return exact.label;

  if (pathname.startsWith('/admin/news')) return '新闻';
  if (pathname.startsWith('/admin/careers')) return '招贤纳士';
  if (pathname.startsWith('/admin/pages/home')) return '首页';
  if (pathname.startsWith('/admin/pages/about')) return '关于我们';
  if (pathname.startsWith('/admin/pages/mission')) return '实力见证';
  if (pathname.startsWith('/admin/pages/equipment')) return '装备清单';
  if (pathname.startsWith('/admin/equipment-items')) return '装备清单';
  if (pathname.startsWith('/admin/settings')) return '站点设置';
  if (pathname.startsWith('/admin/media')) return '媒体库';

  return '管理端';
}
