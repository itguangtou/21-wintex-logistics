'use client';

import React, { useEffect, useState } from 'react';
import BilingualField from './BilingualField';
import { useAdminChrome } from './AdminChromeContext';
import {
  ABOUT_DRAFT_KEY,
  DEFAULT_ABOUT_CONTENT,
  type AboutPageContent,
  type LocaleText,
} from '@/lib/aboutPageContent';

function cloneDefault(): AboutPageContent {
  return structuredClone(DEFAULT_ABOUT_CONTENT);
}

export default function AboutPageEditor() {
  const { setSubtitle, setFooter } = useAdminChrome();
  const [data, setData] = useState<AboutPageContent | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setSubtitle('编辑品牌引言与网络图文案（本阶段先保存本地草稿，接口随后接入）');
    try {
      const raw = localStorage.getItem(ABOUT_DRAFT_KEY);
      setData(raw ? (JSON.parse(raw) as AboutPageContent) : cloneDefault());
    } catch {
      setData(cloneDefault());
    }
    return () => setSubtitle(null);
  }, [setSubtitle]);

  const saveDraft = () => {
    if (!data) return;
    localStorage.setItem(ABOUT_DRAFT_KEY, JSON.stringify(data));
    setMessage('已保存到浏览器本地草稿');
  };

  const resetDefaults = () => {
    if (!confirm('确定恢复为网站当前默认文案？本地草稿将被覆盖。')) return;
    const next = cloneDefault();
    setData(next);
    localStorage.setItem(ABOUT_DRAFT_KEY, JSON.stringify(next));
    setMessage('已恢复默认文案');
  };

  useEffect(() => {
    if (!data) {
      setFooter(null);
      return;
    }
    setFooter(
      <>
        <button
          type="button"
          onClick={resetDefaults}
          className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm hover:bg-gray-50 mr-auto"
        >
          恢复默认
        </button>
        <button
          type="button"
          onClick={saveDraft}
          className="px-5 py-2 rounded-lg bg-[#0E2745] text-white text-sm font-semibold hover:bg-[#163a5f]"
        >
          保存草稿（本地）
        </button>
      </>
    );
    return () => setFooter(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, setFooter]);

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
    <div className="p-6 lg:p-8 max-w-5xl space-y-6">
      {message && (
        <div className="px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-800 text-sm">
          {message}
        </div>
      )}

      <section className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-[#0E2745]">页面资源</h2>
          <p className="text-xs text-gray-500 mt-1">图片路径暂用现有静态资源，上传功能后续接入</p>
        </div>
        <label className="grid gap-1 max-w-xl">
          <span className="text-sm text-gray-600">背景图路径</span>
          <input
            className="border rounded-lg px-3 py-2 text-sm outline-none focus:border-[#0E2745] focus:ring-2 focus:ring-[#0E2745]/15"
            value={data.backgroundImage}
            onChange={(e) => setData({ ...data, backgroundImage: e.target.value })}
          />
        </label>
        <label className="grid gap-1 max-w-xl">
          <span className="text-sm text-gray-600">网络图中心 Logo</span>
          <input
            className="border rounded-lg px-3 py-2 text-sm outline-none focus:border-[#0E2745] focus:ring-2 focus:ring-[#0E2745]/15"
            value={data.network.centerLogo}
            onChange={(e) =>
              setData({
                ...data,
                network: { ...data.network, centerLogo: e.target.value },
              })
            }
          />
        </label>
      </section>

      {data.intro.map((block, i) => (
        <section key={i} className="rounded-xl border border-gray-200 bg-white p-5 space-y-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-[#0E2745]">
              引言区块 {i + 1}
              <span className="ml-2 text-sm font-normal text-[#F7B959]">{block.title.zh || '未命名'}</span>
            </h2>
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
        </section>
      ))}

      <section className="rounded-xl border border-gray-200 bg-white p-5 space-y-5">
        <div>
          <h2 className="text-base font-semibold text-[#0E2745]">网络图文案</h2>
          <p className="text-xs text-gray-500 mt-1">对应前台五点说明，编号固定 1–5，布局坐标不变</p>
        </div>
        {data.network.items.map((item, i) => (
          <BilingualField
            key={i}
            label={`节点 ${i + 1}`}
            zh={item.zh}
            en={item.en}
            multiline
            onZhChange={(v) => patchNetworkItem(i, 'zh', v)}
            onEnChange={(v) => patchNetworkItem(i, 'en', v)}
          />
        ))}
      </section>
    </div>
  );
}
