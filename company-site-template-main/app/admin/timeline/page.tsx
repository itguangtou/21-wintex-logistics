'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** 时间轴已并入实力见证页编辑，此处跳转过去 */
export default function Page() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin/pages/mission');
  }, [router]);

  return <div className="p-8 text-sm text-gray-500">时间轴已并入「实力见证」页，正在跳转…</div>;
}
