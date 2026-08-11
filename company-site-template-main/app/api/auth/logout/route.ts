import { NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, sessionCookieOptions } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_SESSION_COOKIE, '', {
    ...sessionCookieOptions(0),
    maxAge: 0,
  });
  return res;
}
