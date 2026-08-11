import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin, hasSupabaseConfig } from '@/lib/supabase';
import { requireAdminSession } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ReorderSchema = z.object({
  orderedIds: z.array(z.number().int().positive()).min(1),
});

function noStoreJson(body: unknown, init?: { status?: number }) {
  return NextResponse.json(body, {
    status: init?.status ?? 200,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      Pragma: 'no-cache',
    },
  });
}

/** 按列表顺序重写 sort_order（10,20,30…），管理端上下移用 */
export async function PUT(req: NextRequest) {
  try {
    await requireAdminSession();
    if (!hasSupabaseConfig()) {
      return noStoreJson({ error: '未配置 Supabase' }, { status: 503 });
    }

    const body = await req.json();
    const parsed = ReorderSchema.safeParse(body);
    if (!parsed.success) {
      return noStoreJson(
        { error: '内容格式不正确', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { orderedIds } = parsed.data;
    const supabase = getSupabaseAdmin();

    for (let i = 0; i < orderedIds.length; i++) {
      const id = orderedIds[i];
      const sort_order = (i + 1) * 10;
      const { error } = await supabase.from('timeline_items').update({ sort_order }).eq('id', id);
      if (error) {
        return noStoreJson({ error: error.message }, { status: 500 });
      }
    }

    return noStoreJson({ ok: true, orderedIds });
  } catch (e: any) {
    const status = e?.status === 401 ? 401 : 500;
    return noStoreJson({ error: e?.message || '重排失败' }, { status });
  }
}
