'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import BilingualField from './BilingualField';
import ImageReplaceField from './ImageReplaceField';
import { useAdminChrome } from './AdminChromeContext';
import { useAdminAuth } from './AdminAuthContext';
import {
  DEFAULT_MISSION_CONTENT,
  type LocaleText,
  type MissionPageContent,
} from '@/lib/missionPageContent';

function cloneDefault(): MissionPageContent {
  return structuredClone(DEFAULT_MISSION_CONTENT);
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

export default function MissionPageEditor() {
  const { setSubtitle } = useAdminChrome();
  const { logout } = useAdminAuth();
  const [data, setData] = useState<MissionPageContent | null>(null);
  const [openHeader, setOpenHeader] = useState(true);
  const [openFocus, setOpenFocus] = useState(true);
  const [openCards, setOpenCards] = useState<Record<number, boolean>>({ 0: true, 1: true });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSubtitle('编辑页头、聚焦与项目卡片（可本地选图替换）；时间轴请到「时间轴」模块');
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/pages/mission', { credentials: 'include', cache: 'no-store' });
        const j = await res.json().catch(() => ({}));
        if (!mounted) return;
        if (!res.ok) throw new Error(j?.error || `HTTP ${res.status}`);
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
      const res = await fetch('/api/pages/mission', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ mode, content: data }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.status === 401) {
        await logout();
        throw new Error(j?.error || '登录已过期，请重新登录');
      }
      if (!res.ok) throw new Error(j?.error || `HTTP ${res.status}`);
      setMessage(mode === 'draft' ? '草稿已保存（仅后台可见）' : '已发布，前台实力见证页已更新');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const patchLocale = (
    path: (draft: MissionPageContent) => LocaleText,
    lang: keyof LocaleText,
    value: string
  ) => {
    setData((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      path(next)[lang] = value;
      return next;
    });
  };

  const patchCardImage = (index: number, value: string) => {
    setData((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      next.focus.cards[index].image = value;
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
        <Link href="/admin/timeline" className="text-sm text-[#0E2745] hover:underline ml-1">
          编辑时间轴 →
        </Link>
        {message && <span className="text-sm text-emerald-700">{message}</span>}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>

      <section>
        <h2 className="text-base font-semibold text-[#0E2745] mb-3">页头</h2>
        <ul className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <AccordionItem name="标题与副标题" open={openHeader} onToggle={() => setOpenHeader((v) => !v)}>
            <BilingualField
              label="主标题"
              zh={data.header.title.zh}
              en={data.header.title.en}
              onZhChange={(v) => patchLocale((d) => d.header.title, 'zh', v)}
              onEnChange={(v) => patchLocale((d) => d.header.title, 'en', v)}
            />
            <BilingualField
              label="副标题"
              zh={data.header.subtitle.zh}
              en={data.header.subtitle.en}
              onZhChange={(v) => patchLocale((d) => d.header.subtitle, 'zh', v)}
              onEnChange={(v) => patchLocale((d) => d.header.subtitle, 'en', v)}
            />
          </AccordionItem>
        </ul>
      </section>

      <section>
        <h2 className="text-base font-semibold text-[#0E2745] mb-3">聚焦文案</h2>
        <ul className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <AccordionItem name="聚焦标签与正文" open={openFocus} onToggle={() => setOpenFocus((v) => !v)}>
            <BilingualField
              label="聚焦标签"
              zh={data.focus.label.zh}
              en={data.focus.label.en}
              onZhChange={(v) => patchLocale((d) => d.focus.label, 'zh', v)}
              onEnChange={(v) => patchLocale((d) => d.focus.label, 'en', v)}
            />
            <BilingualField
              label="正文"
              zh={data.focus.body.zh}
              en={data.focus.body.en}
              multiline
              onZhChange={(v) => patchLocale((d) => d.focus.body, 'zh', v)}
              onEnChange={(v) => patchLocale((d) => d.focus.body, 'en', v)}
            />
          </AccordionItem>
        </ul>
      </section>

      <section>
        <h2 className="text-base font-semibold text-[#0E2745] mb-3">项目卡片</h2>
        <ul className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          {data.focus.cards.map((card, i) => {
            const open = !!openCards[i];
            const name = card.title.zh?.trim() || `卡片 ${i + 1}`;
            return (
              <AccordionItem
                key={i}
                name={name}
                open={open}
                onToggle={() => setOpenCards((prev) => ({ ...prev, [i]: !prev[i] }))}
              >
                <ImageReplaceField
                  label="项目图片"
                  value={card.image}
                  slot={`pages/mission/card-${i}`}
                  onChange={(url) => patchCardImage(i, url)}
                />
                <BilingualField
                  label="标题"
                  zh={card.title.zh}
                  en={card.title.en}
                  onZhChange={(v) =>
                    setData((prev) => {
                      if (!prev) return prev;
                      const next = structuredClone(prev);
                      next.focus.cards[i].title.zh = v;
                      return next;
                    })
                  }
                  onEnChange={(v) =>
                    setData((prev) => {
                      if (!prev) return prev;
                      const next = structuredClone(prev);
                      next.focus.cards[i].title.en = v;
                      return next;
                    })
                  }
                />
                <BilingualField
                  label="说明"
                  zh={card.caption.zh}
                  en={card.caption.en}
                  multiline
                  onZhChange={(v) =>
                    setData((prev) => {
                      if (!prev) return prev;
                      const next = structuredClone(prev);
                      next.focus.cards[i].caption.zh = v;
                      return next;
                    })
                  }
                  onEnChange={(v) =>
                    setData((prev) => {
                      if (!prev) return prev;
                      const next = structuredClone(prev);
                      next.focus.cards[i].caption.en = v;
                      return next;
                    })
                  }
                />
              </AccordionItem>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
