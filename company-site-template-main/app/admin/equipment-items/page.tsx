'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** 装备清单改为整页编辑；旧「条目」路由跳转到页编辑 */
export default function Page() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin/pages/equipment');
  }, [router]);
  return <div className="p-8 text-sm text-gray-500">正在跳转到装备清单编辑…</div>;
}
