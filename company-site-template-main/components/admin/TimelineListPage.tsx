'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import BilingualField from './BilingualField';
import DataTable, { type DataTableColumn } from './DataTable';
import SearchBar from './SearchBar';
import { useAdminChrome } from './AdminChromeContext';
import { useAdminAuth } from './AdminAuthContext';
import { useAdminMessage } from './AdminMessage';
import type { TimelineItemRow } from '@/lib/missionPageContent';

type Draft = {
  year: string;
  project_name_zh: string;
  project_name_en: string;
  description_zh: string;
  description_en: string;
  sort_order: number;
};

const emptyDraft = (): Draft => ({
  year: '',
  project_name_zh: '',
  project_name_en: '',
  description_zh: '',
  description_en: '',
  sort_order: 0,
});

function formatUpdatedAt(iso?: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function TimelineListPage() {
  const { setSubtitle } = useAdminChrome();
  const { logout } = useAdminAuth();
  const message = useAdminMessage();
  const [items, setItems] = useState<TimelineItemRow[]>([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | 'new' | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/timeline', { credentials: 'include', cache: 'no-store' });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || '操作失败，请稍后重试');
      setItems(Array.isArray(j.items) ? j.items : []);
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : '加载失败');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    setSubtitle('增删改时间轴条目；同年多条在网站上合并展示');
    void load();
    return () => setSubtitle(null);
  }, [setSubtitle, load]);

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (row) =>
        row.year.toLowerCase().includes(q) ||
        row.project_name_zh.toLowerCase().includes(q) ||
        row.project_name_en.toLowerCase().includes(q)
    );
  }, [items, keyword]);

  const openCreate = () => {
    const maxSort = items.reduce((m, r) => Math.max(m, r.sort_order ?? 0), 0);
    setEditingId('new');
    setDraft({ ...emptyDraft(), sort_order: maxSort + 10, year: new Date().getFullYear().toString() });
  };

  const openEdit = (row: TimelineItemRow) => {
    setEditingId(row.id);
    setDraft({
      year: row.year,
      project_name_zh: row.project_name_zh,
      project_name_en: row.project_name_en,
      description_zh: row.description_zh,
      description_en: row.description_en,
      sort_order: row.sort_order ?? 0,
    });
  };

  const closeEditor = () => {
    setEditingId(null);
    setDraft(emptyDraft());
  };

  const save = async () => {
    if (!draft.year.trim()) {
      message.warning('年份不能为空');
      return;
    }
    setSaving(true);
    try {
      const isNew = editingId === 'new';
      const url = isNew ? '/api/timeline' : `/api/timeline/${editingId}`;
      const res = await fetch(url, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(draft),
      });
      const j = await res.json().catch(() => ({}));
      if (res.status === 401) {
        await logout({ reason: 'expired' });
        throw new Error(j?.error || '登录已过期，请重新登录');
      }
      if (!res.ok) throw new Error(j?.error || '操作失败，请稍后重试');
      message.success(isNew ? '已新建' : '已保存');
      closeEditor();
      await load();
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row: TimelineItemRow) => {
    if (row.id <= 0) {
      message.warning('示例数据不可删除，请先保存为正式条目后再操作');
      return;
    }
    if (!window.confirm(`确定删除「${row.year} · ${row.project_name_zh || row.project_name_en}」？`)) {
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/timeline/${row.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const j = await res.json().catch(() => ({}));
      if (res.status === 401) {
        await logout({ reason: 'expired' });
        throw new Error(j?.error || '登录已过期，请重新登录');
      }
      if (!res.ok) throw new Error(j?.error || '操作失败，请稍后重试');
      message.success('已删除');
      if (editingId === row.id) closeEditor();
      await load();
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : '删除失败');
    } finally {
      setSaving(false);
    }
  };

  const columns: DataTableColumn<TimelineItemRow>[] = [
    {
      key: 'year',
      header: '年份',
      className: 'whitespace-nowrap font-semibold text-[#0E2745]',
      render: (row) => row.year,
    },
    {
      key: 'title',
      header: '项目',
      render: (row) => (
        <div className="min-w-[220px]">
          <div className="font-medium text-gray-900">{row.project_name_zh || '—'}</div>
          <div className="text-xs text-gray-400 mt-0.5">{row.project_name_en || '—'}</div>
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
      key: 'updated',
      header: '更新时间',
      className: 'whitespace-nowrap text-gray-600',
      render: (row) => formatUpdatedAt(row.updated_at),
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
              openEdit(row);
            }}
          >
            编辑
          </button>
          <button
            type="button"
            className="text-red-600 hover:underline text-sm"
            onClick={(e) => {
              e.stopPropagation();
              void remove(row);
            }}
          >
            删除
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-4">
      <SearchBar
        keyword={keyword}
        onKeywordChange={setKeyword}
        onCreate={openCreate}
        createLabel="新建条目"
        placeholder="搜索年份或项目名…"
        showStatus={false}
      />

      {editingId != null && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4 max-w-4xl">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-[#0E2745]">
              {editingId === 'new' ? '新建时间轴条目' : `编辑 #${editingId}`}
            </h2>
            <button type="button" className="text-sm text-gray-500 hover:text-gray-800" onClick={closeEditor}>
              取消
            </button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <label className="grid gap-1">
              <span className="text-sm font-medium text-gray-700">年份</span>
              <input
                className="border rounded-lg px-3 py-2 text-sm outline-none focus:border-[#0E2745] focus:ring-2 focus:ring-[#0E2745]/15"
                value={draft.year}
                onChange={(e) => setDraft((d) => ({ ...d, year: e.target.value }))}
                placeholder="2025"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-sm font-medium text-gray-700">排序</span>
              <input
                type="number"
                className="border rounded-lg px-3 py-2 text-sm outline-none focus:border-[#0E2745] focus:ring-2 focus:ring-[#0E2745]/15"
                value={draft.sort_order}
                onChange={(e) => setDraft((d) => ({ ...d, sort_order: Number(e.target.value) || 0 }))}
              />
            </label>
          </div>
          <BilingualField
            label="项目名称"
            zh={draft.project_name_zh}
            en={draft.project_name_en}
            onZhChange={(v) => setDraft((d) => ({ ...d, project_name_zh: v }))}
            onEnChange={(v) => setDraft((d) => ({ ...d, project_name_en: v }))}
          />
          <BilingualField
            label="描述"
            zh={draft.description_zh}
            en={draft.description_en}
            multiline
            onZhChange={(v) => setDraft((d) => ({ ...d, description_zh: v }))}
            onEnChange={(v) => setDraft((d) => ({ ...d, description_en: v }))}
          />
          <div>
            <button
              type="button"
              disabled={saving}
              onClick={() => void save()}
              className="px-5 py-2 rounded-lg bg-[#0E2745] text-white text-sm font-semibold hover:bg-[#163a5f] disabled:opacity-50"
            >
              {saving ? '保存中…' : '保存'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-sm text-gray-500 py-8">加载中…</div>
      ) : (
        <DataTable
          columns={columns}
          rows={filtered}
          rowKey={(row) => String(row.id)}
          onRowClick={(row) => openEdit(row)}
          emptyText="暂无时间轴条目"
        />
      )}
    </div>
  );
}
