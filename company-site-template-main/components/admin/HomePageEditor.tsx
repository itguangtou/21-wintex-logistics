'use client';

import React, { useEffect, useState } from 'react';
import BilingualField from './BilingualField';
import ImageReplaceField from './ImageReplaceField';
import { useAdminChrome } from './AdminChromeContext';
import { useAdminAuth } from './AdminAuthContext';
import { useAdminMessage } from './AdminMessage';
import {
  DEFAULT_HOME_CONTENT,
  type HomePageContent,
  type LocaleText,
} from '@/lib/homePageContent';

function cloneDefault(): HomePageContent {
  return structuredClone(DEFAULT_HOME_CONTENT);
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

type NewsOption = { id: string; title_zh: string; title_en: string; is_published?: boolean };
type EquipOption = { index: number; image: string; nameZh: string; nameEn: string };

export default function HomePageEditor() {
  const { setSubtitle } = useAdminChrome();
  const { logout } = useAdminAuth();
  const message = useAdminMessage();
  const [data, setData] = useState<HomePageContent | null>(null);
  const [newsOptions, setNewsOptions] = useState<NewsOption[]>([]);
  const [equipOptions, setEquipOptions] = useState<EquipOption[]>([]);
  const [openAbout, setOpenAbout] = useState(true);
  const [openNews, setOpenNews] = useState(true);
  const [openStrength, setOpenStrength] = useState(false);
  const [openEquip, setOpenEquip] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSubtitle('首页分区编辑：关于我们 / 新闻（选 4） / 实力见证 / 装备（选 4）');
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const [homeRes, newsRes, equipRes] = await Promise.all([
          fetch('/api/pages/home', { credentials: 'include', cache: 'no-store' }),
          fetch('/api/news', { credentials: 'include', cache: 'no-store' }),
          fetch('/api/pages/equipment', { credentials: 'include', cache: 'no-store' }),
        ]);
        const homeJ = await homeRes.json().catch(() => ({}));
        const newsJ = await newsRes.json().catch(() => ({}));
        const equipJ = await equipRes.json().catch(() => ({}));
        if (!mounted) return;
        if (!homeRes.ok) throw new Error(homeJ?.error || '首页加载失败，请刷新页面');

        setData(homeJ.content ? structuredClone(homeJ.content) : cloneDefault());

        const list: any[] = Array.isArray(newsJ)
          ? newsJ
          : Array.isArray(newsJ?.items)
            ? newsJ.items
            : Array.isArray(newsJ?.news)
              ? newsJ.news
              : [];
        setNewsOptions(
          list
            .filter((n) => n && n.id && n.is_published !== false)
            .map((n) => ({
              id: String(n.id),
              title_zh: String(n.title_zh ?? n.title?.zh ?? n.id),
              title_en: String(n.title_en ?? n.title?.en ?? n.id),
            }))
        );

        const gallery = equipJ?.content?.gallery;
        if (Array.isArray(gallery)) {
          setEquipOptions(
            gallery.map((g: { image?: string; name?: { zh?: string; en?: string } }, i: number) => ({
              index: i,
              image: String(g.image ?? ''),
              nameZh: String(g.name?.zh ?? `装备 ${i + 1}`),
              nameEn: String(g.name?.en ?? `Equipment ${i + 1}`),
            }))
          );
        } else {
          setEquipOptions([
            { index: 0, image: '/images/equipment_1.jpg', nameZh: '装备 1', nameEn: 'Equipment 1' },
            { index: 1, image: '/images/equipment_2.jpg', nameZh: '装备 2', nameEn: 'Equipment 2' },
            { index: 2, image: '/images/equipment_3.jpg', nameZh: '装备 3', nameEn: 'Equipment 3' },
            { index: 3, image: '/images/equipment_4.jpg', nameZh: '装备 4', nameEn: 'Equipment 4' },
          ]);
        }
      } catch (e: unknown) {
        if (!mounted) return;
        setData(cloneDefault());
        message.warning(e instanceof Error ? e.message : '加载失败，已使用默认内容');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
      setSubtitle(null);
    };
  }, [setSubtitle, message]);

  const save = async (mode: 'draft' | 'publish') => {
    if (!data) return;
    if (new Set(data.news.featuredIds).size !== 4) {
      message.warning('新闻区必须选择 4 条互不重复的新闻');
      return;
    }
    if (new Set(data.equipment.featuredIndices).size !== 4) {
      message.warning('装备区必须选择 4 项互不重复的装备');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/pages/home', {
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
      message.success(mode === 'draft' ? '草稿已保存' : '已发布，网站已更新');
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const patchTeaser = (
    key: 'about' | 'strength',
    field: 'title' | 'subtitle' | 'desc' | 'ctaLabel' | 'image',
    lang: keyof LocaleText | null,
    value: string
  ) => {
    setData((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      if (field === 'image') {
        next[key].image = value;
      } else if (lang) {
        next[key][field][lang] = value;
      }
      return next;
    });
  };

  const setNewsId = (slot: number, id: string) => {
    setData((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      next.news.featuredIds[slot] = id;
      return next;
    });
  };

  const setEquipIndex = (slot: number, index: number) => {
    setData((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      next.equipment.featuredIndices[slot] = index;
      return next;
    });
  };

  if (loading || !data) {
    return <div className="p-8 text-sm text-gray-500">加载中…</div>;
  }

  const newsDup = new Set(data.news.featuredIds).size !== 4;
  const equipDup = new Set(data.equipment.featuredIndices).size !== 4;

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
      </div>

      <ul className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <AccordionItem name="关于我们区块" open={openAbout} onToggle={() => setOpenAbout((v) => !v)}>
          <BilingualField
            label="标题"
            zh={data.about.title.zh}
            en={data.about.title.en}
            onZhChange={(v) => patchTeaser('about', 'title', 'zh', v)}
            onEnChange={(v) => patchTeaser('about', 'title', 'en', v)}
          />
          <BilingualField
            label="副标题"
            zh={data.about.subtitle.zh}
            en={data.about.subtitle.en}
            onZhChange={(v) => patchTeaser('about', 'subtitle', 'zh', v)}
            onEnChange={(v) => patchTeaser('about', 'subtitle', 'en', v)}
          />
          <BilingualField
            label="正文"
            zh={data.about.desc.zh}
            en={data.about.desc.en}
            multiline
            rows={4}
            onZhChange={(v) => patchTeaser('about', 'desc', 'zh', v)}
            onEnChange={(v) => patchTeaser('about', 'desc', 'en', v)}
          />
          <BilingualField
            label="按钮文案"
            zh={data.about.ctaLabel.zh}
            en={data.about.ctaLabel.en}
            onZhChange={(v) => patchTeaser('about', 'ctaLabel', 'zh', v)}
            onEnChange={(v) => patchTeaser('about', 'ctaLabel', 'en', v)}
          />
          <ImageReplaceField
            label="配图"
            value={data.about.image}
            slot="pages/home/about"
            onChange={(url) => patchTeaser('about', 'image', null, url)}
          />
        </AccordionItem>

        <AccordionItem name="新闻区块（固定选 4 条）" open={openNews} onToggle={() => setOpenNews((v) => !v)}>
          <BilingualField
            label="区块标题"
            zh={data.news.sectionTitle.zh}
            en={data.news.sectionTitle.en}
            onZhChange={(v) =>
              setData((prev) => {
                if (!prev) return prev;
                const next = structuredClone(prev);
                next.news.sectionTitle.zh = v;
                return next;
              })
            }
            onEnChange={(v) =>
              setData((prev) => {
                if (!prev) return prev;
                const next = structuredClone(prev);
                next.news.sectionTitle.en = v;
                return next;
              })
            }
          />
          <BilingualField
            label="「全部新闻」按钮"
            zh={data.news.allNewsLabel.zh}
            en={data.news.allNewsLabel.en}
            onZhChange={(v) =>
              setData((prev) => {
                if (!prev) return prev;
                const next = structuredClone(prev);
                next.news.allNewsLabel.zh = v;
                return next;
              })
            }
            onEnChange={(v) =>
              setData((prev) => {
                if (!prev) return prev;
                const next = structuredClone(prev);
                next.news.allNewsLabel.en = v;
                return next;
              })
            }
          />
          <p className="text-xs text-gray-500">从已发布新闻中各选 1 条，共 4 条，不可重复。</p>
          {newsDup && <p className="text-xs text-red-600">当前选择有重复，请调整为 4 条不同新闻。</p>}
          <div className="grid gap-3">
            {data.news.featuredIds.map((id, slot) => (
              <label key={slot} className="grid gap-1">
                <span className="text-xs text-gray-500">第 {slot + 1} 条</span>
                <select
                  className="border rounded-lg px-3 py-2 text-sm w-full outline-none focus:border-[#0E2745]"
                  value={id}
                  onChange={(e) => setNewsId(slot, e.target.value)}
                >
                  {newsOptions.length === 0 && <option value={id}>{id}</option>}
                  {newsOptions.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.title_zh} / {n.title_en}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </AccordionItem>

        <AccordionItem
          name="实力见证区块"
          open={openStrength}
          onToggle={() => setOpenStrength((v) => !v)}
        >
          <BilingualField
            label="标题"
            zh={data.strength.title.zh}
            en={data.strength.title.en}
            onZhChange={(v) => patchTeaser('strength', 'title', 'zh', v)}
            onEnChange={(v) => patchTeaser('strength', 'title', 'en', v)}
          />
          <BilingualField
            label="副标题"
            zh={data.strength.subtitle.zh}
            en={data.strength.subtitle.en}
            onZhChange={(v) => patchTeaser('strength', 'subtitle', 'zh', v)}
            onEnChange={(v) => patchTeaser('strength', 'subtitle', 'en', v)}
          />
          <BilingualField
            label="正文"
            zh={data.strength.desc.zh}
            en={data.strength.desc.en}
            multiline
            rows={4}
            onZhChange={(v) => patchTeaser('strength', 'desc', 'zh', v)}
            onEnChange={(v) => patchTeaser('strength', 'desc', 'en', v)}
          />
          <BilingualField
            label="按钮文案"
            zh={data.strength.ctaLabel.zh}
            en={data.strength.ctaLabel.en}
            onZhChange={(v) => patchTeaser('strength', 'ctaLabel', 'zh', v)}
            onEnChange={(v) => patchTeaser('strength', 'ctaLabel', 'en', v)}
          />
          <ImageReplaceField
            label="配图"
            value={data.strength.image}
            slot="pages/home/strength"
            onChange={(url) => patchTeaser('strength', 'image', null, url)}
          />
        </AccordionItem>

        <AccordionItem
          name="装备清单区块（固定选 4 项）"
          open={openEquip}
          onToggle={() => setOpenEquip((v) => !v)}
        >
          <BilingualField
            label="区块标题"
            zh={data.equipment.sectionTitle.zh}
            en={data.equipment.sectionTitle.en}
            onZhChange={(v) =>
              setData((prev) => {
                if (!prev) return prev;
                const next = structuredClone(prev);
                next.equipment.sectionTitle.zh = v;
                return next;
              })
            }
            onEnChange={(v) =>
              setData((prev) => {
                if (!prev) return prev;
                const next = structuredClone(prev);
                next.equipment.sectionTitle.en = v;
                return next;
              })
            }
          />
          <BilingualField
            label="「阅读更多」按钮"
            zh={data.equipment.ctaLabel.zh}
            en={data.equipment.ctaLabel.en}
            onZhChange={(v) =>
              setData((prev) => {
                if (!prev) return prev;
                const next = structuredClone(prev);
                next.equipment.ctaLabel.zh = v;
                return next;
              })
            }
            onEnChange={(v) =>
              setData((prev) => {
                if (!prev) return prev;
                const next = structuredClone(prev);
                next.equipment.ctaLabel.en = v;
                return next;
              })
            }
          />
          <p className="text-xs text-gray-500">
            从装备清单页顶部图库（4 项）中选择展示顺序，必须 4 项且不重复。名称与图片随装备页更新。
          </p>
          {equipDup && <p className="text-xs text-red-600">当前选择有重复，请调整为 4 项不同装备。</p>}
          <div className="grid gap-3">
            {data.equipment.featuredIndices.map((idx, slot) => (
              <label key={slot} className="grid gap-1">
                <span className="text-xs text-gray-500">第 {slot + 1} 项</span>
                <select
                  className="border rounded-lg px-3 py-2 text-sm w-full outline-none focus:border-[#0E2745]"
                  value={idx}
                  onChange={(e) => setEquipIndex(slot, Number(e.target.value))}
                >
                  {equipOptions.map((eq) => (
                    <option key={eq.index} value={eq.index}>
                      {eq.nameZh} / {eq.nameEn}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </AccordionItem>
      </ul>
    </div>
  );
}
