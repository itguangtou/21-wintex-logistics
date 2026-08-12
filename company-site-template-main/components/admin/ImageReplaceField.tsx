'use client';

import { useRef, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useAdminAuth } from './AdminAuthContext';
import { useAdminMessage } from './AdminMessage';
import { compressImageForUpload } from '@/lib/compressImageForUpload';

type ImageReplaceFieldProps = {
  label?: string;
  value: string;
  /** Storage 槽位，如 pages/mission/card-0；同槽再传覆盖旧图 */
  slot: string;
  onChange: (url: string) => void;
};

function getBrowserSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('图片上传暂不可用，请联系管理员');
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default function ImageReplaceField({
  label = '图片',
  value,
  slot,
  onChange,
}: ImageReplaceFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { logout } = useAdminAuth();
  const message = useAdminMessage();
  const [uploading, setUploading] = useState(false);

  const onPick = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const compressed = await compressImageForUpload(file);

      const prepRes = await fetch('/api/upload/prepare', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slot, mime: compressed.type }),
      });
      const prep = await prepRes.json().catch(() => ({}));
      if (prepRes.status === 401) {
        await logout({ reason: 'expired' });
        throw new Error(prep?.error || '登录已过期，请重新登录');
      }
      if (!prepRes.ok) throw new Error(prep?.error || '上传准备失败，请稍后重试');
      if (!prep?.path || !prep?.token) throw new Error('上传准备失败，请稍后重试');

      const supabase = getBrowserSupabase();
      const { error: upErr } = await supabase.storage
        .from('media')
        .uploadToSignedUrl(prep.path, prep.token, compressed, {
          contentType: compressed.type,
          upsert: true,
        });
      if (upErr) throw new Error('上传失败，请稍后重试');

      const finRes = await fetch('/api/upload/finalize', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          slot,
          path: prep.path,
          previousUrl: value || undefined,
        }),
      });
      const fin = await finRes.json().catch(() => ({}));
      if (finRes.status === 401) {
        await logout({ reason: 'expired' });
        throw new Error(fin?.error || '登录已过期，请重新登录');
      }
      if (!finRes.ok) throw new Error(fin?.error || '上传失败，请稍后重试');
      if (!fin?.url) throw new Error('上传失败，请稍后重试');
      onChange(String(fin.url));
      message.success('图片上传成功');
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : '上传失败，请稍后重试');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="grid gap-2">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div className="flex flex-wrap items-start gap-4">
        <div className="w-36 h-28 rounded-lg border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center shrink-0">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="max-w-full max-h-full object-contain" />
          ) : (
            <span className="text-xs text-gray-400">暂无图片</span>
          )}
        </div>
        <div className="flex flex-col gap-2 min-w-[200px] flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              className="px-3 py-2 rounded-lg bg-[#0E2745] text-white text-sm hover:bg-[#163a5f] disabled:opacity-50"
            >
              {uploading ? '上传中…' : value ? '选择图片替换' : '选择图片上传'}
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => void onPick(e.target.files?.[0])}
            />
          </div>
          <p className="text-xs text-gray-500">
            支持 JPG / PNG 等常见格式，单张建议不超过 15MB；重新上传会替换当前图片。
          </p>
        </div>
      </div>
    </div>
  );
}
