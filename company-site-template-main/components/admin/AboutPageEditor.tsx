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

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 text-gray-400 transition-transform ${open ? 'rotate-90' : ''}`}
      aria-hidden
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

function AccordionItem({
  name,
  open,
  onToggle,
  children,
}: {
  name: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <li className="border-b border-gray-100 last:border-0">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-gray-50 transition-colors"
        aria-expanded={open}
      >
        <Chevron open={open} />
        <span className="text-sm font-medium text-gray-800 truncate">{name}</span>
      </button>
      {open && <div className="px-4 pb-5 pt-1 space-y-4 bg-gray-50/40 border-t border-gray-100">{children}</div>}
    </li>
  );
}

export default function AboutPageEditor() {
  const { setSubtitle } = useAdminChrome();
  const [data, setData] = useState<AboutPageContent | null>(null);
  const [openIntro, setOpenIntro] = useState<Record<number, boolean>>({});
  const [openNetwork, setOpenNetwork] = useState<Record<number, boolean>>({});

  useEffect(() => {
    setSubtitle('编辑品牌引言与网络图文案');
    setData(cloneDefault());
    return () => setSubtitle(null);
  }, [setSubtitle]);

  const toggleIntro = (i: number) => {
    setOpenIntro((prev) => ({ ...prev, [i]: !prev[i] }));
  };

  const toggleNetwork = (i: number) => {
    setOpenNetwork((prev) => ({ ...prev, [i]: !prev[i] }));
  };

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
        <h2 className="text-base font-semibold text-[#0E2745] mb-3">引言区块</h2>
        <ul className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          {data.intro.map((block, i) => {
            const open = !!openIntro[i];
            const name = block.title.zh?.trim() || `引言 ${i + 1}`;
            return (
              <AccordionItem key={i} name={name} open={open} onToggle={() => toggleIntro(i)}>
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
              </AccordionItem>
            );
          })}
        </ul>
      </section>

      <section>
        <h2 className="text-base font-semibold text-[#0E2745] mb-3">网络图节点</h2>
        <ul className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          {data.network.items.map((item, i) => {
            const open = !!openNetwork[i];
            const name = item.zh?.trim()
              ? `${i + 1}. ${item.zh.trim().slice(0, 28)}${item.zh.trim().length > 28 ? '…' : ''}`
              : `节点 ${i + 1}`;
            return (
              <AccordionItem key={i} name={name} open={open} onToggle={() => toggleNetwork(i)}>
                <BilingualField
                  label="文案"
                  zh={item.zh}
                  en={item.en}
                  multiline
                  onZhChange={(v) => patchNetworkItem(i, 'zh', v)}
                  onEnChange={(v) => patchNetworkItem(i, 'en', v)}
                />
              </AccordionItem>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
