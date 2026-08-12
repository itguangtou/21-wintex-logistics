'use client';

import React, { useEffect, useState } from 'react';
import { useAdminAuth } from './AdminAuthContext';
import { useAdminChrome } from './AdminChromeContext';

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

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 text-gray-400 transition-transform ${open ? 'rotate-90' : ''}`}
      aria-hidden
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

function AccordionItem({
  name,
  open,
  onToggle,
  actions,
  children,
}: {
  name: string;
  open: boolean;
  onToggle: () => void;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <li className="border-b border-gray-100 last:border-0">
      <div className="flex items-stretch">
        <button
          type="button"
          onClick={onToggle}
          className="flex-1 min-w-0 flex items-center gap-3 px-4 py-3.5 text-left hover:bg-gray-50 transition-colors"
          aria-expanded={open}
        >
          <Chevron open={open} />
          <span className="text-sm font-medium text-gray-800 truncate">{name}</span>
        </button>
        {actions && <div className="flex items-center gap-2 px-3 shrink-0">{actions}</div>}
      </div>
      {open && <div className="px-4 pb-5 pt-1 space-y-4 bg-gray-50/40 border-t border-gray-100">{children}</div>}
    </li>
  );
}

function displayText(raw: string | undefined): string {
  if (!raw) return '';
  return raw.trim().startsWith('<') ? htmlToPlainText(raw) : raw;
}

function htmlToPlainText(html: string): string {
  if (!html || !html.trim()) return '';

  if (!html.trim().startsWith('<')) {
    return html;
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<ul>${html}</ul>`, 'text/html');
    const lines: string[] = [];

    const allListItems = doc.querySelectorAll('li');
    allListItems.forEach((li) => {
      const clone = li.cloneNode(true) as HTMLElement;
      const strongEl = clone.querySelector('strong');
      if (strongEl) {
        const title = strongEl.textContent || '';
        if (title) {
          lines.push(title);
        }
      }

      const subList = clone.querySelector('ul.sub-list');
      if (subList) {
        const subItems = Array.from(subList.querySelectorAll('li'))
          .map((item) => item.textContent || '')
          .filter(Boolean);
        subItems.forEach((item) => lines.push(item));
      } else if (!strongEl) {
        const text = clone.textContent?.trim() || '';
        if (text) lines.push(text);
      }
    });

    return lines.join('\n');
  } catch {
    return html.replace(/<[^>]*>/g, '').replace(/\n\s*\n/g, '\n').trim();
  }
}

function plainTextToHtml(text: string): string {
  if (!text || !text.trim()) return '';

  if (text.trim().startsWith('<')) {
    text = htmlToPlainText(text);
  }

  const lines = text.split('\n').filter((line) => line.trim());
  if (lines.length === 0) return '';

  return lines.map((line) => `<li>${line.trim()}</li>`).join('\n');
}

