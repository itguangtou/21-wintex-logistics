'use client';

import { useRef, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useAdminAuth } from './AdminAuthContext';
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
  if (!url || !key) throw new Error('缺少 Supabase 公开配置');
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
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onPick = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setError(null);
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
        await logout();
        throw new Error(prep?.error || '登录已过期，请重新登录');
      }
      if (!prepRes.ok) throw new Error(prep?.error || `准备上传失败（HTTP ${prepRes.status}）`);
      if (!prep?.path || !prep?.token) throw new Error('未返回上传凭证');

      const supabase = getBrowserSupabase();
      const { error: upErr } = await supabase.storage
        .from('media')
        .uploadToSignedUrl(prep.path, prep.token, compressed, {
          contentType: compressed.type,
          upsert: true,
        });
      if (upErr) throw new Error(upErr.message || '直传失败');

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
        await logout();
        throw new Error(fin?.error || '登录已过期，请重新登录');
      }
      if (!finRes.ok) throw new Error(fin?.error || `完成上传失败（HTTP ${finRes.status}）`);
      if (!fin?.url) throw new Error('未返回图片地址');
      onChange(String(fin.url));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '上传失败');
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
              {uploading ? '压缩并上传中…' : value ? '选择图片替换' : '选择图片上传'}
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
            本地压成 WebP 后直传云存储（上限约 15MB，不受 Vercel 4.5MB 限制）；同槽覆盖，不堆积。
          </p>
          {error && <span className="text-sm text-red-600">{error}</span>}
        </div>
      </div>
    </div>
  );
}
