// File: app/[locale]/admin/careers/page.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useLocale } from 'next-intl';

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
  const locale = useLocale();
  const [data, setData] = useState<CareersData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const lang = useMemo<'cn' | 'en'>(() => (locale === 'en' ? 'en' : 'cn'), [locale]);

  // 检查权限
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const authStatus = sessionStorage.getItem('adminAuth');
      const authTime = sessionStorage.getItem('adminAuthTime');
      
      // 检查认证状态和时效（30分钟）
      if (authStatus === 'true' && authTime) {
        const timeDiff = Date.now() - parseInt(authTime);
        const thirtyMinutes = 30 * 60 * 1000;
        
        if (timeDiff < thirtyMinutes) {
          setIsAuthenticated(true);
        } else {
          // 认证过期，清除状态
          sessionStorage.removeItem('adminAuth');
          sessionStorage.removeItem('adminAuthTime');
        }
      }
    }
  }, []);

  // 处理登录
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'wintex' && password === 'wintex2025') {
      sessionStorage.setItem('adminAuth', 'true');
      sessionStorage.setItem('adminAuthTime', Date.now().toString());
      setIsAuthenticated(true);
      setAuthError(null);
      setUsername('');
      setPassword('');
    } else {
      setAuthError('用户名或密码错误，请重试');
      setPassword('');
    }
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
        const res = await fetch('/api/careers', { cache: 'no-store' });
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
          body: JSON.stringify(dataToPublish),
        });
        
        // 如果 PUT 返回 405（方法不允许），尝试使用 POST
        if (res.status === 405) {
          res = await fetch('/api/careers', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(dataToPublish),
          });
        }
      } catch (fetchError) {
        // 如果 PUT 请求本身失败（网络错误等），尝试 POST
        res = await fetch('/api/careers', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(dataToPublish),
        });
      }
      
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
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
      const langParam = locale === 'en' ? 'en' : 'cn';
      window.location.href = `/careers.html?lang=${langParam}`;
    } catch (e: any) {
      alert('发布失败：' + e.message);
      setSaving(false);
    }
  };

  // 权限验证页面
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">管理员验证</h1>
            <p className="text-gray-600">请输入管理员账户和密码</p>
          </div>
          
          {authError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {authError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  用户名
                </span>
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="请输入用户名"
                required
                autoFocus
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  密码
                </span>
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="请输入密码"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              登录
            </button>
          </form>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Careers 管理</h1>
        {error ? <p className="text-red-600">{error}</p> : <p>加载中…</p>}
      </main>
    );
  }

  return (
    <main className="container mx-auto p-6">
      <header className="mb-6 flex items-center gap-3">
        <h1 className="text-2xl font-bold">Careers 管理</h1>
        {error && <span className="text-xs text-red-600">{error}</span>}
      </header>

      <section className="grid gap-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">招聘岗位</h2>
          <button
            onClick={addNewJob}
            className="w-8 h-8 flex items-center justify-center rounded-lg border bg-green-600 text-white hover:bg-green-700 transition-colors text-lg font-bold"
            title="新增岗位"
          >
            +
          </button>
        </div>
        {data.jobs.map((job) => (
          <article key={job.id} id={`job-article-${job.id}`} className="rounded-xl border p-4 bg-white/70">
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
                      // 如果是 HTML 格式，转换为纯文本；否则直接使用
                      return raw.trim().startsWith('<') ? htmlToPlainText(raw) : raw;
                    })()}
                    onChange={(e) => patchJob(job.id, 'responsibilities', e.target.value, 'cn', false)}
                    placeholder="核心职责...&#10;每行一个条目"
                    style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}
                  />
                </label>

                <label className="grid gap-1">
                  <span className="text-sm text-gray-600 font-medium">核心职责（English）</span>
                  <textarea
                    className="border rounded-lg px-3 py-2 min-h-[120px] text-sm resize-y"
                    value={(() => {
                      const raw = job.responsibilities?.en || '';
                      // 如果是 HTML 格式，转换为纯文本；否则直接使用
                      return raw.trim().startsWith('<') ? htmlToPlainText(raw) : raw;
                    })()}
                    onChange={(e) => patchJob(job.id, 'responsibilities', e.target.value, 'en', false)}
                    placeholder="Core Responsibilities...&#10;One item per line"
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
                      // 如果是 HTML 格式，转换为纯文本；否则直接使用
                      return raw.trim().startsWith('<') ? htmlToPlainText(raw) : raw;
                    })()}
                    onChange={(e) => patchJob(job.id, 'requirements', e.target.value, 'cn', false)}
                    placeholder="职位要求...&#10;每行一个条目"
                    style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}
                  />
                </label>

                <label className="grid gap-1">
                  <span className="text-sm text-gray-600 font-medium">职位要求（English）</span>
                  <textarea
                    className="border rounded-lg px-3 py-2 min-h-[200px] text-sm resize-y"
                    value={(() => {
                      const raw = job.requirements?.en || '';
                      // 如果是 HTML 格式，转换为纯文本；否则直接使用
                      return raw.trim().startsWith('<') ? htmlToPlainText(raw) : raw;
                    })()}
                    onChange={(e) => patchJob(job.id, 'requirements', e.target.value, 'en', false)}
                    placeholder="Requirements...&#10;One item per line"
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
                      // 如果是 HTML 格式，转换为纯文本；否则直接使用
                      return raw.trim().startsWith('<') ? htmlToPlainText(raw) : raw;
                    })()}
                    onChange={(e) => patchJob(job.id, 'preferredConditions', e.target.value, 'cn', false)}
                    placeholder="优先条件...&#10;每行一个条目"
                    style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}
                  />
                </label>

                <label className="grid gap-1">
                  <span className="text-sm text-gray-600 font-medium">优先条件（English）</span>
                  <textarea
                    className="border rounded-lg px-3 py-2 min-h-[100px] text-sm resize-y"
                    value={(() => {
                      const raw = job.preferredConditions?.en || '';
                      // 如果是 HTML 格式，转换为纯文本；否则直接使用
                      return raw.trim().startsWith('<') ? htmlToPlainText(raw) : raw;
                    })()}
                    onChange={(e) => patchJob(job.id, 'preferredConditions', e.target.value, 'en', false)}
                    placeholder="Preference...&#10;One item per line"
                    style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}
                  />
                </label>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="mt-6 rounded-xl border p-4 bg-white/70">
        <h3 className="font-semibold mb-3">联系方式</h3>
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
                  contact: {
                    ...data.contact,
                    address: { ...data.contact.address, cn: e.target.value },
                  },
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
                  contact: {
                    ...data.contact,
                    address: { ...data.contact.address, en: e.target.value },
                  },
                })
              }
            />
          </label>
        </div>
      </section>

      <div className="mt-6 flex gap-3">
        <button onClick={saveDraft} className="px-4 py-2 rounded-lg border">
          保存草稿（本地）
        </button>
        <button
          onClick={publish}
          disabled={saving}
          className="px-4 py-2 rounded-lg border bg-black text-white disabled:opacity-50"
        >
          {saving ? '发布中…' : '发布'}
        </button>
      </div>
    </main>
  );
}
