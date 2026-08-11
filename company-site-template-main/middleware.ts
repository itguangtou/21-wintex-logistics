import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 管理端独立路径，不做语言前缀
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return NextResponse.next();
  }

  // 旧地址跳转到 /admin
  if (
    pathname === '/zh/admin/careers' ||
    pathname === '/en/admin/careers' ||
    pathname.endsWith('/admin/careers')
  ) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/', '/(zh|en)/:path*', '/admin', '/admin/:path*', '/((?!api|_next|_vercel|.*\\..*).*)'],
};
