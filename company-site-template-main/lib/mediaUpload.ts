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

/** 按公开 URL 删除 media 桶对象（非本桶 URL 则忽略） */
export async function removeMediaByPublicUrl(url: string | null | undefined) {
  const path = storagePathFromPublicUrl(url || '');
  if (!path) return;
  const supabase = getSupabaseAdmin();
  await supabase.storage.from(MEDIA_BUCKET).remove([path]);
}

const COVER_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'] as const;

/** 删除某新闻封面槽位下所有扩展名变体 */
export async function removeNewsCoverSlot(newsId: string) {
  const id = String(newsId || '').trim();
  if (!id) return;
  const supabase = getSupabaseAdmin();
  const paths = COVER_EXTS.map((ext) => `news/${id}/cover${ext}`);
  await supabase.storage.from(MEDIA_BUCKET).remove(paths);
}

/** 删新闻时：删 URL 指向文件 + 该 id 封面槽 + 若仍是草稿槽一并清 */
export async function removeNewsMediaAssets(newsId: string, imageUrl?: string | null) {
  await removeMediaByPublicUrl(imageUrl);
  await removeNewsCoverSlot(newsId);

  const draftPath = storagePathFromPublicUrl(imageUrl || '');
  if (draftPath?.startsWith('news/local-draft/')) {
    const supabase = getSupabaseAdmin();
    await supabase.storage.from(MEDIA_BUCKET).remove(COVER_EXTS.map((ext) => `news/local-draft/cover${ext}`));
  }
}

/**
 * 新建发布时：若封面在 local-draft，迁到 news/{id}/cover，并返回新公开 URL。
 * 静态路径（/images/...）原样返回。
 */
export async function promoteNewsDraftCover(
  imageUrl: string | null | undefined,
  newsId: string
): Promise<string> {
  const url = (imageUrl || '').trim();
  if (!url) return '';
  const oldPath = storagePathFromPublicUrl(url);
  if (!oldPath) return url;

  const id = String(newsId || '').trim();
  if (!id) return url;
  if (oldPath.startsWith(`news/${id}/`)) return url;

  const extMatch = oldPath.match(/\.[a-z0-9]+$/i);
  const ext = extMatch ? extMatch[0].toLowerCase() : '.webp';
  const newPath = `news/${id}/cover${ext}`;
  if (oldPath === newPath) return url;

  const supabase = getSupabaseAdmin();
  const { error: moveErr } = await supabase.storage.from(MEDIA_BUCKET).move(oldPath, newPath);
  if (moveErr) {
    const { data: blob, error: dlErr } = await supabase.storage.from(MEDIA_BUCKET).download(oldPath);
    if (dlErr || !blob) return url;
    const { error: upErr } = await supabase.storage.from(MEDIA_BUCKET).upload(newPath, blob, {
      upsert: true,
      contentType: blob.type || undefined,
    });
    if (upErr) return url;
    await supabase.storage.from(MEDIA_BUCKET).remove([oldPath]);
  }

  await removeOtherSlotFiles(`news/${id}/cover`, newPath);
  if (oldPath.startsWith('news/local-draft/')) {
    await supabase.storage
      .from(MEDIA_BUCKET)
      .remove(COVER_EXTS.map((e) => `news/local-draft/cover${e}`).filter((p) => p !== newPath));
  }

  return publicUrlForPath(newPath);
}

export function publicUrlForPath(path: string) {
  const supabase = getSupabaseAdmin();
  const { data: pub } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
  return `${pub.publicUrl}?v=${Date.now()}`;
}
