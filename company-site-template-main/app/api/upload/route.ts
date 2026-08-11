import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, hasSupabaseConfig } from '@/lib/supabase';
import { requireAdminSession } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BUCKET = 'media';
const MAX_BYTES = 8 * 1024 * 1024; // 8MB
const ALLOWED_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

/** slot 如 pages/mission/card-0 —— 同 slot 再传即覆盖，不堆积 */
const SLOT_RE = /^[a-z0-9]+(?:\/[a-z0-9_-]+)+$/i;

function noStoreJson(body: unknown, init?: { status?: number }) {
  return NextResponse.json(body, {
    status: init?.status ?? 200,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      Pragma: 'no-cache',
    },
  });
}

async function ensureMediaBucket() {
  const supabase = getSupabaseAdmin();
  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) throw new Error(`无法列出 Storage: ${error.message}`);
  if (!buckets?.some((b) => b.name === BUCKET)) {
    const { error: createErr } = await supabase.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: MAX_BYTES,
      allowedMimeTypes: Object.keys(ALLOWED_MIME),
    });
    if (createErr && !/already exists/i.test(createErr.message)) {
      throw new Error(`创建 media 桶失败: ${createErr.message}`);
    }
  }
}

/** 从公开 URL 解析出本桶内的对象路径；非本桶则返回 null */
function storagePathFromPublicUrl(raw: string): string | null {
  const trimmed = (raw || '').trim();
  if (!trimmed) return null;
  try {
    const u = new URL(trimmed, 'https://placeholder.local');
    const marker = `/storage/v1/object/public/${BUCKET}/`;
    const idx = u.pathname.indexOf(marker);
    if (idx === -1) return null;
    const objectPath = decodeURIComponent(u.pathname.slice(idx + marker.length));
    return objectPath || null;
  } catch {
    return null;
  }
}

/** 删除同一 slot 下其它扩展名文件（如先传 .png 再传 .jpg） */
async function removeOtherSlotFiles(slot: string, keepPath: string) {
  const supabase = getSupabaseAdmin();
  const dir = slot.includes('/') ? slot.slice(0, slot.lastIndexOf('/')) : '';
  const base = slot.includes('/') ? slot.slice(slot.lastIndexOf('/') + 1) : slot;
  if (!dir) return;

  const { data: listed } = await supabase.storage.from(BUCKET).list(dir, { limit: 100 });
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
    await supabase.storage.from(BUCKET).remove(toRemove);
  }
}

/** 若旧图也在本桶且路径不同于新文件，则删除，防止换路径后堆积 */
async function removePreviousStorageObject(previousUrl: string, keepPath: string) {
  const oldPath = storagePathFromPublicUrl(previousUrl);
  if (!oldPath || oldPath === keepPath) return;
  const supabase = getSupabaseAdmin();
  await supabase.storage.from(BUCKET).remove([oldPath]);
}

export async function POST(req: NextRequest) {
  try {
    await requireAdminSession();
    if (!hasSupabaseConfig()) {
      return noStoreJson({ error: '未配置 Supabase' }, { status: 503 });
    }

    const form = await req.formData();
    const file = form.get('file');
    const slotRaw = String(form.get('slot') || '').trim();
    const previousUrl = String(form.get('previousUrl') || '').trim();

    if (!slotRaw || !SLOT_RE.test(slotRaw)) {
      return noStoreJson(
        { error: 'slot 无效，应为如 pages/mission/card-0' },
        { status: 400 }
      );
    }
    if (!(file instanceof File)) {
      return noStoreJson({ error: '缺少文件 file' }, { status: 400 });
    }
    if (file.size <= 0 || file.size > MAX_BYTES) {
      return noStoreJson({ error: '图片大小需在 1B～8MB' }, { status: 400 });
    }

    const mime = (file.type || '').toLowerCase();
    const ext = ALLOWED_MIME[mime];
    if (!ext) {
      return noStoreJson({ error: '仅支持 JPEG / PNG / WebP / GIF' }, { status: 400 });
    }

    await ensureMediaBucket();

    const path = `${slotRaw}${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const supabase = getSupabaseAdmin();

    // 同路径 upsert = 覆盖，不会多出一张
    const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, buffer, {
      contentType: mime,
      upsert: true,
      cacheControl: '3600',
    });
    if (upErr) {
      return noStoreJson({ error: upErr.message }, { status: 500 });
    }

    await removeOtherSlotFiles(slotRaw, path);
    if (previousUrl) {
      await removePreviousStorageObject(previousUrl, path);
    }

    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
    const url = `${pub.publicUrl}?v=${Date.now()}`;

    return noStoreJson({
      ok: true,
      url,
      path,
      slot: slotRaw,
      mime,
      size: file.size,
      replaced: true,
    });
  } catch (e: any) {
    const status = e?.status === 401 ? 401 : 500;
    return noStoreJson({ error: e?.message || '上传失败' }, { status });
  }
}
