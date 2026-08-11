// File: app/[locale]/admin/careers/page.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useLocale } from 'next-intl';

type Job = {
  id: string;
  title: { cn: string; en: string };
  salary: { cn: string; en: string };
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

  const lang = useMemo<'cn' | 'en'>(() => (locale === 'en' ? 'en' : 'cn'), [locale]);

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

  // 修改 Job 某个字段（当前语言）
  const patchJob = (id: string, path: 'title' | 'salary', v: string) => {
    setData((prev) => {
      if (!prev) return prev;
      const next: CareersData = structuredClone(prev);
      const job = next.jobs.find((j) => j.id === id);
      if (job) {
        (job as any)[path][lang] = v;
      }
      return next;
    });
  };

  const saveDraft = () => {
    if (!data) return;
    localStorage.setItem('careersDraft', JSON.stringify(data));
    alert('已保存到浏览器本地草稿（localStorage）');
  };

  // 示例“发布”（无后端，仅演示）
  const publish = async () => {
    if (!data) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 500));
    setSaving(false);
    alert('已模拟发布（示例环境未接后端）。\n若要接 DB，请实现 PUT /api/careers');
  };

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
        <span className="text-xs text-gray-500">当前语言：{lang.toUpperCase()}</span>
      </header>

      <section className="grid gap-6">
        {data.jobs.map((job) => (
          <article key={job.id} className="rounded-xl border p-4 bg-white/70">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">{job.id}</h2>
              <span className="text-xs text-gray-500">编辑 {lang.toUpperCase()}</span>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <label className="grid gap-1">
                <span className="text-sm text-gray-600">职位标题</span>
                <input
                  className="border rounded-lg px-3 py-2"
                  value={job.title[lang]}
                  onChange={(e) => patchJob(job.id, 'title', e.target.value)}
                />
              </label>

              <label className="grid gap-1">
                <span className="text-sm text-gray-600">薪资文案</span>
                <input
                  className="border rounded-lg px-3 py-2"
                  value={job.salary[lang]}
                  onChange={(e) => patchJob(job.id, 'salary', e.target.value)}
                />
              </label>
            </div>
          </article>
        ))}
      </section>

      <section className="mt-6 rounded-xl border p-4 bg-white/70">
        <h3 className="font-semibold mb-3">联系方式</h3>
        <div className="grid md:grid-cols-3 gap-4">
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
          <label className="grid gap-1 md:col-span-3">
            <span className="text-sm text-gray-600">地址（{lang.toUpperCase()}）</span>
            <input
              className="border rounded-lg px-3 py-2"
              value={data.contact.address[lang]}
              onChange={(e) =>
                setData({
                  ...data,
                  contact: {
                    ...data.contact,
                    address: { ...data.contact.address, [lang]: e.target.value },
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
          {saving ? '发布中…' : '发布（示例）'}
        </button>
      </div>
    </main>
  );
}
 