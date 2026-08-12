'use client';

import React, { useEffect, useState } from 'react';
import BilingualField from './BilingualField';
import { useAdminChrome } from './AdminChromeContext';
import { useAdminAuth } from './AdminAuthContext';
import { useAdminMessage } from './AdminMessage';
import {
  DEFAULT_CONTACT_CONTENT,
  type ContactPageContent,
  type LocaleText,
} from '@/lib/contactContent';

function cloneDefault(): ContactPageContent {
  return structuredClone(DEFAULT_CONTACT_CONTENT);
}

export default function ContactPageEditor() {
  const { setSubtitle } = useAdminChrome();
  const { logout } = useAdminAuth();
  const message = useAdminMessage();
  const [data, setData] = useState<ContactPageContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSubtitle('编辑首页底部「联系我们」区域：标题、电话、邮箱、地址');
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/pages/contact', { credentials: 'include', cache: 'no-store' });
        const j = await res.json().catch(() => ({}));
        if (!mounted) return;
        if (!res.ok) throw new Error(j?.error || '加载失败，请刷新页面');
        setData(j.content ? structuredClone(j.content) : cloneDefault());
      } catch (e: unknown) {
        if (!mounted) return;
        setData(cloneDefault());
        message.warning(e instanceof Error ? e.message : '加载失败，已使用默认文案');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
      setSubtitle(null);
    };
  }, [setSubtitle, message]);

  const save = async (mode: 'draft' | 'publish') => {
    if (!data) return;
    setSaving(true);
    try {
      const res = await fetch('/api/pages/contact', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ mode, content: data }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.status === 401) {
        await logout({ reason: 'expired' });
        throw new Error(j?.error || '登录已过期，请重新登录');
      }
      if (!res.ok) throw new Error(j?.error || '保存失败，请稍后重试');
      message.success(mode === 'draft' ? '草稿已保存' : '已发布，网站已更新');
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const patch = (key: keyof ContactPageContent, lang: keyof LocaleText, value: string) => {
    setData((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      next[key][lang] = value;
      return next;
    });
  };

  if (loading || !data) {
    return <div className="p-8 text-sm text-gray-500">加载中…</div>;
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={saving}
          onClick={() => void save('draft')}
          className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          {saving ? '保存中…' : '保存草稿'}
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => void save('publish')}
          className="px-5 py-2 rounded-lg bg-[#0E2745] text-white text-sm font-semibold hover:bg-[#163a5f] disabled:opacity-50"
        >
          {saving ? '发布中…' : '保存并发布'}
        </button>
      </div>

      <section>
        <h2 className="text-base font-semibold text-[#0E2745] mb-3">联系信息</h2>
        <div className="rounded-xl border border-gray-200 bg-white p-5 md:p-6 space-y-4">
          <BilingualField
            label="标题"
            zh={data.title.zh}
            en={data.title.en}
            onZhChange={(v) => patch('title', 'zh', v)}
            onEnChange={(v) => patch('title', 'en', v)}
          />
          <BilingualField
            label="电话"
            zh={data.tel.zh}
            en={data.tel.en}
            onZhChange={(v) => patch('tel', 'zh', v)}
            onEnChange={(v) => patch('tel', 'en', v)}
          />
          <BilingualField
            label="邮箱"
            zh={data.email.zh}
            en={data.email.en}
            onZhChange={(v) => patch('email', 'zh', v)}
            onEnChange={(v) => patch('email', 'en', v)}
          />
          <BilingualField
            label="地址"
            zh={data.address.zh}
            en={data.address.en}
            multiline
            onZhChange={(v) => patch('address', 'zh', v)}
            onEnChange={(v) => patch('address', 'en', v)}
          />
        </div>
      </section>
    </div>
  );
}
