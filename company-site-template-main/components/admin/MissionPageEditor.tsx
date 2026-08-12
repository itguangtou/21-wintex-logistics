'use client';

import React, { useCallback, useEffect, useState } from 'react';
import BilingualField from './BilingualField';
import ImageReplaceField from './ImageReplaceField';
import { useAdminChrome } from './AdminChromeContext';
import { useAdminAuth } from './AdminAuthContext';
import {
  DEFAULT_MISSION_CONTENT,
  type LocaleText,
  type MissionPageContent,
  type TimelineItemRow,
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

type TimelineDraft = {
  year: string;
  project_name_zh: string;
  project_name_en: string;
  description_zh: string;
  description_en: string;
  sort_order: number;
};

function rowToDraft(row: TimelineItemRow): TimelineDraft {
  return {
    year: row.year,
    project_name_zh: row.project_name_zh,
    project_name_en: row.project_name_en,
    description_zh: row.description_zh,
    description_en: row.description_en,
    sort_order: row.sort_order ?? 0,
  };
}

export default function MissionPageEditor() {
  const { setSubtitle } = useAdminChrome();
  const { logout } = useAdminAuth();
  const [data, setData] = useState<MissionPageContent | null>(null);
  const [timeline, setTimeline] = useState<TimelineItemRow[]>([]);
  const [timelineDrafts, setTimelineDrafts] = useState<Record<number, TimelineDraft>>({});
  const [openHeader, setOpenHeader] = useState(true);
  const [openFocus, setOpenFocus] = useState(false);
  const [openCards, setOpenCards] = useState<Record<number, boolean>>({});
  const [openTimeline, setOpenTimeline] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [timelineBusy, setTimelineBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadTimeline = useCallback(async () => {
    const res = await fetch('/api/timeline', { credentials: 'include', cache: 'no-store' });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(j?.error || '时间轴加载失败，请刷新页面');
    const items = (Array.isArray(j.items) ? j.items : []) as TimelineItemRow[];
    setTimeline(items);
    const drafts: Record<number, TimelineDraft> = {};
    for (const row of items) drafts[row.id] = rowToDraft(row);
    setTimelineDrafts(drafts);
  }, []);

  useEffect(() => {
    setSubtitle('按页面顺序编辑：页头 → 时间轴 → 聚焦 → 项目卡片');
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [pageRes] = await Promise.all([
          fetch('/api/pages/mission', { credentials: 'include', cache: 'no-store' }),
          loadTimeline().catch((e) => {
            throw e;
          }),
        ]);
        const j = await pageRes.json().catch(() => ({}));
        if (!mounted) return;
        if (!pageRes.ok) throw new Error(j?.error || '加载失败，请刷新页面');
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
  }, [setSubtitle, loadTimeline]);

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
      if (!res.ok) throw new Error(j?.error || '保存失败，请稍后重试');
      setMessage(mode === 'draft' ? '草稿已保存' : '已发布，网站已更新');
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

  const patchTimelineDraft = (id: number, patch: Partial<TimelineDraft>) => {
    setTimelineDrafts((prev) => {
      const base =
        prev[id] ||
        (() => {
          const row = timeline.find((t) => t.id === id);
          return row
            ? rowToDraft(row)
            : {
                year: '',
                project_name_zh: '',
                project_name_en: '',
                description_zh: '',
                description_en: '',
                sort_order: 0,
              };
        })();
      return { ...prev, [id]: { ...base, ...patch } };
    });
  };

  const saveTimelineItem = async (id: number) => {
    const draft = timelineDrafts[id];
    if (!draft) return;
    if (!draft.year.trim()) {
      setError('年份不能为空');
      return;
    }
    setTimelineBusy(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch(`/api/timeline/${id}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(draft),
      });
      const j = await res.json().catch(() => ({}));
      if (res.status === 401) {
        await logout();
        throw new Error(j?.error || '登录已过期，请重新登录');
      }
      if (!res.ok) throw new Error(j?.error || '保存失败，请稍后重试');
      setMessage('时间轴条目已保存');
      await loadTimeline();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '时间轴保存失败');
    } finally {
      setTimelineBusy(false);
    }
  };

  const addTimelineItem = async () => {
    setTimelineBusy(true);
    setMessage(null);
    setError(null);
    try {
      const maxSort = timeline.reduce((m, r) => Math.max(m, r.sort_order ?? 0), 0);
      const res = await fetch('/api/timeline', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          year: new Date().getFullYear().toString(),
          project_name_zh: '新项目',
          project_name_en: 'New Project',
          description_zh: '',
          description_en: '',
          sort_order: maxSort + 10,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.status === 401) {
        await logout();
        throw new Error(j?.error || '登录已过期，请重新登录');
      }
      if (!res.ok) throw new Error(j?.error || '保存失败，请稍后重试');
      const newId = Number(j?.item?.id);
      setMessage('已新增时间轴条目');
      await loadTimeline();
      if (Number.isFinite(newId) && newId > 0) {
        setOpenTimeline((prev) => ({ ...prev, [newId]: true }));
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '新增失败');
    } finally {
      setTimelineBusy(false);
    }
  };

  const moveTimelineItem = async (id: number, direction: 'up' | 'down') => {
    const idx = timeline.findIndex((r) => r.id === id);
    if (idx < 0) return;
    const swapWith = direction === 'up' ? idx - 1 : idx + 1;
    if (swapWith < 0 || swapWith >= timeline.length) return;

    const ordered = timeline.map((r) => r.id);
    const tmp = ordered[idx];
    ordered[idx] = ordered[swapWith];
    ordered[swapWith] = tmp;

    setTimelineBusy(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch('/api/timeline/reorder', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ orderedIds: ordered }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.status === 401) {
        await logout();
        throw new Error(j?.error || '登录已过期，请重新登录');
      }
      if (!res.ok) throw new Error(j?.error || '保存失败，请稍后重试');
      setMessage('顺序已更新');
      await loadTimeline();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '调整顺序失败');
    } finally {
      setTimelineBusy(false);
    }
  };

  const deleteTimelineItem = async (row: TimelineItemRow) => {
    if (row.id <= 0) {
      setError('示例数据不可删除');
      return;
    }
    if (!window.confirm(`确定删除「${row.year} · ${row.project_name_zh || row.project_name_en}」？`)) {
      return;
    }
    setTimelineBusy(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch(`/api/timeline/${row.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const j = await res.json().catch(() => ({}));
      if (res.status === 401) {
        await logout();
        throw new Error(j?.error || '登录已过期，请重新登录');
      }
      if (!res.ok) throw new Error(j?.error || '保存失败，请稍后重试');
      setMessage('已删除时间轴条目');
      await loadTimeline();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '删除失败');
    } finally {
      setTimelineBusy(false);
    }
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
        <span className="text-xs text-gray-400">时间轴条目单独保存，立即生效</span>
        {message && <span className="text-sm text-emerald-700">{message}</span>}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>

      {/* 1. 页头 */}
      <section>
        <h2 className="text-base font-semibold text-[#0E2745] mb-3">1. 页头</h2>
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

      {/* 2. 时间轴 */}
      <section>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <h2 className="text-base font-semibold text-[#0E2745]">2. 时间轴</h2>
          <button
            type="button"
            disabled={timelineBusy}
            onClick={() => void addTimelineItem()}
            className="h-9 px-3 rounded-lg bg-[#0E2745] text-white text-sm hover:bg-[#163a5f] disabled:opacity-50"
          >
            新增条目
          </button>
        </div>
        <ul className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          {timeline.length === 0 ? (
            <li className="px-4 py-10 text-center text-sm text-gray-400">暂无条目，点击「新增条目」</li>
          ) : (
            timeline.map((row, index) => {
              const draft = timelineDrafts[row.id] || rowToDraft(row);
              const open = !!openTimeline[row.id];
              const name = `${row.year} · ${row.project_name_zh || row.project_name_en || '未命名'}`;
              return (
                <AccordionItem
                  key={row.id}
                  name={name}
                  open={open}
                  onToggle={() => setOpenTimeline((prev) => ({ ...prev, [row.id]: !prev[row.id] }))}
                  actions={
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={timelineBusy || index === 0}
                        className="text-sm text-[#0E2745] hover:underline disabled:opacity-30"
                        title="上移"
                        onClick={(e) => {
                          e.stopPropagation();
                          void moveTimelineItem(row.id, 'up');
                        }}
                      >
                        上移
                      </button>
                      <button
                        type="button"
                        disabled={timelineBusy || index === timeline.length - 1}
                        className="text-sm text-[#0E2745] hover:underline disabled:opacity-30"
                        title="下移"
                        onClick={(e) => {
                          e.stopPropagation();
                          void moveTimelineItem(row.id, 'down');
                        }}
                      >
                        下移
                      </button>
                      <button
                        type="button"
                        disabled={timelineBusy}
                        className="text-sm text-red-600 hover:underline disabled:opacity-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          void deleteTimelineItem(row);
                        }}
                      >
                        删除
                      </button>
                    </div>
                  }
                >
                  <label className="grid gap-1 max-w-xs">
                    <span className="text-sm font-medium text-gray-700">年份</span>
                    <input
                      className="border rounded-lg px-3 py-2 text-sm outline-none focus:border-[#0E2745] focus:ring-2 focus:ring-[#0E2745]/15"
                      value={draft.year}
                      onChange={(e) => patchTimelineDraft(row.id, { year: e.target.value })}
                    />
                  </label>
                  <p className="text-xs text-gray-500">列表顺序即网站展示顺序，请用右侧「上移 / 下移」调整</p>
                  <BilingualField
                    label="项目名称"
                    zh={draft.project_name_zh}
                    en={draft.project_name_en}
                    onZhChange={(v) => patchTimelineDraft(row.id, { project_name_zh: v })}
                    onEnChange={(v) => patchTimelineDraft(row.id, { project_name_en: v })}
                  />
                  <BilingualField
                    label="描述"
                    zh={draft.description_zh}
                    en={draft.description_en}
                    multiline
                    onZhChange={(v) => patchTimelineDraft(row.id, { description_zh: v })}
                    onEnChange={(v) => patchTimelineDraft(row.id, { description_en: v })}
                  />
                  <button
                    type="button"
                    disabled={timelineBusy}
                    onClick={() => void saveTimelineItem(row.id)}
                    className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm hover:bg-gray-50 disabled:opacity-50"
                  >
                    保存本条
                  </button>
                </AccordionItem>
              );
            })
          )}
        </ul>
      </section>

      {/* 3. 聚焦 */}
      <section>
        <h2 className="text-base font-semibold text-[#0E2745] mb-3">3. 聚焦文案</h2>
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

      {/* 4. 项目卡片 */}
      <section>
        <h2 className="text-base font-semibold text-[#0E2745] mb-3">4. 项目卡片</h2>
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
