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

/** slot 如 pages/mission/card-0 —— 同 slot 再传即覆盖 */
const SLOT_RE = /^[a-z0-9]+(?:\/[a-z0-9_-]+)+$/i;

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

/** 删除同一 slot 下其它扩展名文件，保证替换制 */
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

export async function POST(req: NextRequest) {
  try {
    await requireAdminSession();
    if (!hasSupabaseConfig()) {
      return NextResponse.json({ error: '未配置 Supabase' }, { status: 503 });
    }

    const form = await req.formData();
    const file = form.get('file');
    const slotRaw = String(form.get('slot') || '').trim();

    if (!slotRaw || !SLOT_RE.test(slotRaw)) {
      return NextResponse.json(
        { error: 'slot 无效，应为如 pages/mission/card-0' },
        { status: 400 }
      );
    }
    if (!(file instanceof File)) {
      return NextResponse.json({ error: '缺少文件 file' }, { status: 400 });
    }
    if (file.size <= 0 || file.size > MAX_BYTES) {
      return NextResponse.json({ error: '图片大小需在 1B～8MB' }, { status: 400 });
    }

    const mime = (file.type || '').toLowerCase();
    const ext = ALLOWED_MIME[mime];
    if (!ext) {
      return NextResponse.json(
        { error: '仅支持 JPEG / PNG / WebP / GIF' },
        { status: 400 }
      );
    }

    await ensureMediaBucket();

    const path = `${slotRaw}${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const supabase = getSupabaseAdmin();

    const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, buffer, {
      contentType: mime,
      upsert: true,
      cacheControl: '3600',
    });
    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 500 });
    }

    await removeOtherSlotFiles(slotRaw, path);

    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
    const url = `${pub.publicUrl}?v=${Date.now()}`;

    return NextResponse.json({
      ok: true,
      url,
      path,
      slot: slotRaw,
      mime,
      size: file.size,
    });
  } catch (e: any) {
    const status = e?.status === 401 ? 401 : 500;
    return NextResponse.json({ error: e?.message || '上传失败' }, { status });
  }
}
