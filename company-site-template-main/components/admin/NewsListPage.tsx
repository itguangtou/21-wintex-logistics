'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import SearchBar, { type StatusFilter } from './SearchBar';
import DataTable, { type DataTableColumn } from './DataTable';
import { useAdminChrome } from './AdminChromeContext';

type NewsStatus = 'published' | 'draft';

type MockNews = {
  id: string;
  titleZh: string;
  titleEn: string;
  status: NewsStatus;
  updatedAt: string;
};

const MOCK_NEWS: MockNews[] = [
  {
    id: 'n-001',
    titleZh: '温特克斯开通新亚欧班列线路',
    titleEn: 'Wintex Launches New Eurasia Rail Route',
    status: 'published',
    updatedAt: '2026-08-01 14:20',
  },
  {
    id: 'n-002',
    titleZh: '仓储自动化升级完成',
    titleEn: 'Warehouse Automation Upgrade Completed',
    status: 'published',
    updatedAt: '2026-07-18 09:05',
  },
  {
    id: 'n-003',
    titleZh: '公司参加国际物流展会（草稿）',
    titleEn: 'Company Attends Logistics Expo (Draft)',
    status: 'draft',
    updatedAt: '2026-08-08 16:40',
  },
  {
    id: 'n-004',
    titleZh: '绿色物流倡议启动',
    titleEn: 'Green Logistics Initiative Kickoff',
    status: 'draft',
    updatedAt: '2026-08-10 11:12',
  },
];

function StatusBadge({ status }: { status: NewsStatus }) {
  if (status === 'published') {
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
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [rows, setRows] = useState(MOCK_NEWS);

  useEffect(() => {
    setSubtitle('搜索 + 列表（当前为前端 Mock，接口稍后接入）');
    return () => setSubtitle(null);
  }, [setSubtitle]);

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return rows.filter((row) => {
      if (status !== 'all' && row.status !== status) return false;
      if (!q) return true;
      return (
        row.titleZh.toLowerCase().includes(q) ||
        row.titleEn.toLowerCase().includes(q) ||
        row.id.toLowerCase().includes(q)
      );
    });
  }, [rows, keyword, status]);

  const columns: DataTableColumn<MockNews>[] = [
    {
      key: 'title',
      header: '标题',
      render: (row) => (
        <div className="min-w-[220px]">
          <div className="font-medium text-gray-900">{row.titleZh}</div>
          <div className="text-xs text-gray-400 mt-0.5">{row.titleEn}</div>
        </div>
      ),
    },
    {
      key: 'updatedAt',
      header: '更新时间',
      className: 'whitespace-nowrap text-gray-600',
      render: (row) => row.updatedAt,
    },
    {
      key: 'status',
      header: '状态',
      className: 'whitespace-nowrap',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: '操作',
      className: 'whitespace-nowrap',
      render: (row) => (
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
      ),
    },
  ];

  const handleCreate = () => {
    const id = `n-${Date.now()}`;
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    setRows((prev) => [
      {
        id,
        titleZh: '新建新闻（未保存）',
        titleEn: 'New Article (unsaved)',
        status: 'draft',
        updatedAt: stamp,
      },
      ...prev,
    ]);
    router.push(`/admin/news/${id}`);
  };

  return (
    <div className="p-6 lg:p-8">
      <SearchBar
        keyword={keyword}
        onKeywordChange={setKeyword}
        status={status}
        onStatusChange={setStatus}
        onCreate={handleCreate}
        createLabel="新建新闻"
      />
      <DataTable
        columns={columns}
        rows={filtered}
        rowKey={(row) => row.id}
        onRowClick={(row) => router.push(`/admin/news/${row.id}`)}
        emptyText="没有匹配的新闻"
      />
      <p className="mt-3 text-xs text-gray-500">
        共 {filtered.length} 条
        {status !== 'all' || keyword ? `（已筛选，全库 ${rows.length}）` : ''}
      </p>
    </div>
  );
}
