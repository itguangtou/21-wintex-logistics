'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import BilingualField from './BilingualField';
import ImageReplaceField from './ImageReplaceField';
import { useAdminChrome } from './AdminChromeContext';
import { useAdminAuth } from './AdminAuthContext';
import type { NewsArticle } from '@/lib/newsContent';

type Draft = {
  title_zh: string;
  title_en: string;
  content_zh: string;
  content_en: string;
  image_url: string;
  published_at: string;
  sort_order: number;
};

function emptyDraft(): Draft {
  return {
    title_zh: '',
    title_en: '',
    content_zh: '',
    content_en: '',
    image_url: '',
    published_at: '',
    sort_order: 0,
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

export default function NewsEditor() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { setSubtitle } = useAdminChrome();
  const { logout } = useAdminAuth();
  const id = params?.id || '';

  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSubtitle(`编辑新闻 · ${id}`);
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/news/${id}`, { credentials: 'include', cache: 'no-store' });
        const j = await res.json().catch(() => ({}));
        if (!mounted) return;
        if (!res.ok) throw new Error(j?.error || `HTTP ${res.status}`);
        if (j?.item) setDraft(fromArticle(j.item));
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
  }, [id, setSubtitle]);

  const save = async () => {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const body = {
        ...draft,
        published_at: draft.published_at || null,
        is_published: true,
      };
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
      if (!res.ok) throw new Error(j?.error || `HTTP ${res.status}`);
      if (j?.item) setDraft(fromArticle(j.item));
      setMessage('已保存（前台刷新可见）');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-sm text-gray-500">加载中…</div>;
  }

  return (
    <div className="p-6 lg:p-8 max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center gap-3 sticky top-0 z-10 bg-[#F5F7FA] py-3 -mt-2">
        <button
          type="button"
          onClick={() => router.push('/admin/news')}
          className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm hover:bg-gray-50"
        >
          返回列表
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => void save()}
          className="px-5 py-2 rounded-lg bg-[#0E2745] text-white text-sm font-semibold hover:bg-[#163a5f] disabled:opacity-50"
        >
          {saving ? '保存中…' : '保存'}
        </button>
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
            <span className="text-sm font-medium text-gray-700">排序（越小越靠前，建议 1、2、3…）</span>
            <input
              type="number"
              className="border rounded-lg px-3 py-2 text-sm outline-none focus:border-[#0E2745] focus:ring-2 focus:ring-[#0E2745]/15"
              value={draft.sort_order}
              onChange={(e) => setDraft((d) => ({ ...d, sort_order: Number(e.target.value) || 0 }))}
            />
          </label>
        </div>

        <ImageReplaceField
          label="封面 / 详情图"
          value={draft.image_url}
          slot={`news/${id}/cover`}
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
          label="正文（支持简单 HTML：strong / ul / li）"
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
