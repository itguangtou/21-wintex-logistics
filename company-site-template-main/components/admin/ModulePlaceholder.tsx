'use client';

import { useEffect } from 'react';
import { useAdminChrome } from './AdminChromeContext';

export default function ModulePlaceholder({
  title,
  description = '该模块前端壳已挂载，数据接口将在后续阶段接入。',
}: {
  title: string;
  description?: string;
}) {
  const { setSubtitle } = useAdminChrome();

  useEffect(() => {
    setSubtitle('敬请期待');
    return () => setSubtitle(null);
  }, [setSubtitle]);

  return (
    <div className="p-6 lg:p-8">
      <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
        <p className="text-lg font-semibold text-[#0E2745]">{title}</p>
        <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">{description}</p>
      </div>
    </div>
  );
}
