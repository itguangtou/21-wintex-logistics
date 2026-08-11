import { getSupabaseAdmin } from '@/lib/supabase';

export const MEDIA_BUCKET = 'media';
/** 直传 Supabase 后的实际上限（绕过 Vercel 4.5MB 请求体限制） */
export const MEDIA_MAX_BYTES = 15 * 1024 * 1024;
export const MEDIA_ALLOWED_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

export const MEDIA_SLOT_RE = /^[a-z0-9]+(?:\/[a-z0-9_-]+)+$/i;

export async function ensureMediaBucket() {
  const supabase = getSupabaseAdmin();
  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) throw new Error(`无法列出 Storage: ${error.message}`);

  const opts = {
    public: true,
    fileSizeLimit: MEDIA_MAX_BYTES,
    allowedMimeTypes: Object.keys(MEDIA_ALLOWED_MIME),
  };

  if (!buckets?.some((b) => b.name === MEDIA_BUCKET)) {
    const { error: createErr } = await supabase.storage.createBucket(MEDIA_BUCKET, opts);
    if (createErr && !/already exists/i.test(createErr.message)) {
      throw new Error(`创建 media 桶失败: ${createErr.message}`);
    }
  } else {
    // 同步提高已有桶的体积上限
    await supabase.storage.updateBucket(MEDIA_BUCKET, opts);
  }
}

export function storagePathFromPublicUrl(raw: string): string | null {
  const trimmed = (raw || '').trim();
  if (!trimmed) return null;
  try {
    const u = new URL(trimmed, 'https://placeholder.local');
    const marker = `/storage/v1/object/public/${MEDIA_BUCKET}/`;
    const idx = u.pathname.indexOf(marker);
    if (idx === -1) return null;
    const objectPath = decodeURIComponent(u.pathname.slice(idx + marker.length));
    return objectPath || null;
  } catch {
    return null;
  }
}

export async function removeOtherSlotFiles(slot: string, keepPath: string) {
  const supabase = getSupabaseAdmin();
  const dir = slot.includes('/') ? slot.slice(0, slot.lastIndexOf('/')) : '';
  const base = slot.includes('/') ? slot.slice(slot.lastIndexOf('/') + 1) : slot;
  if (!dir) return;

  const { data: listed } = await supabase.storage.from(MEDIA_BUCKET).list(dir, { limit: 100 });
  if (!listed?.length) return;

  const toRemove = listed
    .filter((f) => {
      const name = f.name;
      if (!name.startsWith(base + '.') && name !== base) return false;
      const full = `${dir}/${name}`;
      return full !== keepPath;
    })
    .map((f) => `${dir}/${f.name}`);

  if (toRemove.length) {
    await supabase.storage.from(MEDIA_BUCKET).remove(toRemove);
  }
}

export async function removePreviousStorageObject(previousUrl: string, keepPath: string) {
  const oldPath = storagePathFromPublicUrl(previousUrl);
  if (!oldPath || oldPath === keepPath) return;
  const supabase = getSupabaseAdmin();
  await supabase.storage.from(MEDIA_BUCKET).remove([oldPath]);
}

export function publicUrlForPath(path: string) {
  const supabase = getSupabaseAdmin();
  const { data: pub } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
  return `${pub.publicUrl}?v=${Date.now()}`;
}
