'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import SearchBar from './SearchBar';
import DataTable, { type DataTableColumn } from './DataTable';
import AdminPagination from './AdminPagination';
import { useAdminChrome } from './AdminChromeContext';
import { useAdminAuth } from './AdminAuthContext';
import { useAdminMessage } from './AdminMessage';
import type { NewsArticle } from '@/lib/newsContent';

const PAGE_SIZE = 10;

function formatUpdatedAt(iso?: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function NewsListPage() {
  const router = useRouter();
  const { setSubtitle } = useAdminChrome();
  const { logout } = useAdminAuth();
  const message = useAdminMessage();
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/news?all=1', { credentials: 'include', cache: 'no-store' });
      const j = await res.json().catch(() => ({}));
      if (res.status === 401) {
        await logout({ reason: 'expired' });
        throw new Error(j?.error || '登录已过期');
      }
      if (!res.ok) throw new Error(j?.error || '操作失败，请稍后重试');
      setRows(Array.isArray(j.items) ? j.items : []);
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : '加载失败');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [logout, message]);

  const [hasLocalDraft, setHasLocalDraft] = useState(false);

  useEffect(() => {
    try {
      setHasLocalDraft(!!localStorage.getItem('newsLocalDraft'));
    } catch {
      setHasLocalDraft(false);
    }
  }, []);

  useEffect(() => {
    setSubtitle('新闻列表：新建可先暂存，点发布后才会在网站显示；删除后网站将不再展示');
    void load();
    return () => setSubtitle(null);
  }, [setSubtitle, load]);

  const discardLocalDraft = () => {
    try {
      localStorage.removeItem('newsLocalDraft');
    } catch {
      /* ignore */
    }
    setHasLocalDraft(false);
    void fetch('/api/upload/cleanup-slot', {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ slot: 'news/local-draft/cover' }),
    }).catch(() => {
      /* ignore storage cleanup errors */
    });
    message.info('已丢弃本地草稿');
  };

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (row) =>
        row.title_zh.toLowerCase().includes(q) ||
        row.title_en.toLowerCase().includes(q) ||
        row.id.toLowerCase().includes(q)
    );
  }, [rows, keyword]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, safePage]);

  useEffect(() => {
    setPage(1);
  }, [keyword]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const handleCreate = () => {
    router.push('/admin/news/new');
  };

  const handleDelete = async (row: NewsArticle) => {
    if (!window.confirm(`确定删除「${row.title_zh || row.title_en || row.id}」？删除后网站将不再展示。`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/news/${row.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const j = await res.json().catch(() => ({}));
      if (res.status === 401) {
        await logout({ reason: 'expired' });
        throw new Error(j?.error || '登录已过期');
      }
      if (!res.ok) throw new Error(j?.error || '操作失败，请稍后重试');
      message.success('已删除');
      // 先弹提示再刷新列表：避免某些情况下 load 触发重渲染后用户看不到 toast
      await load();
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : '删除失败');
    } finally {
      setBusy(false);
    }
  };

  const handleMove = async (row: NewsArticle, direction: 'up' | 'down') => {
    const target = row.sort_order + (direction === 'up' ? -1 : 1);
    if (target < 1 || target > rows.length) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/news/${row.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sort_order: target }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.status === 401) {
        await logout({ reason: 'expired' });
        throw new Error(j?.error || '登录已过期');
      }
      if (!res.ok) throw new Error(j?.error || '操作失败，请稍后重试');
      message.success('顺序已更新');
      await load();
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : '调整顺序失败');
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
      key: 'sort',
      header: '排序',
      className: 'whitespace-nowrap text-gray-600',
      render: (row) => row.sort_order,
    },
    {
      key: 'updatedAt',
      header: '更新时间',
      className: 'whitespace-nowrap text-gray-600',
      render: (row) => formatUpdatedAt(row.updated_at),
    },
    {
      key: 'actions',
      header: '操作',
      className: 'whitespace-nowrap',
      render: (row) => {
        const index = rows.findIndex((r) => r.id === row.id);
        return (
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={busy || index <= 0}
              className="text-[#0E2745] hover:underline text-sm disabled:opacity-30"
              onClick={(e) => {
                e.stopPropagation();
                void handleMove(row, 'up');
              }}
            >
              上移
            </button>
            <button
              type="button"
              disabled={busy || index < 0 || index >= rows.length - 1}
              className="text-[#0E2745] hover:underline text-sm disabled:opacity-30"
              onClick={(e) => {
                e.stopPropagation();
                void handleMove(row, 'down');
              }}
            >
              下移
            </button>
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
        );
      },
    },
  ];

  return (
    <div className="p-6 lg:p-8">
      <SearchBar
        keyword={keyword}
        onKeywordChange={setKeyword}
        onCreate={handleCreate}
        createLabel="新建新闻"
        showStatus={false}
      />
      {hasLocalDraft && (
        <div className="mb-3 flex flex-wrap items-center gap-3 px-3 py-2 rounded-lg bg-amber-50 border border-amber-100 text-sm text-amber-900">
          <span>有未发布的新建草稿</span>
          <button
            type="button"
            className="text-[#0E2745] hover:underline font-medium"
            onClick={() => router.push('/admin/news/new')}
          >
            继续编辑
          </button>
          <button type="button" className="text-red-600 hover:underline" onClick={discardLocalDraft}>
            丢弃草稿
          </button>
        </div>
      )}
      {loading ? (
        <div className="text-sm text-gray-500 py-8">加载中…</div>
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={pageRows}
            rowKey={(row) => row.id}
            onRowClick={(row) => router.push(`/admin/news/${row.id}`)}
            emptyText="没有匹配的新闻"
          />
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-gray-500">
              共 {filtered.length} 条
              {keyword ? `（已筛选，全库 ${rows.length}）` : ''}
              {filtered.length > 0 ? ` · 第 ${safePage}/${totalPages} 页` : ''}
            </p>
            <AdminPagination page={safePage} totalPages={totalPages} onChange={setPage} />
          </div>
        </>
      )}
    </div>
  );
}
