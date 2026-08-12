'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAdminMessage } from './AdminMessage';

export type AdminUser = {
  username: string;
  role?: string;
};

type AdminAuthContextValue = {
  checking: boolean;
  user: AdminUser | null;
  login: (username: string, password: string) => Promise<void>;
  logout: (opts?: { silent?: boolean; reason?: 'expired' | 'manual' }) => Promise<void>;
  refresh: () => Promise<boolean>;
  adminFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
};

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const message = useAdminMessage();
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState<AdminUser | null>(null);

  const logout = useCallback(
    async (opts?: { silent?: boolean; reason?: 'expired' | 'manual' }) => {
      try {
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      } catch {
        /* ignore */
      }
      setUser(null);
      if (!opts?.silent) {
        if (opts?.reason === 'expired') {
          message.warning('登录已过期，请重新登录');
        } else if (opts?.reason === 'manual') {
          message.info('已退出登录');
        }
      }
    },
    [message]
  );

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' });
      if (!res.ok) {
        setUser(null);
        return false;
      }
      const j = await res.json();
      setUser({
        username: j?.user?.username || '',
        role: j?.user?.role,
      });
      return true;
    } catch {
      setUser(null);
      return false;
    }
  }, []);

  const adminFetch = useCallback(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const res = await fetch(input, {
        ...init,
        credentials: init?.credentials ?? 'include',
      });
      if (res.status === 401) {
        await logout({ reason: 'expired' });
      }
      return res;
    },
    [logout]
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      await refresh();
      if (mounted) setChecking(false);
    })();
    return () => {
      mounted = false;
    };
  }, [refresh]);

  // 页面挂着不动时定期探活，顺带滑动续期
  useEffect(() => {
    if (!user) return;
    const timer = window.setInterval(() => {
      void refresh().then((ok) => {
        if (!ok) {
          void logout({ reason: 'expired' });
        }
      });
    }, 10 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, [user, refresh, logout]);

  const login = useCallback(
    async (username: string, password: string) => {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(j?.error || '登录失败');
      }
      setUser({
        username: j?.user?.username || username,
        role: j?.user?.role,
      });
      message.success('登录成功');
    },
    [message]
  );

  const value = useMemo(
    () => ({ checking, user, login, logout, refresh, adminFetch }),
    [checking, user, login, logout, refresh, adminFetch]
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
}
