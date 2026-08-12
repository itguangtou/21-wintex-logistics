import { NextRequest, NextResponse } from 'next/server';
import { hasSupabaseConfig, getSupabaseAdmin } from '@/lib/supabase';
import { requireAdminSession } from '@/lib/auth';
import { MEDIA_BUCKET, MEDIA_SLOT_RE } from '@/lib/mediaUpload';

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

const EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'] as const;

/** 清理指定槽位的全部扩展名文件（用于丢弃新建草稿封面） */
export async function POST(req: NextRequest) {
  try {
    await requireAdminSession();
    if (!hasSupabaseConfig()) {
      return noStoreJson({ error: '未配置 Supabase' }, { status: 503 });
    }

    const body = await req.json().catch(() => ({}));
    const slot = String(body?.slot || '').trim();
    if (!slot || !MEDIA_SLOT_RE.test(slot)) {
      return noStoreJson({ error: 'slot 无效' }, { status: 400 });
    }

    // 仅允许清理草稿槽，避免误删正式资源
    if (slot !== 'news/local-draft/cover') {
      return noStoreJson({ error: '仅允许清理 news/local-draft/cover' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    await supabase.storage.from(MEDIA_BUCKET).remove(EXTS.map((ext) => `${slot}${ext}`));

    return noStoreJson({ ok: true, slot });
  } catch (e: any) {
    const status = e?.status === 401 ? 401 : 500;
    return noStoreJson({ error: e?.message || '清理失败' }, { status });
  }
}
