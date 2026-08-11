'use client';

import { useRef, useState } from 'react';
import { useAdminAuth } from './AdminAuthContext';

type ImageReplaceFieldProps = {
  label?: string;
  value: string;
  /** Storage 槽位，如 pages/mission/card-0；同槽再传覆盖旧图 */
  slot: string;
  onChange: (url: string) => void;
};

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
      const fd = new FormData();
      fd.set('file', file);
      fd.set('slot', slot);
      const res = await fetch('/api/upload', {
        method: 'POST',
        credentials: 'include',
        body: fd,
      });
      const j = await res.json().catch(() => ({}));
      if (res.status === 401) {
        await logout();
        throw new Error(j?.error || '登录已过期，请重新登录');
      }
      if (!res.ok) throw new Error(j?.error || `HTTP ${res.status}`);
      if (!j?.url) throw new Error('未返回图片地址');
      onChange(String(j.url));
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
          <p className="text-xs text-gray-500">本地选择一张图即可替换当前图（JPEG / PNG / WebP / GIF，≤8MB）</p>
          {error && <span className="text-sm text-red-600">{error}</span>}
        </div>
      </div>
    </div>
  );
}
