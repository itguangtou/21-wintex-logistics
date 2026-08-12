import { NextRequest, NextResponse } from 'next/server';

/** 旧 careers.html 入口：永久跳到 SSR 招聘页，禁止缓存 */
export async function GET(request: NextRequest) {
  const lang = request.nextUrl.searchParams.get('lang');
  const locale = lang === 'en' ? 'en' : 'zh';
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}/careers`;
  url.search = '';
  return NextResponse.redirect(url, {
    status: 307,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      Pragma: 'no-cache',
    },
  });
}
