import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, hasSupabaseConfig } from '@/lib/supabase';
import { requireAdminSession } from '@/lib/auth';
import {
  ensureMediaBucket,
  MEDIA_ALLOWED_MIME,
  MEDIA_BUCKET,
  MEDIA_MAX_BYTES,
  MEDIA_SLOT_RE,
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

/** 签发直传 URL：文件不经过 Vercel，可到 MEDIA_MAX_BYTES */
export async function POST(req: NextRequest) {
  try {
    await requireAdminSession();
    if (!hasSupabaseConfig()) {
      return noStoreJson({ error: '未配置 Supabase' }, { status: 503 });
    }

    const body = await req.json().catch(() => ({}));
    const slotRaw = String(body?.slot || '').trim();
    const mime = String(body?.mime || '').toLowerCase().trim();

    if (!slotRaw || !MEDIA_SLOT_RE.test(slotRaw)) {
      return noStoreJson({ error: 'slot 无效' }, { status: 400 });
    }
    const ext = MEDIA_ALLOWED_MIME[mime];
    if (!ext) {
      return noStoreJson({ error: '仅支持 JPEG / PNG / WebP / GIF' }, { status: 400 });
    }

    await ensureMediaBucket();

    const path = `${slotRaw}${ext}`;
    const supabase = getSupabaseAdmin();

    // 先清同槽旧文件，再签发，避免「文件已存在」导致无法覆盖
    await supabase.storage.from(MEDIA_BUCKET).remove([
      `${slotRaw}.jpg`,
      `${slotRaw}.jpeg`,
      `${slotRaw}.png`,
      `${slotRaw}.webp`,
      `${slotRaw}.gif`,
      path,
    ]);

    const { data, error } = await supabase.storage
      .from(MEDIA_BUCKET)
      .createSignedUploadUrl(path);

    if (error || !data?.signedUrl || !data?.token) {
      return noStoreJson(
        { error: error?.message || '无法签发上传地址' },
        { status: 500 }
      );
    }

    return noStoreJson({
      ok: true,
      path,
      token: data.token,
      signedUrl: data.signedUrl,
      slot: slotRaw,
      mime,
      maxBytes: MEDIA_MAX_BYTES,
    });
  } catch (e: any) {
    const status = e?.status === 401 ? 401 : 500;
    return noStoreJson({ error: e?.message || '准备上传失败' }, { status });
  }
}
