'use client';

import React, { useEffect, useState } from 'react';
import BilingualField from './BilingualField';
import { useAdminChrome } from './AdminChromeContext';
import {
  DEFAULT_ABOUT_CONTENT,
  type AboutPageContent,
  type LocaleText,
} from '@/lib/aboutPageContent';

function cloneDefault(): AboutPageContent {
  return structuredClone(DEFAULT_ABOUT_CONTENT);
}

export default function AboutPageEditor() {
  const { setSubtitle } = useAdminChrome();
  const [data, setData] = useState<AboutPageContent | null>(null);

  useEffect(() => {
    setSubtitle('编辑品牌引言与网络图文案');
    setData(cloneDefault());
    return () => setSubtitle(null);
  }, [setSubtitle]);

  const patchIntroTitle = (index: number, lang: keyof LocaleText, value: string) => {
    setData((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      next.intro[index].title[lang] = value;
      return next;
    });
  };

  const patchIntroBody = (blockIndex: number, bodyIndex: number, lang: keyof LocaleText, value: string) => {
    setData((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      next.intro[blockIndex].body[bodyIndex][lang] = value;
      return next;
    });
  };

  const patchNetworkItem = (index: number, lang: keyof LocaleText, value: string) => {
    setData((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      next.network.items[index][lang] = value;
      return next;
    });
  };

  if (!data) {
    return <div className="p-8 text-sm text-gray-500">加载中…</div>;
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl space-y-8">
      <section>
        <div className="mb-3">
          <h2 className="text-base font-semibold text-[#0E2745]">引言区块</h2>
          <p className="text-xs text-gray-500 mt-1">对应前台三段橙标题与正文</p>
        </div>
        <ul className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100 overflow-hidden">
          {data.intro.map((block, i) => (
            <li key={i} className="p-4 sm:p-5 space-y-4 hover:bg-gray-50/60">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-[#0E2745] text-white text-xs font-semibold">
                  {i + 1}
                </span>
                <span className="text-sm font-medium text-gray-800 truncate">
                  {block.title.zh || `引言 ${i + 1}`}
                </span>
              </div>
              <BilingualField
                label="标题"
                zh={block.title.zh}
                en={block.title.en}
                onZhChange={(v) => patchIntroTitle(i, 'zh', v)}
                onEnChange={(v) => patchIntroTitle(i, 'en', v)}
              />
              {block.body.map((para, pi) => (
                <BilingualField
                  key={pi}
                  label={block.body.length > 1 ? `正文 ${pi + 1}` : '正文'}
                  zh={para.zh}
                  en={para.en}
                  multiline
                  onZhChange={(v) => patchIntroBody(i, pi, 'zh', v)}
                  onEnChange={(v) => patchIntroBody(i, pi, 'en', v)}
                />
              ))}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <div className="mb-3">
          <h2 className="text-base font-semibold text-[#0E2745]">网络图节点</h2>
          <p className="text-xs text-gray-500 mt-1">五点说明，编号与布局固定</p>
        </div>
        <ul className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100 overflow-hidden">
          {data.network.items.map((item, i) => (
            <li key={i} className="p-4 sm:p-5 space-y-3 hover:bg-gray-50/60">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-[#F7B959] text-[#0E2745] text-xs font-bold">
                  {i + 1}
                </span>
                <span className="text-sm font-medium text-gray-800">节点 {i + 1}</span>
              </div>
              <BilingualField
                label="文案"
                zh={item.zh}
                en={item.en}
                multiline
                onZhChange={(v) => patchNetworkItem(i, 'zh', v)}
                onEnChange={(v) => patchNetworkItem(i, 'en', v)}
              />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
