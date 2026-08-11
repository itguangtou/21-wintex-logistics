'use client';

import React, { useEffect, useState } from 'react';

type Job = {
  id: string;
  title: { cn: string; en: string };
  salary: { cn: string; en: string };
  responsibilities?: { cn?: string; en?: string };
  requirements?: { cn?: string; en?: string };
  preferredConditions?: { cn?: string; en?: string };
};

interface CareersData {
  jobs: Job[];
  contact: {
    phone: string;
    email: string;
    address: { cn: string; en: string };
  };
}

export default function CareersAdminPage() {
  const [data, setData] = useState<CareersData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [adminName, setAdminName] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  // 服务端 Cookie 会话校验
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' });
        if (!mounted) return;
        if (res.ok) {
          const j = await res.json();
          setIsAuthenticated(true);
          setAdminName(j?.user?.username || null);
        } else {
          setIsAuthenticated(false);
          setAdminName(null);
        }
      } catch {
        if (!mounted) return;
        setIsAuthenticated(false);
      } finally {
        if (mounted) setAuthChecking(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setAuthError(null);
    try {
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
      setIsAuthenticated(true);
      setAdminName(j?.user?.username || username);
      setUsername('');
      setPassword('');
    } catch (err: any) {
      setAuthError(err?.message || '用户名或密码错误，请重试');
      setPassword('');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    setIsAuthenticated(false);
    setAdminName(null);
  };

  // 将HTML转换为纯文本（用于编辑显示）
  const htmlToPlainText = (html: string): string => {
    if (!html || !html.trim()) return '';
    
    // 如果已经是纯文本（不以<开头），直接返回
    if (!html.trim().startsWith('<')) {
      return html;
    }
    
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(`<ul>${html}</ul>`, 'text/html');
      const lines: string[] = [];
      
      // 提取所有列表项，包括子列表中的项，全部平级显示
      const allListItems = doc.querySelectorAll('li');
      allListItems.forEach((li) => {
        // 移除strong标签，只提取文本内容
        const clone = li.cloneNode(true) as HTMLElement;
        const strongEl = clone.querySelector('strong');
        if (strongEl) {
          // 如果有strong标签，提取其文本
          const title = strongEl.textContent || '';
          if (title) {
            lines.push(title);
          }
        }
        
        // 提取子列表中的项
        const subList = clone.querySelector('ul.sub-list');
        if (subList) {
          const subItems = Array.from(subList.querySelectorAll('li')).map(li => li.textContent || '').filter(Boolean);
          subItems.forEach(item => lines.push(item));
        } else if (!strongEl) {
          // 没有strong标签也没有子列表，直接提取文本
          const text = clone.textContent?.trim() || '';
          if (text) lines.push(text);
        }
      });
      
      return lines.join('\n');
    } catch {
      // 解析失败，尝试简单处理
      return html.replace(/<[^>]*>/g, '').replace(/\n\s*\n/g, '\n').trim();
    }
  };

  // 将纯文本转换为HTML（用于保存）
  const plainTextToHtml = (text: string): string => {
    if (!text || !text.trim()) return '';
    
    // 如果已经是HTML格式（以<开头），先转换为纯文本再处理
    if (text.trim().startsWith('<')) {
      text = htmlToPlainText(text);
    }
    
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length === 0) return '';
    
    // 每行转换为一个列表项，全部平级，无标题和子列表
    return lines.map(line => `<li>${line.trim()}</li>`).join('\n');
  };

  // 加载 API（失败则回退到 localStorage 草稿）
  useEffect(() => {
    let mounted = true;
    (async () => {
      setError(null);
      try {
        const res = await fetch('/api/careers', { cache: 'no-store', credentials: 'include' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as CareersData;

        const draft = typeof window !== 'undefined' ? localStorage.getItem('careersDraft') : null;
        if (!mounted) return;
        setData(draft ? JSON.parse(draft) : json);
      } catch (e: any) {
        const draft = typeof window !== 'undefined' ? localStorage.getItem('careersDraft') : null;
        if (draft) {
          if (!mounted) return;
          setData(JSON.parse(draft));
          setError('API 加载失败，已使用本地草稿');
        } else {
          if (!mounted) return;
          setError('无法加载数据（API 不可用且本地草稿为空）');
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // 修改 Job 某个字段（指定语言）
  const patchJob = (id: string, path: 'title' | 'salary' | 'responsibilities' | 'requirements' | 'preferredConditions', v: string, targetLang: 'cn' | 'en', convertToHtml: boolean = false) => {
    setData((prev) => {
      if (!prev) return prev;
      const next: CareersData = structuredClone(prev);
      const job = next.jobs.find((j) => j.id === id);
      if (job) {
        if (path === 'title' || path === 'salary') {
          (job as any)[path][targetLang] = v;
        } else {
          // 对于 responsibilities, requirements, preferredConditions
          // 如果 convertToHtml 为 true，才转换为 HTML，否则直接保存原始文本
          if (!(job as any)[path]) {
            (job as any)[path] = { cn: '', en: '' };
          }
          // 直接保存原始文本，保留换行符
          (job as any)[path][targetLang] = convertToHtml ? plainTextToHtml(v) : v;
        }
      }
      return next;
    });
  };

  // 删除岗位
  const deleteJob = (id: string) => {
    if (!confirm('确定要删除这个岗位吗？此操作不可撤销。')) return;
    setData((prev) => {
      if (!prev) return prev;
      const next: CareersData = structuredClone(prev);
      next.jobs = next.jobs.filter((j) => j.id !== id);
      return next;
    });
  };

  // 新增岗位
  const addNewJob = () => {
    setData((prev) => {
      if (!prev) return prev;
      const next: CareersData = structuredClone(prev);
      const newId = `job-${Date.now()}`;
      const newJob: Job = {
        id: newId,
        title: { cn: '新岗位', en: 'New Position' },
        salary: { cn: '薪资待遇：面议', en: 'Salary: Negotiable' },
        responsibilities: { cn: '', en: '' },
        requirements: { cn: '', en: '' },
        preferredConditions: { cn: '', en: '' },
      };
      next.jobs.push(newJob);
      
      setTimeout(() => {
        const element = document.getElementById(`job-article-${newId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          element.style.transition = 'box-shadow 0.3s ease';
          element.style.boxShadow = '0 0 0 3px rgba(34, 197, 94, 0.5)';
          setTimeout(() => {
            element.style.boxShadow = '';
          }, 2000);
        }
      }, 100);
      
      return next;
    });
  };

  const saveDraft = () => {
    if (!data) return;
    localStorage.setItem('careersDraft', JSON.stringify(data));
    alert('已保存到浏览器本地草稿（localStorage）');
  };

  const publish = async () => {
    if (!data) return;
    setSaving(true);
    try {
      // 在发布前，将所有的纯文本字段转换为 HTML 格式
      const dataToPublish = structuredClone(data);
      dataToPublish.jobs.forEach((job) => {
        // 转换 responsibilities
        if (job.responsibilities) {
          ['cn', 'en'].forEach((langKey) => {
            const value = job.responsibilities?.[langKey as 'cn' | 'en'];
            if (value && !value.trim().startsWith('<')) {
              // 如果是纯文本，转换为 HTML
              (job.responsibilities as any)[langKey] = plainTextToHtml(value);
            }
          });
        }
        // 转换 requirements
        if (job.requirements) {
          ['cn', 'en'].forEach((langKey) => {
            const value = job.requirements?.[langKey as 'cn' | 'en'];
            if (value && !value.trim().startsWith('<')) {
              // 如果是纯文本，转换为 HTML
              (job.requirements as any)[langKey] = plainTextToHtml(value);
            }
          });
        }
        // 转换 preferredConditions
        if (job.preferredConditions) {
          ['cn', 'en'].forEach((langKey) => {
            const value = job.preferredConditions?.[langKey as 'cn' | 'en'];
            if (value && !value.trim().startsWith('<')) {
              // 如果是纯文本，转换为 HTML
              (job.preferredConditions as any)[langKey] = plainTextToHtml(value);
            }
          });
        }
      });

      let res: Response;
      
      // 先尝试 PUT 方法
      try {
        res = await fetch('/api/careers', {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(dataToPublish),
        });
        
        // 如果 PUT 返回 405（方法不允许），尝试使用 POST
        if (res.status === 405) {
          res = await fetch('/api/careers', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(dataToPublish),
          });
        }
      } catch (fetchError) {
        // 如果 PUT 请求本身失败（网络错误等），尝试 POST
        res = await fetch('/api/careers', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(dataToPublish),
        });
      }
      
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        if (res.status === 401) {
          setIsAuthenticated(false);
          throw new Error(j?.error || '登录已过期，请重新登录');
        }
        throw new Error(j?.error || `HTTP ${res.status}`);
      }
  
      // 通知前台刷新（双通道：BroadcastChannel + localStorage 事件）
      try {
        const ch = new BroadcastChannel('careers');
        ch.postMessage({ type: 'updated', at: Date.now() });
        ch.close();
      } catch {}
  
      localStorage.setItem('careers-updated', String(Date.now()));
      
      // 显示成功提示，然后跳转到招聘页面
      alert('已发布成功');
      window.location.href = `/careers.html?lang=zh`;
    } catch (e: any) {
      alert('发布失败：' + e.message);
      setSaving(false);
    }
  };

  if (authChecking) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-3 bg-[#0E2745]">
        <img src="/images/wintex-logo.png" alt="Wintex" className="h-10 brightness-0 invert opacity-90" />
        <p className="text-white/70 text-sm tracking-wide">正在进入管理端…</p>
      </main>
    );
  }

  if (!isAuthenticated) {
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
              管理招聘信息等内容。登录后即可编辑并发布到线上站点。
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

  if (!data) {
    return (
      <AdminShell adminName={adminName} onLogout={handleLogout}>
        <div className="p-8">
          {error ? <p className="text-red-600">{error}</p> : <p className="text-gray-500">加载招聘数据中…</p>}
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell adminName={adminName} onLogout={handleLogout}>
      <div className="p-6 lg:p-8 max-w-5xl">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-[#0E2745]">招聘管理</h1>
            <p className="text-sm text-gray-500 mt-1">编辑岗位与联系方式，发布后前台立即更新</p>
          </div>
          {error && <span className="text-xs text-red-600">{error}</span>}
        </div>

        <section className="grid gap-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-[#0E2745]">招聘岗位</h2>
            <button
              onClick={addNewJob}
              className="w-8 h-8 flex items-center justify-center rounded-lg border bg-green-600 text-white hover:bg-green-700 transition-colors text-lg font-bold"
              title="新增岗位"
            >
              +
            </button>
          </div>
          {data.jobs.map((job) => (
            <article
              key={job.id}
              id={`job-article-${job.id}`}
              className="rounded-xl border border-gray-200 p-4 bg-white shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <h2 className="font-semibold">{job.id}</h2>
                  <span className="text-xs text-gray-500">中英文编辑</span>
                </div>
                <button
                  onClick={() => deleteJob(job.id)}
                  className="w-6 h-6 flex items-center justify-center rounded-lg border bg-red-600 text-white hover:bg-red-700 transition-colors text-sm font-bold"
                  title="删除岗位"
                >
                  −
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <label className="grid gap-1">
                  <span className="text-sm text-gray-600">职位标题（中文）</span>
                  <input
                    className="border rounded-lg px-3 py-2"
                    value={job.title.cn}
                    onChange={(e) => patchJob(job.id, 'title', e.target.value, 'cn')}
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-sm text-gray-600">职位标题（English）</span>
                  <input
                    className="border rounded-lg px-3 py-2"
                    value={job.title.en}
                    onChange={(e) => patchJob(job.id, 'title', e.target.value, 'en')}
                  />
                </label>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <label className="grid gap-1">
                  <span className="text-sm text-gray-600">薪资文案（中文）</span>
                  <input
                    className="border rounded-lg px-3 py-2"
                    value={job.salary.cn}
                    onChange={(e) => patchJob(job.id, 'salary', e.target.value, 'cn')}
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-sm text-gray-600">薪资文案（English）</span>
                  <input
                    className="border rounded-lg px-3 py-2"
                    value={job.salary.en}
                    onChange={(e) => patchJob(job.id, 'salary', e.target.value, 'en')}
                  />
                </label>
              </div>

              <div className="mt-4 grid gap-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <label className="grid gap-1">
                    <span className="text-sm text-gray-600 font-medium">核心职责（中文）</span>
                    <textarea
                      className="border rounded-lg px-3 py-2 min-h-[120px] text-sm resize-y"
                      value={(() => {
                        const raw = job.responsibilities?.cn || '';
                        return raw.trim().startsWith('<') ? htmlToPlainText(raw) : raw;
                      })()}
                      onChange={(e) => patchJob(job.id, 'responsibilities', e.target.value, 'cn', false)}
                      placeholder="核心职责..."
                      style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}
                    />
                  </label>
                  <label className="grid gap-1">
                    <span className="text-sm text-gray-600 font-medium">核心职责（English）</span>
                    <textarea
                      className="border rounded-lg px-3 py-2 min-h-[120px] text-sm resize-y"
                      value={(() => {
                        const raw = job.responsibilities?.en || '';
                        return raw.trim().startsWith('<') ? htmlToPlainText(raw) : raw;
                      })()}
                      onChange={(e) => patchJob(job.id, 'responsibilities', e.target.value, 'en', false)}
                      placeholder="Core Responsibilities..."
                      style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}
                    />
                  </label>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <label className="grid gap-1">
                    <span className="text-sm text-gray-600 font-medium">职位要求（中文）</span>
                    <textarea
                      className="border rounded-lg px-3 py-2 min-h-[200px] text-sm resize-y"
                      value={(() => {
                        const raw = job.requirements?.cn || '';
                        return raw.trim().startsWith('<') ? htmlToPlainText(raw) : raw;
                      })()}
                      onChange={(e) => patchJob(job.id, 'requirements', e.target.value, 'cn', false)}
                      placeholder="职位要求..."
                      style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}
                    />
                  </label>
                  <label className="grid gap-1">
                    <span className="text-sm text-gray-600 font-medium">职位要求（English）</span>
                    <textarea
                      className="border rounded-lg px-3 py-2 min-h-[200px] text-sm resize-y"
                      value={(() => {
                        const raw = job.requirements?.en || '';
                        return raw.trim().startsWith('<') ? htmlToPlainText(raw) : raw;
                      })()}
                      onChange={(e) => patchJob(job.id, 'requirements', e.target.value, 'en', false)}
                      placeholder="Requirements..."
                      style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}
                    />
                  </label>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <label className="grid gap-1">
                    <span className="text-sm text-gray-600 font-medium">优先条件（中文）</span>
                    <textarea
                      className="border rounded-lg px-3 py-2 min-h-[100px] text-sm resize-y"
                      value={(() => {
                        const raw = job.preferredConditions?.cn || '';
                        return raw.trim().startsWith('<') ? htmlToPlainText(raw) : raw;
                      })()}
                      onChange={(e) => patchJob(job.id, 'preferredConditions', e.target.value, 'cn', false)}
                      placeholder="优先条件..."
                      style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}
                    />
                  </label>
                  <label className="grid gap-1">
                    <span className="text-sm text-gray-600 font-medium">优先条件（English）</span>
                    <textarea
                      className="border rounded-lg px-3 py-2 min-h-[100px] text-sm resize-y"
                      value={(() => {
                        const raw = job.preferredConditions?.en || '';
                        return raw.trim().startsWith('<') ? htmlToPlainText(raw) : raw;
                      })()}
                      onChange={(e) => patchJob(job.id, 'preferredConditions', e.target.value, 'en', false)}
                      placeholder="Preference..."
                      style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}
                    />
                  </label>
                </div>
              </div>
            </article>
          ))}
        </section>

        <section className="mt-6 rounded-xl border border-gray-200 p-4 bg-white shadow-sm">
          <h3 className="font-semibold mb-3 text-[#0E2745]">联系方式</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <label className="grid gap-1">
              <span className="text-sm text-gray-600">电话</span>
              <input
                className="border rounded-lg px-3 py-2"
                value={data.contact.phone}
                onChange={(e) => setData({ ...data, contact: { ...data.contact, phone: e.target.value } })}
              />
            </label>
            <label className="grid gap-1">
              <span className="text-sm text-gray-600">邮箱</span>
              <input
                className="border rounded-lg px-3 py-2"
                value={data.contact.email}
                onChange={(e) => setData({ ...data, contact: { ...data.contact, email: e.target.value } })}
              />
            </label>
            <label className="grid gap-1">
              <span className="text-sm text-gray-600">地址（中文）</span>
              <input
                className="border rounded-lg px-3 py-2"
                value={data.contact.address.cn}
                onChange={(e) =>
                  setData({
                    ...data,
                    contact: { ...data.contact, address: { ...data.contact.address, cn: e.target.value } },
                  })
                }
              />
            </label>
            <label className="grid gap-1">
              <span className="text-sm text-gray-600">地址（English）</span>
              <input
                className="border rounded-lg px-3 py-2"
                value={data.contact.address.en}
                onChange={(e) =>
                  setData({
                    ...data,
                    contact: { ...data.contact, address: { ...data.contact.address, en: e.target.value } },
                  })
                }
              />
            </label>
          </div>
        </section>

        <div className="mt-6 flex gap-3 sticky bottom-4 bg-[#F5F7FA]/95 backdrop-blur py-3">
          <button
            onClick={saveDraft}
            className="px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm hover:bg-gray-50"
          >
            保存草稿（本地）
          </button>
          <button
            onClick={publish}
            disabled={saving}
            className="px-5 py-2.5 rounded-lg bg-[#0E2745] text-white text-sm font-semibold hover:bg-[#163a5f] disabled:opacity-50"
          >
            {saving ? '发布中…' : '发布到网站'}
          </button>
        </div>
      </div>
    </AdminShell>
  );
}

function AdminShell({
  children,
  adminName,
  onLogout,
}: {
  children: React.ReactNode;
  adminName: string | null;
  onLogout: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="h-14 shrink-0 bg-[#0E2745] text-white flex items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <img src="/images/wintex-logo.png" alt="Wintex" className="h-8 brightness-0 invert" />
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-wide">Wintex 管理端</div>
            <div className="text-[11px] text-white/55">网站内容管理</div>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm">
          {adminName && <span className="hidden sm:inline text-white/70">{adminName}</span>}
          <button
            type="button"
            onClick={onLogout}
            className="px-3 py-1.5 rounded-md border border-white/25 text-white/90 hover:bg-white/10 text-xs"
          >
            退出
          </button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        <aside className="hidden md:flex w-52 shrink-0 flex-col border-r border-gray-200 bg-white py-4">
          <p className="px-4 text-[11px] uppercase tracking-wider text-gray-400 mb-2">内容模块</p>
          <div className="mx-2 rounded-lg bg-[#0E2745] text-white px-3 py-2.5 text-sm font-medium">招聘管理</div>
          <p className="px-4 mt-6 text-[11px] text-gray-400 leading-relaxed">后续可在此扩展新闻、首页等模块</p>
        </aside>
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </div>
  );
}
