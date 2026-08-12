export type AdminNavItem = {
  href: string;
  label: string;
  /** 未实现时仍可点击，页内显示占位 */
  ready?: boolean;
};

/** 单一内容模块，顺序对齐官网顶栏 + 联系我们 */
export const ADMIN_NAV: AdminNavItem[] = [
  { href: '/admin/pages/home', label: '首页', ready: false },
  { href: '/admin/pages/about', label: '关于我们', ready: true },
  { href: '/admin/pages/mission', label: '实力见证', ready: true },
  { href: '/admin/news', label: '新闻', ready: true },
  { href: '/admin/pages/equipment', label: '装备清单', ready: true },
  { href: '/admin/careers', label: '招贤纳士', ready: true },
  { href: '/admin/pages/contact', label: '联系我们', ready: true },
];

/** 侧栏仅一组 */
export const ADMIN_NAV_GROUPS: { title: string; hrefs: string[] }[] = [
  {
    title: '内容',
    hrefs: ADMIN_NAV.map((item) => item.href),
  },
];

export function resolveAdminTitle(pathname: string): string {
  const exact = ADMIN_NAV.find((item) => item.href === pathname);
  if (exact) return exact.label;

  if (pathname.startsWith('/admin/news/new')) return '新建新闻';
  if (pathname.startsWith('/admin/news')) return '新闻';
  if (pathname.startsWith('/admin/careers')) return '招贤纳士';
  if (pathname.startsWith('/admin/pages/home')) return '首页';
  if (pathname.startsWith('/admin/pages/about')) return '关于我们';
  if (pathname.startsWith('/admin/pages/mission')) return '实力见证';
  if (pathname.startsWith('/admin/pages/equipment')) return '装备清单';
  if (pathname.startsWith('/admin/equipment-items')) return '装备清单';
  if (pathname.startsWith('/admin/pages/contact')) return '联系我们';

  return '管理端';
}
