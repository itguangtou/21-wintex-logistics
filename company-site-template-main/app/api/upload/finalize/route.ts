import { NextRequest, NextResponse } from 'next/server';
import { hasSupabaseConfig } from '@/lib/supabase';
import { requireAdminSession } from '@/lib/auth';
import {
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

/** 直传完成后清理同槽旧文件并返回公开 URL */
export async function POST(req: NextRequest) {
  try {
    await requireAdminSession();
    if (!hasSupabaseConfig()) {
      return noStoreJson({ error: '未配置 Supabase' }, { status: 503 });
    }

    const body = await req.json().catch(() => ({}));
    const slotRaw = String(body?.slot || '').trim();
    const path = String(body?.path || '').trim();
    const previousUrl = String(body?.previousUrl || '').trim();

    if (!slotRaw || !MEDIA_SLOT_RE.test(slotRaw)) {
      return noStoreJson({ error: 'slot 无效' }, { status: 400 });
    }
    if (!path || !path.startsWith(slotRaw)) {
      return noStoreJson({ error: 'path 无效' }, { status: 400 });
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
      replaced: true,
    });
  } catch (e: any) {
    const status = e?.status === 401 ? 401 : 500;
    return noStoreJson({ error: e?.message || '完成上传失败' }, { status });
  }
}
