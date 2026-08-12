import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  ADMIN_SESSION_COOKIE,
  createSessionToken,
  findAdminByUsername,
  sessionCookieOptions,
  SESSION_IDLE_SECONDS,
  verifyPassword,
} from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const LoginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password } = LoginSchema.parse(body);

    const user = await findAdminByUsername(username.trim());
    if (!user || !user.is_active) {
      return NextResponse.json(
        { ok: false, error: '用户名或密码错误' },
        { status: 401 }
      );
    }

    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) {
      return NextResponse.json(
        { ok: false, error: '用户名或密码错误' },
        { status: 401 }
      );
    }

    const token = createSessionToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    });

    const res = NextResponse.json({
      ok: true,
      user: { username: user.username, role: user.role },
    });
    res.cookies.set(
      ADMIN_SESSION_COOKIE,
      token,
      sessionCookieOptions(SESSION_IDLE_SECONDS)
    );
    return res;
  } catch (e: any) {
    if (e?.name === 'ZodError') {
      return NextResponse.json(
        { ok: false, error: '请输入用户名和密码' },
        { status: 400 }
      );
    }
    console.error('[auth/login]', e?.message || e);
    return NextResponse.json(
      { ok: false, error: e?.message || '登录失败' },
      { status: 500 }
    );
  }
}
