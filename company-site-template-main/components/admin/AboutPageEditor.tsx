'use client';

import React, { useEffect, useState } from 'react';
import BilingualField from './BilingualField';
import { useAdminChrome } from './AdminChromeContext';
import { useAdminAuth } from './AdminAuthContext';
import {
  DEFAULT_ABOUT_CONTENT,
  type AboutPageContent,
  type LocaleText,
} from '@/lib/aboutPageContent';

function cloneDefault(): AboutPageContent {
  return structuredClone(DEFAULT_ABOUT_CONTENT);
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
  children,
}: {
  name: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <li className="border-b border-gray-100 last:border-0">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-gray-50 transition-colors"
        aria-expanded={open}
      >
        <Chevron open={open} />
        <span className="text-sm font-medium text-gray-800 truncate">{name}</span>
      </button>
      {open && <div className="px-4 pb-5 pt-1 space-y-4 bg-gray-50/40 border-t border-gray-100">{children}</div>}
    </li>
  );
}

export default function AboutPageEditor() {
  const { setSubtitle } = useAdminChrome();
  const { logout } = useAdminAuth();
  const [data, setData] = useState<AboutPageContent | null>(null);
  const [openIntro, setOpenIntro] = useState<Record<number, boolean>>({});
  const [openNetwork, setOpenNetwork] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSubtitle('编辑品牌引言与网络图文案，发布后网站会更新');
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/pages/about', { credentials: 'include', cache: 'no-store' });
        const j = await res.json().catch(() => ({}));
        if (!mounted) return;
        if (!res.ok) throw new Error(j?.error || '加载失败，请刷新页面');
        setData(j.content ? structuredClone(j.content) : cloneDefault());
      } catch (e: unknown) {
        if (!mounted) return;
        setData(cloneDefault());
        setError(e instanceof Error ? e.message : '加载失败，已使用默认文案');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
      setSubtitle(null);
    };
  }, [setSubtitle]);

  const save = async (mode: 'draft' | 'publish') => {
    if (!data) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch('/api/pages/about', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ mode, content: data }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.status === 401) {
        await logout({ reason: 'expired' });
        throw new Error(j?.error || '登录已过期，请重新登录');
      }
      if (!res.ok) throw new Error(j?.error || '保存失败，请稍后重试');
      setMessage(mode === 'draft' ? '草稿已保存' : '已发布，网站已更新');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const toggleIntro = (i: number) => {
    setOpenIntro((prev) => ({ ...prev, [i]: !prev[i] }));
  };

  const toggleNetwork = (i: number) => {
    setOpenNetwork((prev) => ({ ...prev, [i]: !prev[i] }));
  };

  const patchIntroTitle = (index: number, lang: keyof LocaleText, value: string) => {
    setData((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      next.intro[index].title[lang] = value;
      return next;
    });
  };

  const patchIntroBody = (blockIndex: number, bodyIndex: number, lang: keyof LocaleText, value: string) => {
    setData((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      next.intro[blockIndex].body[bodyIndex][lang] = value;
      return next;
    });
  };

  const patchNetworkItem = (index: number, lang: keyof LocaleText, value: string) => {
    setData((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      next.network.items[index][lang] = value;
      return next;
    });
  };

  if (loading || !data) {
    return <div className="p-8 text-sm text-gray-500">加载中…</div>;
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={saving}
          onClick={() => void save('draft')}
          className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          {saving ? '保存中…' : '保存草稿'}
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => void save('publish')}
          className="px-5 py-2 rounded-lg bg-[#0E2745] text-white text-sm font-semibold hover:bg-[#163a5f] disabled:opacity-50"
        >
          {saving ? '发布中…' : '保存并发布'}
        </button>
        {message && <span className="text-sm text-emerald-700">{message}</span>}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>

      <section>
        <h2 className="text-base font-semibold text-[#0E2745] mb-3">引言区块</h2>
        <ul className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          {data.intro.map((block, i) => {
            const open = !!openIntro[i];
            const name = block.title.zh?.trim() || `引言 ${i + 1}`;
            return (
              <AccordionItem key={i} name={name} open={open} onToggle={() => toggleIntro(i)}>
                <BilingualField
                  label="标题"
                  zh={block.title.zh}
                  en={block.title.en}
                  onZhChange={(v) => patchIntroTitle(i, 'zh', v)}
                  onEnChange={(v) => patchIntroTitle(i, 'en', v)}
                />
                {block.body.map((para, pi) => (
                  <BilingualField
                    key={pi}
                    label={block.body.length > 1 ? `正文 ${pi + 1}` : '正文'}
                    zh={para.zh}
                    en={para.en}
                    multiline
                    onZhChange={(v) => patchIntroBody(i, pi, 'zh', v)}
                    onEnChange={(v) => patchIntroBody(i, pi, 'en', v)}
                  />
                ))}
              </AccordionItem>
            );
          })}
        </ul>
      </section>

      <section>
        <h2 className="text-base font-semibold text-[#0E2745] mb-3">网络图节点</h2>
        <ul className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          {data.network.items.map((item, i) => {
            const open = !!openNetwork[i];
            const name = item.zh?.trim()
              ? `${i + 1}. ${item.zh.trim().slice(0, 28)}${item.zh.trim().length > 28 ? '…' : ''}`
              : `节点 ${i + 1}`;
            return (
              <AccordionItem key={i} name={name} open={open} onToggle={() => toggleNetwork(i)}>
                <BilingualField
                  label="文案"
                  zh={item.zh}
                  en={item.en}
                  multiline
                  onZhChange={(v) => patchNetworkItem(i, 'zh', v)}
                  onEnChange={(v) => patchNetworkItem(i, 'en', v)}
                />
              </AccordionItem>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
