import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, hasSupabaseConfig } from '@/lib/supabase';
import { requireAdminSession } from '@/lib/auth';
import {
  ensureMediaBucket,
  MEDIA_ALLOWED_MIME,
  MEDIA_BUCKET,
  MEDIA_MAX_BYTES,
  MEDIA_SLOT_RE,
  publicUrlForPath,
  removeOtherSlotFiles,
  removePreviousStorageObject,
} from '@/lib/mediaUpload';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function noStoreJson(body: unknown, init?: { status?: number }) {
  return NextResponse.json(body, {
    status: init?.status ?? 200,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      Pragma: 'no-cache',
    },
  });
}

/**
 * 兼容旧的经 Vercel 中转上传（仍受约 4.5MB 限制）。
 * 管理端已改走 /api/upload/prepare 直传，可到 15MB。
 */
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

    if (!slotRaw || !MEDIA_SLOT_RE.test(slotRaw)) {
      return noStoreJson({ error: 'slot 无效，应为如 pages/mission/card-0' }, { status: 400 });
    }
    if (!(file instanceof File)) {
      return noStoreJson({ error: '缺少文件 file' }, { status: 400 });
    }
    if (file.size <= 0 || file.size > MEDIA_MAX_BYTES) {
      return noStoreJson({ error: `图片大小需在 1B～${MEDIA_MAX_BYTES / 1024 / 1024}MB` }, { status: 400 });
    }

    const mime = (file.type || '').toLowerCase();
    const ext = MEDIA_ALLOWED_MIME[mime];
    if (!ext) {
      return noStoreJson({ error: '仅支持 JPEG / PNG / WebP / GIF' }, { status: 400 });
    }

    await ensureMediaBucket();

    const path = `${slotRaw}${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const supabase = getSupabaseAdmin();

    const { error: upErr } = await supabase.storage.from(MEDIA_BUCKET).upload(path, buffer, {
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

    return noStoreJson({
      ok: true,
      url: publicUrlForPath(path),
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