export default function CareersEditor() {
  const { logout } = useAdminAuth();
  const { setSubtitle } = useAdminChrome();
  const [data, setData] = useState<CareersData | null>(null);
  const [openJobs, setOpenJobs] = useState<Record<string, boolean>>({});
  const [openContact, setOpenContact] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSubtitle('编辑岗位与联系方式，发布后刷新 /zh/careers 即可看到');
    return () => setSubtitle(null);
  }, [setSubtitle]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setError(null);
      try {
        // 始终以服务端数据为准，不用 localStorage 草稿覆盖（避免已删除岗位被草稿复活）
        try {
          localStorage.removeItem('careersDraft');
          localStorage.removeItem('careersData');
        } catch {
          /* ignore */
        }
        const res = await fetch('/api/careers', { cache: 'no-store', credentials: 'include' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as CareersData;
        if (!mounted) return;
        setData(json);
      } catch {
        if (!mounted) return;
        setError('无法加载招聘数据，请刷新重试');
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const patchJob = (
    id: string,
    path: 'title' | 'salary' | 'responsibilities' | 'requirements' | 'preferredConditions',
    v: string,
    targetLang: 'cn' | 'en',
    convertToHtml: boolean = false
  ) => {
    setData((prev) => {
      if (!prev) return prev;
      const next: CareersData = structuredClone(prev);
      const job = next.jobs.find((j) => j.id === id);
      if (job) {
        if (path === 'title' || path === 'salary') {
          job[path][targetLang] = v;
        } else {
          if (!job[path]) {
            job[path] = { cn: '', en: '' };
          }
          (job[path] as { cn: string; en: string })[targetLang] = convertToHtml ? plainTextToHtml(v) : v;
        }
      }
      return next;
    });
  };

  const deleteJob = (id: string, title: string) => {
    if (!window.confirm(`确定删除「${title || id}」？此操作不可撤销。`)) return;
    setData((prev) => {
      if (!prev) return prev;
      const next: CareersData = structuredClone(prev);
      next.jobs = next.jobs.filter((j) => j.id !== id);
      return next;
    });
    setOpenJobs((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setMessage('已从编辑列表移除该岗位（需发布后前台生效）');
  };

  const addNewJob = () => {
    const newId = `job-${Date.now()}`;
    setData((prev) => {
      if (!prev) return prev;
      const next: CareersData = structuredClone(prev);
      next.jobs.push({
        id: newId,
        title: { cn: '新岗位', en: 'New Position' },
        salary: { cn: '薪资待遇：面议', en: 'Salary: Negotiable' },
        responsibilities: { cn: '', en: '' },
        requirements: { cn: '', en: '' },
        preferredConditions: { cn: '', en: '' },
      });
      return next;
    });
    setOpenJobs((prev) => ({ ...prev, [newId]: true }));
  };

  const publish = async () => {
    if (!data) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const dataToPublish = structuredClone(data);
      dataToPublish.jobs.forEach((job) => {
        (['responsibilities', 'requirements', 'preferredConditions'] as const).forEach((field) => {
          if (!job[field]) return;
          (['cn', 'en'] as const).forEach((langKey) => {
            const value = job[field]?.[langKey];
            if (value && !value.trim().startsWith('<')) {
              (job[field] as { cn: string; en: string })[langKey] = plainTextToHtml(value);
            }
          });
        });
      });

      let res: Response;

      try {
        res = await fetch('/api/careers', {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(dataToPublish),
        });

        if (res.status === 405) {
          res = await fetch('/api/careers', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(dataToPublish),
          });
        }
      } catch {
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
          await logout();
          throw new Error(j?.error || '登录已过期，请重新登录');
        }
        throw new Error(j?.error || `HTTP ${res.status}`);
      }

      try {
        localStorage.removeItem('careersDraft');
        localStorage.removeItem('careersData');
        localStorage.removeItem('careers-updated');
      } catch {
        /* ignore */
      }

      setMessage('已发布，前台招聘页已更新（刷新 /zh/careers 或 /en/careers 可见）');
      setData(dataToPublish);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '发布失败');
    } finally {
      setSaving(false);
    }
  };

  if (!data) {
    return (
      <div className="p-8">
        {error ? <p className="text-red-600 text-sm">{error}</p> : <p className="text-gray-500 text-sm">加载招聘数据中…</p>}
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void publish()}
          disabled={saving}
          className="px-5 py-2 rounded-lg bg-[#0E2745] text-white text-sm font-semibold hover:bg-[#163a5f] disabled:opacity-50"
        >
          {saving ? '发布中…' : '发布到网站'}
        </button>
        {message && <span className="text-sm text-emerald-700">{message}</span>}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <h2 className="text-base font-semibold text-[#0E2745]">1. 招聘岗位</h2>
          <button
            type="button"
            onClick={addNewJob}
            className="h-9 px-3 rounded-lg bg-[#0E2745] text-white text-sm hover:bg-[#163a5f]"
          >
            新增岗位
          </button>
        </div>
        <ul className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          {data.jobs.length === 0 ? (
            <li className="px-4 py-10 text-center text-sm text-gray-400">暂无岗位，点击「新增岗位」</li>
          ) : (
            data.jobs.map((job) => {
              const open = !!openJobs[job.id];
              const name = job.title.cn?.trim() || job.title.en?.trim() || job.id;
              return (
                <AccordionItem
                  key={job.id}
                  name={name}
                  open={open}
                  onToggle={() => setOpenJobs((prev) => ({ ...prev, [job.id]: !prev[job.id] }))}
                  actions={
                    <button
                      type="button"
                      className="text-sm text-red-600 hover:underline"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteJob(job.id, name);
                      }}
                    >
                      删除
                    </button>
                  }
                >
                  <div className="grid md:grid-cols-2 gap-4">
                    <label className="grid gap-1">
                      <span className="text-sm font-medium text-gray-700">职位标题（中文）</span>
                      <input
                        className="border rounded-lg px-3 py-2 text-sm outline-none focus:border-[#0E2745] focus:ring-2 focus:ring-[#0E2745]/15"
                        value={job.title.cn}
                        onChange={(e) => patchJob(job.id, 'title', e.target.value, 'cn')}
                      />
                    </label>
                    <label className="grid gap-1">
                      <span className="text-sm font-medium text-gray-700">职位标题（English）</span>
                      <input
                        className="border rounded-lg px-3 py-2 text-sm outline-none focus:border-[#0E2745] focus:ring-2 focus:ring-[#0E2745]/15"
                        value={job.title.en}
                        onChange={(e) => patchJob(job.id, 'title', e.target.value, 'en')}
                      />
                    </label>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <label className="grid gap-1">
                      <span className="text-sm font-medium text-gray-700">薪资文案（中文）</span>
                      <input
                        className="border rounded-lg px-3 py-2 text-sm outline-none focus:border-[#0E2745] focus:ring-2 focus:ring-[#0E2745]/15"
                        value={job.salary.cn}
                        onChange={(e) => patchJob(job.id, 'salary', e.target.value, 'cn')}
                      />
                    </label>
                    <label className="grid gap-1">
                      <span className="text-sm font-medium text-gray-700">薪资文案（English）</span>
                      <input
                        className="border rounded-lg px-3 py-2 text-sm outline-none focus:border-[#0E2745] focus:ring-2 focus:ring-[#0E2745]/15"
                        value={job.salary.en}
                        onChange={(e) => patchJob(job.id, 'salary', e.target.value, 'en')}
                      />
                    </label>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <label className="grid gap-1">
                      <span className="text-sm font-medium text-gray-700">核心职责（中文）</span>
                      <textarea
                        className="border rounded-lg px-3 py-2 min-h-[120px] text-sm resize-y outline-none focus:border-[#0E2745] focus:ring-2 focus:ring-[#0E2745]/15"
                        value={displayText(job.responsibilities?.cn)}
                        onChange={(e) => patchJob(job.id, 'responsibilities', e.target.value, 'cn', false)}
                        placeholder="每行一条…"
                        style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}
                      />
                    </label>
                    <label className="grid gap-1">
                      <span className="text-sm font-medium text-gray-700">核心职责（English）</span>
                      <textarea
                        className="border rounded-lg px-3 py-2 min-h-[120px] text-sm resize-y outline-none focus:border-[#0E2745] focus:ring-2 focus:ring-[#0E2745]/15"
                        value={displayText(job.responsibilities?.en)}
                        onChange={(e) => patchJob(job.id, 'responsibilities', e.target.value, 'en', false)}
                        placeholder="One item per line…"
                        style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}
                      />
                    </label>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <label className="grid gap-1">
                      <span className="text-sm font-medium text-gray-700">职位要求（中文）</span>
                      <textarea
                        className="border rounded-lg px-3 py-2 min-h-[200px] text-sm resize-y outline-none focus:border-[#0E2745] focus:ring-2 focus:ring-[#0E2745]/15"
                        value={displayText(job.requirements?.cn)}
                        onChange={(e) => patchJob(job.id, 'requirements', e.target.value, 'cn', false)}
                        placeholder="每行一条…"
                        style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}
                      />
                    </label>
                    <label className="grid gap-1">
                      <span className="text-sm font-medium text-gray-700">职位要求（English）</span>
                      <textarea
                        className="border rounded-lg px-3 py-2 min-h-[200px] text-sm resize-y outline-none focus:border-[#0E2745] focus:ring-2 focus:ring-[#0E2745]/15"
                        value={displayText(job.requirements?.en)}
                        onChange={(e) => patchJob(job.id, 'requirements', e.target.value, 'en', false)}
                        placeholder="One item per line…"
                        style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}
                      />
                    </label>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <label className="grid gap-1">
                      <span className="text-sm font-medium text-gray-700">优先条件（中文）</span>
                      <textarea
                        className="border rounded-lg px-3 py-2 min-h-[100px] text-sm resize-y outline-none focus:border-[#0E2745] focus:ring-2 focus:ring-[#0E2745]/15"
                        value={displayText(job.preferredConditions?.cn)}
                        onChange={(e) => patchJob(job.id, 'preferredConditions', e.target.value, 'cn', false)}
                        placeholder="每行一条…"
                        style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}
                      />
                    </label>
                    <label className="grid gap-1">
                      <span className="text-sm font-medium text-gray-700">优先条件（English）</span>
                      <textarea
                        className="border rounded-lg px-3 py-2 min-h-[100px] text-sm resize-y outline-none focus:border-[#0E2745] focus:ring-2 focus:ring-[#0E2745]/15"
                        value={displayText(job.preferredConditions?.en)}
                        onChange={(e) => patchJob(job.id, 'preferredConditions', e.target.value, 'en', false)}
                        placeholder="One item per line…"
                        style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}
                      />
                    </label>
                  </div>
                </AccordionItem>
              );
            })
          )}
        </ul>
      </section>

      <section>
        <h2 className="text-base font-semibold text-[#0E2745] mb-3">2. 联系方式</h2>
        <ul className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <AccordionItem
            name="电话 / 邮箱 / 地址"
            open={openContact}
            onToggle={() => setOpenContact((v) => !v)}
          >
            <div className="grid md:grid-cols-2 gap-4">
              <label className="grid gap-1">
                <span className="text-sm font-medium text-gray-700">电话</span>
                <input
                  className="border rounded-lg px-3 py-2 text-sm outline-none focus:border-[#0E2745] focus:ring-2 focus:ring-[#0E2745]/15"
                  value={data.contact.phone}
                  onChange={(e) => setData({ ...data, contact: { ...data.contact, phone: e.target.value } })}
                />
              </label>
              <label className="grid gap-1">
                <span className="text-sm font-medium text-gray-700">邮箱</span>
                <input
                  className="border rounded-lg px-3 py-2 text-sm outline-none focus:border-[#0E2745] focus:ring-2 focus:ring-[#0E2745]/15"
                  value={data.contact.email}
                  onChange={(e) => setData({ ...data, contact: { ...data.contact, email: e.target.value } })}
                />
              </label>
              <label className="grid gap-1">
                <span className="text-sm font-medium text-gray-700">地址（中文）</span>
                <input
                  className="border rounded-lg px-3 py-2 text-sm outline-none focus:border-[#0E2745] focus:ring-2 focus:ring-[#0E2745]/15"
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
                <span className="text-sm font-medium text-gray-700">地址（English）</span>
                <input
                  className="border rounded-lg px-3 py-2 text-sm outline-none focus:border-[#0E2745] focus:ring-2 focus:ring-[#0E2745]/15"
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
          </AccordionItem>
        </ul>
      </section>
    </div>
  );
}
