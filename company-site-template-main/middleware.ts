import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 误访问 /zh/admin、/en/admin → 统一到 /admin（无语言前缀）
  if (
    pathname === '/zh/admin' ||
    pathname === '/en/admin' ||
    pathname.startsWith('/zh/admin/') ||
    pathname.startsWith('/en/admin/')
  ) {
    const rest = pathname.replace(/^\/(zh|en)\/admin/, '') || '';
    return NextResponse.redirect(new URL(`/admin${rest}`, request.url));
  }

  // 管理端：仅 /admin，不做语言前缀
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return NextResponse.next();
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/', '/(zh|en)/:path*', '/admin', '/admin/:path*', '/((?!api|_next|_vercel|.*\\..*).*)'],
};
