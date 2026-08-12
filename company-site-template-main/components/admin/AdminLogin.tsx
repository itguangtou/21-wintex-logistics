'use client';

import React, { useState } from 'react';
import { useAdminAuth } from './AdminAuthContext';
import { useAdminMessage } from './AdminMessage';

export default function AdminLogin() {
  const { login } = useAdminAuth();
  const message = useAdminMessage();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setAuthError(null);
    try {
      await login(username, password);
      setUsername('');
      setPassword('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '用户名或密码错误，请重试';
      setAuthError(msg);
      message.error(msg);
      setPassword('');
    } finally {
      setLoggingIn(false);
    }
  };

  return (
    <main className="min-h-screen grid lg:grid-cols-2">
      <section className="relative hidden lg:flex flex-col justify-between bg-[#0E2745] text-white p-12 overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            background:
              'radial-gradient(ellipse at 20% 20%, #F7B95955 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, #15608266 0%, transparent 45%)',
          }}
        />
        <div className="relative z-10">
          <img src="/images/wintex-logo.png" alt="Wintex" className="h-12 brightness-0 invert" />
        </div>
        <div className="relative z-10 space-y-4 max-w-md">
          <p className="text-[#F7B959] text-sm font-medium tracking-[0.2em] uppercase">Admin Console</p>
          <h1 className="text-4xl font-semibold leading-tight">
            Wintex Logistics
            <br />
            网站管理端
          </h1>
          <p className="text-white/70 text-base leading-relaxed">
            管理全站页面、新闻、招聘等内容。登录后即可编辑并发布到线上站点。
          </p>
        </div>
        <p className="relative z-10 text-white/40 text-xs">
          © {new Date().getFullYear()} Wintex Logistics Corp.
        </p>
      </section>

      <section className="flex items-center justify-center p-6 sm:p-10 bg-[#F5F7FA]">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 flex flex-col items-start gap-3">
            <img src="/images/wintex-logo.png" alt="Wintex" className="h-10" />
            <h1 className="text-2xl font-semibold text-[#0E2745]">网站管理端</h1>
          </div>

          <div className="bg-white border border-gray-200/80 shadow-sm rounded-2xl p-8">
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-[#0E2745]">管理员登录</h2>
              <p className="text-sm text-gray-500 mt-1">请输入账号密码进入后台</p>
            </div>

            {authError && (
              <div className="mb-5 px-4 py-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">
                {authError}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="flex items-center gap-4">
                <label htmlFor="username" className="w-16 shrink-0 text-sm font-medium text-gray-600 text-right">
                  用户名
                </label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="flex-1 h-11 px-3 rounded-lg border border-gray-300 bg-white text-sm outline-none focus:border-[#0E2745] focus:ring-2 focus:ring-[#0E2745]/15"
                  placeholder="请输入用户名"
                  required
                  autoFocus
                  autoComplete="username"
                />
              </div>

              <div className="flex items-center gap-4">
                <label htmlFor="password" className="w-16 shrink-0 text-sm font-medium text-gray-600 text-right">
                  密码
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="flex-1 h-11 px-3 rounded-lg border border-gray-300 bg-white text-sm outline-none focus:border-[#0E2745] focus:ring-2 focus:ring-[#0E2745]/15"
                  placeholder="请输入密码"
                  required
                  autoComplete="current-password"
                />
              </div>

              <div className="flex items-center gap-4 pt-1">
                <div className="w-16 shrink-0" />
                <button
                  type="submit"
                  disabled={loggingIn}
                  className="flex-1 h-11 rounded-lg bg-[#0E2745] text-white text-sm font-semibold hover:bg-[#163a5f] transition disabled:opacity-50"
                >
                  {loggingIn ? '登录中…' : '登录'}
                </button>
              </div>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-gray-400">仅限授权管理员访问</p>
        </div>
      </section>
    </main>
  );
}
