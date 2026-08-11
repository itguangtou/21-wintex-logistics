'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAdminChrome } from '@/components/admin/AdminChromeContext';

export default function AdminNewsEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { setSubtitle, setFooter } = useAdminChrome();
  const id = params?.id || '';

  useEffect(() => {
    setSubtitle(`编辑新闻 · ${id}（表单与接口稍后接入）`);
    setFooter(
      <>
        <button
          type="button"
          onClick={() => router.push('/admin/news')}
          className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm hover:bg-gray-50"
        >
          返回列表
        </button>
        <button
          type="button"
          disabled
          className="px-5 py-2 rounded-lg bg-[#0E2745] text-white text-sm font-semibold disabled:opacity-50"
        >
          保存（待接入）
        </button>
      </>
    );
    return () => {
      setSubtitle(null);
      setFooter(null);
    };
  }, [id, router, setFooter, setSubtitle]);

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
        <p className="text-lg font-semibold text-[#0E2745]">新闻编辑页占位</p>
        <p className="mt-2 text-sm text-gray-500">
          ID：{id}
          <br />
          中英字段编辑与发布将在后端接口就绪后接入。
        </p>
      </div>
    </div>
  );
}
