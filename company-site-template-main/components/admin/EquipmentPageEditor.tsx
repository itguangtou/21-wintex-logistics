'use client';

import React, { useEffect, useState } from 'react';
import BilingualField from './BilingualField';
import ImageReplaceField from './ImageReplaceField';
import { useAdminChrome } from './AdminChromeContext';
import { useAdminAuth } from './AdminAuthContext';
import {
  DEFAULT_EQUIPMENT_CONTENT,
  type EquipmentPageContent,
  type LocaleText,
} from '@/lib/equipmentPageContent';

function cloneDefault(): EquipmentPageContent {
  return structuredClone(DEFAULT_EQUIPMENT_CONTENT);
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

export default function EquipmentPageEditor() {
  const { setSubtitle } = useAdminChrome();
  const { logout } = useAdminAuth();
  const [data, setData] = useState<EquipmentPageContent | null>(null);
  const [openHeader, setOpenHeader] = useState(false);
  const [openGallery, setOpenGallery] = useState<Record<number, boolean>>({});
  const [openM1R1, setOpenM1R1] = useState<Record<number, boolean>>({});
  const [openM1R2, setOpenM1R2] = useState<Record<number, boolean>>({});
  const [openM2R1, setOpenM2R1] = useState<Record<number, boolean>>({});
  const [openM2R2, setOpenM2R2] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSubtitle('编辑装备图文与说明（固定条目，仅编辑不增删），发布后前台立即更新');
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/pages/equipment', {
          credentials: 'include',
          cache: 'no-store',
        });
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
      const res = await fetch('/api/pages/equipment', {
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
      setMessage(mode === 'draft' ? '草稿已保存（仅后台可见）' : '已发布，前台装备清单页已更新');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const patchTitle = (lang: keyof LocaleText, value: string) => {
    setData((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      next.pageTitle[lang] = value;
      return next;
    });
  };

  const patchGallery = (
    index: number,
    field: 'image' | 'name',
    lang: keyof LocaleText | null,
    value: string
  ) => {
    setData((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      if (field === 'image') {
        next.gallery[index].image = value;
      } else if (lang) {
        next.gallery[index].name[lang] = value;
      }
      return next;
    });
  };

  const patchDetail = (
    module: 'detailModule1' | 'detailModule2',
    row: 'row1' | 'row2',
    index: number,
    field: 'title' | 'desc',
    lang: keyof LocaleText,
    value: string
  ) => {
    setData((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      next[module][row][index][field][lang] = value;
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
        <h2 className="text-base font-semibold text-[#0E2745] mb-3">页头标题</h2>
        <ul className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <AccordionItem
            name={data.pageTitle.zh?.trim() || data.pageTitle.en?.trim() || '页面标题'}
            open={openHeader}
            onToggle={() => setOpenHeader((v) => !v)}
          >
            <BilingualField
              label="页面标题"
              zh={data.pageTitle.zh}
              en={data.pageTitle.en}
              onZhChange={(v) => patchTitle('zh', v)}
              onEnChange={(v) => patchTitle('en', v)}
            />
          </AccordionItem>
        </ul>
      </section>

      <section>
        <h2 className="text-base font-semibold text-[#0E2745] mb-3">顶部图库（4 项）</h2>
        <ul className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          {data.gallery.map((item, i) => {
            const open = !!openGallery[i];
            const name = item.name.zh?.trim() || `图库 ${i + 1}`;
            return (
              <AccordionItem
                key={i}
                name={name}
                open={open}
                onToggle={() => setOpenGallery((p) => ({ ...p, [i]: !p[i] }))}
              >
                <ImageReplaceField
                  label="装备图片"
                  value={item.image}
                  slot={`pages/equipment/gallery-${i}`}
                  onChange={(url) => patchGallery(i, 'image', null, url)}
                />
                <BilingualField
                  label="名称"
                  zh={item.name.zh}
                  en={item.name.en}
                  onZhChange={(v) => patchGallery(i, 'name', 'zh', v)}
                  onEnChange={(v) => patchGallery(i, 'name', 'en', v)}
                />
              </AccordionItem>
            );
          })}
        </ul>
      </section>

      <section>
        <h2 className="text-base font-semibold text-[#0E2745] mb-3">详情模块一 · 第一行（3 项）</h2>
        <ul className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          {data.detailModule1.row1.map((card, i) => (
            <AccordionItem
              key={i}
              name={card.title.zh?.trim() || `卡片 ${i + 1}`}
              open={!!openM1R1[i]}
              onToggle={() => setOpenM1R1((p) => ({ ...p, [i]: !p[i] }))}
            >
              <BilingualField
                label="标题"
                zh={card.title.zh}
                en={card.title.en}
                onZhChange={(v) => patchDetail('detailModule1', 'row1', i, 'title', 'zh', v)}
                onEnChange={(v) => patchDetail('detailModule1', 'row1', i, 'title', 'en', v)}
              />
              <BilingualField
                label="说明"
                zh={card.desc.zh}
                en={card.desc.en}
                multiline
                rows={5}
                onZhChange={(v) => patchDetail('detailModule1', 'row1', i, 'desc', 'zh', v)}
                onEnChange={(v) => patchDetail('detailModule1', 'row1', i, 'desc', 'en', v)}
              />
            </AccordionItem>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-base font-semibold text-[#0E2745] mb-3">详情模块一 · 第二行（2 项）</h2>
        <ul className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          {data.detailModule1.row2.map((card, i) => (
            <AccordionItem
              key={i}
              name={card.title.zh?.trim() || `卡片 ${i + 1}`}
              open={!!openM1R2[i]}
              onToggle={() => setOpenM1R2((p) => ({ ...p, [i]: !p[i] }))}
            >
              <BilingualField
                label="标题"
                zh={card.title.zh}
                en={card.title.en}
                onZhChange={(v) => patchDetail('detailModule1', 'row2', i, 'title', 'zh', v)}
                onEnChange={(v) => patchDetail('detailModule1', 'row2', i, 'title', 'en', v)}
              />
              <BilingualField
                label="说明"
                zh={card.desc.zh}
                en={card.desc.en}
                multiline
                rows={5}
                onZhChange={(v) => patchDetail('detailModule1', 'row2', i, 'desc', 'zh', v)}
                onEnChange={(v) => patchDetail('detailModule1', 'row2', i, 'desc', 'en', v)}
              />
            </AccordionItem>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-base font-semibold text-[#0E2745] mb-3">详情模块二 · 第一行（2 项）</h2>
        <ul className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          {data.detailModule2.row1.map((card, i) => (
            <AccordionItem
              key={i}
              name={card.title.zh?.trim() || `卡片 ${i + 1}`}
              open={!!openM2R1[i]}
              onToggle={() => setOpenM2R1((p) => ({ ...p, [i]: !p[i] }))}
            >
              <BilingualField
                label="标题"
                zh={card.title.zh}
                en={card.title.en}
                onZhChange={(v) => patchDetail('detailModule2', 'row1', i, 'title', 'zh', v)}
                onEnChange={(v) => patchDetail('detailModule2', 'row1', i, 'title', 'en', v)}
              />
              <BilingualField
                label="说明"
                zh={card.desc.zh}
                en={card.desc.en}
                multiline
                rows={5}
                onZhChange={(v) => patchDetail('detailModule2', 'row1', i, 'desc', 'zh', v)}
                onEnChange={(v) => patchDetail('detailModule2', 'row1', i, 'desc', 'en', v)}
              />
            </AccordionItem>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-base font-semibold text-[#0E2745] mb-3">详情模块二 · 第二行（2 项）</h2>
        <ul className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          {data.detailModule2.row2.map((card, i) => (
            <AccordionItem
              key={i}
              name={card.title.zh?.trim() || `卡片 ${i + 1}`}
              open={!!openM2R2[i]}
              onToggle={() => setOpenM2R2((p) => ({ ...p, [i]: !p[i] }))}
            >
              <BilingualField
                label="标题"
                zh={card.title.zh}
                en={card.title.en}
                onZhChange={(v) => patchDetail('detailModule2', 'row2', i, 'title', 'zh', v)}
                onEnChange={(v) => patchDetail('detailModule2', 'row2', i, 'title', 'en', v)}
              />
              <BilingualField
                label="说明"
                zh={card.desc.zh}
                en={card.desc.en}
                multiline
                rows={5}
                onZhChange={(v) => patchDetail('detailModule2', 'row2', i, 'desc', 'zh', v)}
                onEnChange={(v) => patchDetail('detailModule2', 'row2', i, 'desc', 'en', v)}
              />
            </AccordionItem>
          ))}
        </ul>
      </section>
    </div>
  );
}
