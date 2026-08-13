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

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];
const PAGE_SIZE_KEY = 'adminNewsPageSize';

function formatUpdatedAt(iso?: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function readStoredPageSize(): number {
  try {
    const n = Number(localStorage.getItem(PAGE_SIZE_KEY));
    if (PAGE_SIZE_OPTIONS.includes(n)) return n;
  } catch {
    /* ignore */
  }
  return 10;
}

export default function NewsListPage() {
  const router = useRouter();
  const { setSubtitle } = useAdminChrome();
  const { logout } = useAdminAuth();
  const message = useAdminMessage();
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [rows, setRows] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setPageSize(readStoredPageSize());
  }, []);

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

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [keyword, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    try {
      localStorage.setItem(PAGE_SIZE_KEY, String(size));
    } catch {
      /* ignore */
    }
  };

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
    <div className="box-border flex flex-col overflow-hidden px-6 lg:px-8 pt-6 lg:pt-8 pb-4 h-[calc(100dvh-8.5rem)] max-md:h-[calc(100dvh-11rem)]">
      <div className="shrink-0">
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
      </div>

      {loading ? (
        <div className="flex-1 min-h-0 flex items-center justify-center text-sm text-gray-500">加载中…</div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col gap-3 mb-3">
          <div className="flex-1 min-h-0">
            <DataTable
              fillHeight
              columns={columns}
              rows={pageRows}
              rowKey={(row) => row.id}
              onRowClick={(row) => router.push(`/admin/news/${row.id}`)}
              emptyText="没有匹配的新闻"
            />
          </div>
          <div className="shrink-0 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-gray-500">
              共 {filtered.length} 条
              {keyword ? `（已筛选，全库 ${rows.length}）` : ''}
              {filtered.length > 0 ? ` · 第 ${safePage}/${totalPages} 页` : ''}
            </p>
            <AdminPagination
              page={safePage}
              totalPages={totalPages}
              onChange={setPage}
              pageSize={pageSize}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
              onPageSizeChange={handlePageSizeChange}
            />
          </div>
        </div>
      )}
    </div>
  );
}
