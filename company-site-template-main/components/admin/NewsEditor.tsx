'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import BilingualField from './BilingualField';
import ImageReplaceField from './ImageReplaceField';
import { useAdminChrome } from './AdminChromeContext';
import { useAdminAuth } from './AdminAuthContext';
import type { NewsArticle } from '@/lib/newsContent';

const LOCAL_DRAFT_KEY = 'newsLocalDraft';

type Draft = {
  title_zh: string;
  title_en: string;
  content_zh: string;
  content_en: string;
  image_url: string;
  published_at: string;
  sort_order: number;
};

function todayYmd() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function emptyNewDraft(sortMax: number): Draft {
  return {
    title_zh: '',
    title_en: '',
    content_zh: '',
    content_en: '',
    image_url: '',
    published_at: todayYmd(),
    sort_order: Math.max(1, sortMax),
  };
}

function fromArticle(a: NewsArticle): Draft {
  return {
    title_zh: a.title_zh,
    title_en: a.title_en,
    content_zh: a.content_zh,
    content_en: a.content_en,
    image_url: a.image_url,
    published_at: a.published_at || '',
    sort_order: a.sort_order ?? 0,
  };
}

function clampSort(value: number, max: number): number {
  const n = Math.max(1, max);
  if (!Number.isFinite(value)) return 1;
  return Math.min(n, Math.max(1, Math.trunc(value)));
}

function readLocalDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(LOCAL_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Draft;
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeLocalDraft(draft: Draft) {
  try {
    localStorage.setItem(LOCAL_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    /* ignore quota */
  }
}

function clearLocalDraft() {
  try {
    localStorage.removeItem(LOCAL_DRAFT_KEY);
  } catch {
    /* ignore */
  }
}

export default function NewsEditor() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { setSubtitle } = useAdminChrome();
  const { logout } = useAdminAuth();
  const id = params?.id || '';
  const isNew = id === 'new';

  const [draft, setDraft] = useState<Draft>(emptyNewDraft(1));
  const [sortMax, setSortMax] = useState(1);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const draftRef = useRef(draft);
  draftRef.current = draft;

  useEffect(() => {
    setSubtitle(isNew ? '新建新闻（未发布前仅保存在本地草稿）' : `编辑新闻 · ${id}`);
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        if (isNew) {
          // 新建才需要列表计数，避免编辑页多打一次 ?all=1
          const listRes = await fetch('/api/news?all=1', {
            credentials: 'include',
            cache: 'no-store',
          });
          const list = await listRes.json().catch(() => ({}));
          if (!mounted) return;
          if (listRes.status === 401) {
            await logout();
            throw new Error(list?.error || '登录已过期');
          }
          const count = Array.isArray(list?.items) ? list.items.length : 0;
          const max = count + 1;
          setSortMax(max);
          const local = readLocalDraft();
          if (local) {
            setDraft({
              ...emptyNewDraft(max),
              ...local,
              sort_order: clampSort(local.sort_order || max, max),
              published_at: local.published_at || todayYmd(),
            });
          } else {
            setDraft(emptyNewDraft(max));
          }
        } else {
          const detailRes = await fetch(`/api/news/${id}`, {
            credentials: 'include',
            cache: 'no-store',
          });
          const detail = await detailRes.json().catch(() => ({}));
          if (!mounted) return;
          if (detailRes.status === 401) {
            await logout();
            throw new Error(detail?.error || '登录已过期');
          }
          if (!detailRes.ok) throw new Error(detail?.error || '加载失败，请刷新页面');
          if (detail?.item) {
            const next = fromArticle(detail.item);
            const max = Math.max(1, next.sort_order, 20);
            setSortMax(max);
            next.sort_order = clampSort(next.sort_order, max);
            setDraft(next);
          }
        }
      } catch (e: unknown) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : '加载失败');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
      setSubtitle(null);
    };
  }, [id, isNew, setSubtitle, logout]);

  // 新建：内容变更时同步到本地，返回列表也不丢
  useEffect(() => {
    if (!isNew || loading) return;
    writeLocalDraft(draft);
  }, [draft, isNew, loading]);

  const goBack = useCallback(() => {
    if (isNew) {
      writeLocalDraft(draftRef.current);
      setMessage('已保存到本地草稿（尚未发布到网站）');
    }
    router.push('/admin/news');
  }, [isNew, router]);

  const publish = async () => {
    setPublishing(true);
    setMessage(null);
    setError(null);
    try {
      const sort_order = clampSort(draft.sort_order, sortMax);
      const body = {
        ...draft,
        sort_order,
        published_at: draft.published_at || null,
        is_published: true,
      };

      if (isNew) {
        const res = await fetch('/api/news', {
          method: 'POST',
          credentials: 'include',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
        });
        const j = await res.json().catch(() => ({}));
        if (res.status === 401) {
          await logout();
          throw new Error(j?.error || '登录已过期，请重新登录');
        }
        if (!res.ok) throw new Error(j?.error || '保存失败，请稍后重试');
        const newId = j?.item?.id;
        if (!newId) throw new Error('发布失败，请稍后重试');
        clearLocalDraft();
        setMessage('已发布到网站');
        router.replace(`/admin/news/${newId}`);
        return;
      }

      const res = await fetch(`/api/news/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      const j = await res.json().catch(() => ({}));
      if (res.status === 401) {
        await logout();
        throw new Error(j?.error || '登录已过期，请重新登录');
      }
      if (!res.ok) throw new Error(j?.error || '保存失败，请稍后重试');
      if (j?.item) {
        const next = fromArticle(j.item);
        next.sort_order = clampSort(next.sort_order, sortMax);
        setDraft(next);
      }
      setMessage('已发布，网站已更新');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '发布失败');
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-sm text-gray-500">加载中…</div>;
  }

  const imageSlot = isNew ? 'news/local-draft/cover' : `news/${id}/cover`;

  return (
    <div className="p-6 lg:p-8 max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center gap-3 sticky top-0 z-10 bg-[#F5F7FA] py-3 -mt-2">
        <button
          type="button"
          onClick={goBack}
          className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm hover:bg-gray-50"
        >
          返回列表
        </button>
        <button
          type="button"
          disabled={publishing}
          onClick={() => void publish()}
          className="px-5 py-2 rounded-lg bg-[#0E2745] text-white text-sm font-semibold hover:bg-[#163a5f] disabled:opacity-50"
        >
          {publishing ? '发布中…' : '发布'}
        </button>
        {isNew && (
          <span className="text-xs text-gray-500">未点发布前只保存在本地草稿，不会出现在列表和网站上</span>
        )}
        {message && <span className="text-sm text-emerald-700">{message}</span>}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 md:p-6 space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <label className="grid gap-1">
            <span className="text-sm font-medium text-gray-700">发布日期</span>
            <input
              type="date"
              className="border rounded-lg px-3 py-2 text-sm outline-none focus:border-[#0E2745] focus:ring-2 focus:ring-[#0E2745]/15"
              value={draft.published_at}
              onChange={(e) => setDraft((d) => ({ ...d, published_at: e.target.value }))}
            />
          </label>
          <label className="grid gap-1">
            <span className="text-sm font-medium text-gray-700">
              排序位置（仅允许 1～{sortMax}，1 最前）
            </span>
            <input
              type="number"
              min={1}
              max={sortMax}
              step={1}
              className="border rounded-lg px-3 py-2 text-sm outline-none focus:border-[#0E2745] focus:ring-2 focus:ring-[#0E2745]/15"
              value={draft.sort_order}
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === '') {
                  setDraft((d) => ({ ...d, sort_order: 1 }));
                  return;
                }
                setDraft((d) => ({ ...d, sort_order: clampSort(Number(raw), sortMax) }));
              }}
              onBlur={() =>
                setDraft((d) => ({ ...d, sort_order: clampSort(d.sort_order, sortMax) }))
              }
            />
          </label>
        </div>

        <ImageReplaceField
          label="封面 / 详情图"
          value={draft.image_url}
          slot={imageSlot}
          onChange={(url) => setDraft((d) => ({ ...d, image_url: url }))}
        />

        <BilingualField
          label="标题"
          zh={draft.title_zh}
          en={draft.title_en}
          onZhChange={(v) => setDraft((d) => ({ ...d, title_zh: v }))}
          onEnChange={(v) => setDraft((d) => ({ ...d, title_en: v }))}
        />

        <BilingualField
          label="正文（可用加粗、列表等简单格式）"
          zh={draft.content_zh}
          en={draft.content_en}
          multiline
          stacked
          rows={22}
          minHeightClass="min-h-[420px]"
          onZhChange={(v) => setDraft((d) => ({ ...d, content_zh: v }))}
          onEnChange={(v) => setDraft((d) => ({ ...d, content_en: v }))}
        />
      </div>
    </div>
  );
}
