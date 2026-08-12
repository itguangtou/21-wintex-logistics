import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/supabase';

export const ADMIN_SESSION_COOKIE = 'wintex_admin_session';
/** 空闲滑动过期：距最后一次鉴权请求超过 1 天则失效 */
export const SESSION_IDLE_SECONDS = 24 * 60 * 60;
const SESSION_IDLE_MS = SESSION_IDLE_SECONDS * 1000;

export type AdminSession = {
  userId: string;
  username: string;
  role: string;
  exp: number;
};

function getSessionSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      '缺少 ADMIN_SESSION_SECRET（至少 16 位）。请在环境变量中配置。'
    );
  }
  return secret;
}

function signPayload(payloadBase64: string): string {
  return crypto
    .createHmac('sha256', getSessionSecret())
    .update(payloadBase64)
    .digest('base64url');
}

export function createSessionToken(session: Omit<AdminSession, 'exp'>): string {
  const full: AdminSession = {
    ...session,
    exp: Date.now() + SESSION_IDLE_MS,
  };
  const payload = Buffer.from(JSON.stringify(full), 'utf8').toString('base64url');
  const sig = signPayload(payload);
  return `${payload}.${sig}`;
}

export function verifySessionToken(token: string | undefined | null): AdminSession | null {
  if (!token) return null;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;

  try {
    const expected = signPayload(payload);
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return null;
    }
    const session = JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf8')
    ) as AdminSession;
    if (!session?.userId || !session?.username || !session?.exp) return null;
    if (Date.now() > session.exp) return null;
    return session;
  } catch {
    return null;
  }
}

export function sessionCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true as const,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: maxAgeSeconds,
  };
}

/** 滑动续期：重签 token 并写回 Cookie */
export function touchAdminSession(session: AdminSession): AdminSession {
  const token = createSessionToken({
    userId: session.userId,
    username: session.username,
    role: session.role,
  });
  const jar = cookies();
  jar.set(ADMIN_SESSION_COOKIE, token, sessionCookieOptions(SESSION_IDLE_SECONDS));
  return {
    userId: session.userId,
    username: session.username,
    role: session.role,
    exp: Date.now() + SESSION_IDLE_MS,
  };
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const jar = cookies();
  const session = verifySessionToken(jar.get(ADMIN_SESSION_COOKIE)?.value);
  if (!session) return null;
  try {
    return touchAdminSession(session);
  } catch (e) {
    // 部分只读上下文可能无法 set cookie，仍返回已校验会话
    console.warn('[auth] touchAdminSession failed', e);
    return session;
  }
}

export async function verifyPassword(
  password: string,
  passwordHash: string
): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export type AdminUserRow = {
  id: string;
  username: string;
  password_hash: string;
  role: string;
  is_active: boolean;
};

export async function findAdminByUsername(
  username: string
): Promise<AdminUserRow | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('admin_users')
    .select('id, username, password_hash, role, is_active')
    .eq('username', username)
    .maybeSingle();

  if (error) {
    console.error('[auth] findAdminByUsername:', error.message);
    throw new Error(`查询用户失败：${error.message}`);
  }
  return (data as AdminUserRow) || null;
}

export async function requireAdminSession(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) {
    const err = new Error('未登录或登录已过期');
    (err as any).status = 401;
    throw err;
  }
  return session;
}
