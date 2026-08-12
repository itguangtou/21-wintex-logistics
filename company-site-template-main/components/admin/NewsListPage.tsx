'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import SearchBar, { type StatusFilter } from './SearchBar';
import DataTable, { type DataTableColumn } from './DataTable';
import { useAdminChrome } from './AdminChromeContext';
import { useAdminAuth } from './AdminAuthContext';
import type { NewsArticle } from '@/lib/newsContent';

function formatUpdatedAt(iso?: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function StatusBadge({ published }: { published: boolean }) {
  if (published) {
    return (
      <span className="inline-flex px-2 py-0.5 rounded text-xs bg-emerald-50 text-emerald-700 border border-emerald-100">
        已发布
      </span>
    );
  }
  return (
    <span className="inline-flex px-2 py-0.5 rounded text-xs bg-amber-50 text-amber-700 border border-amber-100">
      草稿
    </span>
  );
}

export default function NewsListPage() {
  const router = useRouter();
  const { setSubtitle } = useAdminChrome();
  const { logout } = useAdminAuth();
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [rows, setRows] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/news?all=1', { credentials: 'include', cache: 'no-store' });
      const j = await res.json().catch(() => ({}));
      if (res.status === 401) {
        await logout();
        throw new Error(j?.error || '登录已过期');
      }
      if (!res.ok) throw new Error(j?.error || `HTTP ${res.status}`);
      setRows(Array.isArray(j.items) ? j.items : []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '加载失败');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    setSubtitle('新闻列表：新建 / 编辑 / 发布；前台为服务端渲染');
    void load();
    return () => setSubtitle(null);
  }, [setSubtitle, load]);

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return rows.filter((row) => {
      if (status === 'published' && !row.is_published) return false;
      if (status === 'draft' && row.is_published) return false;
      if (!q) return true;
      return (
        row.title_zh.toLowerCase().includes(q) ||
        row.title_en.toLowerCase().includes(q) ||
        row.id.toLowerCase().includes(q)
      );
    });
  }, [rows, keyword, status]);

  const handleCreate = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/news', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title_zh: '新新闻',
          title_en: 'New Article',
          content_zh: '',
          content_en: '',
          image_url: '/news4.png',
          is_published: false,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.status === 401) {
        await logout();
        throw new Error(j?.error || '登录已过期');
      }
      if (!res.ok) throw new Error(j?.error || `HTTP ${res.status}`);
      const id = j?.item?.id;
      if (!id) throw new Error('未返回 id');
      router.push(`/admin/news/${id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '新建失败');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (row: NewsArticle) => {
    if (!window.confirm(`确定删除「${row.title_zh || row.title_en || row.id}」？`)) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/news/${row.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const j = await res.json().catch(() => ({}));
      if (res.status === 401) {
        await logout();
        throw new Error(j?.error || '登录已过期');
      }
      if (!res.ok) throw new Error(j?.error || `HTTP ${res.status}`);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '删除失败');
    } finally {
      setBusy(false);
    }
  };

  const columns: DataTableColumn<NewsArticle>[] = [
    {
      key: 'title',
      header: '标题',
      render: (row) => (
        <div className="min-w-[220px]">
          <div className="font-medium text-gray-900">{row.title_zh || '—'}</div>
          <div className="text-xs text-gray-400 mt-0.5">{row.title_en || '—'}</div>
        </div>
      ),
    },
    {
      key: 'updatedAt',
      header: '更新时间',
      className: 'whitespace-nowrap text-gray-600',
      render: (row) => formatUpdatedAt(row.updated_at),
    },
    {
      key: 'status',
      header: '状态',
      className: 'whitespace-nowrap',
      render: (row) => <StatusBadge published={row.is_published} />,
    },
    {
      key: 'actions',
      header: '操作',
      className: 'whitespace-nowrap',
      render: (row) => (
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="text-[#0E2745] hover:underline text-sm"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/admin/news/${row.id}`);
            }}
          >
            编辑
          </button>
          <button
            type="button"
            disabled={busy}
            className="text-red-600 hover:underline text-sm disabled:opacity-50"
            onClick={(e) => {
              e.stopPropagation();
              void handleDelete(row);
            }}
          >
            删除
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 lg:p-8">
      <SearchBar
        keyword={keyword}
        onKeywordChange={setKeyword}
        status={status}
        onStatusChange={setStatus}
        onCreate={() => void handleCreate()}
        createLabel={busy ? '创建中…' : '新建新闻'}
      />
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      {loading ? (
        <div className="text-sm text-gray-500 py-8">加载中…</div>
      ) : (
        <DataTable
          columns={columns}
          rows={filtered}
          rowKey={(row) => row.id}
          onRowClick={(row) => router.push(`/admin/news/${row.id}`)}
          emptyText="没有匹配的新闻"
        />
      )}
      <p className="mt-3 text-xs text-gray-500">
        共 {filtered.length} 条
        {status !== 'all' || keyword ? `（已筛选，全库 ${rows.length}）` : ''}
      </p>
    </div>
  );
}
