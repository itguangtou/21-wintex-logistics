import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin, hasSupabaseConfig } from '@/lib/supabase';
import { requireAdminSession } from '@/lib/auth';
import { defaultNewsArticles, mapNewsRow } from '@/lib/newsContent';
import { normalizeNewsSortOrder, placeNewNewsAt, placeNewsAt } from '@/lib/newsSort';
import { promoteNewsDraftCover, removeNewsMediaAssets } from '@/lib/mediaUpload';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NewsUpdateSchema = z.object({
  title_zh: z.string().optional(),
  title_en: z.string().optional(),
  content_zh: z.string().optional(),
  content_en: z.string().optional(),
  image_url: z.string().optional(),
  published_at: z.string().nullable().optional(),
  sort_order: z.number().int().optional(),
  is_published: z.boolean().optional(),
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

const NEWS_COLS =
  'id, title_zh, title_en, content_zh, content_en, image_url, published_at, sort_order, is_published, updated_at';

type RouteCtx = { params: { id: string } };

export async function GET(_req: NextRequest, ctx: RouteCtx) {
  const id = ctx.params.id;
  if (!id) return noStoreJson({ error: '缺少 id' }, { status: 400 });

  if (!hasSupabaseConfig()) {
    const item = defaultNewsArticles().find((a) => a.id === id);
    if (!item) return noStoreJson({ error: '不存在' }, { status: 404 });
    return noStoreJson({ item, source: 'default' });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from('news').select(NEWS_COLS).eq('id', id).maybeSingle();

    if (error) return noStoreJson({ error: error.message }, { status: 500 });
    if (!data) {
      const item = defaultNewsArticles().find((a) => a.id === id);
      if (!item) return noStoreJson({ error: '不存在' }, { status: 404 });
      return noStoreJson({ item, source: 'default' });
    }
    return noStoreJson({ item: mapNewsRow(data as Record<string, unknown>), source: 'db' });
  } catch (e: any) {
    return noStoreJson({ error: e?.message || '读取失败' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, ctx: RouteCtx) {
  const id = ctx.params.id;
  if (!id) return noStoreJson({ error: '缺少 id' }, { status: 400 });

  try {
    await requireAdminSession();
    if (!hasSupabaseConfig()) {
      return noStoreJson({ error: '未配置 Supabase' }, { status: 503 });
    }

    const body = await req.json();
    const parsed = NewsUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return noStoreJson(
        { error: '内容格式不正确', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const desiredSort =
      parsed.data.sort_order !== undefined ? parsed.data.sort_order : undefined;

    const patch: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(parsed.data)) {
      if (v !== undefined && k !== 'sort_order' && k !== 'is_published') patch[k] = v;
    }
    patch.is_published = true;

    const supabase = getSupabaseAdmin();
    const { data: existing } = await supabase.from('news').select('id').eq('id', id).maybeSingle();

    if (!existing) {
      const fallback = defaultNewsArticles().find((a) => a.id === id);
      const insert = {
        id,
        title_zh: parsed.data.title_zh ?? fallback?.title_zh ?? '',
        title_en: parsed.data.title_en ?? fallback?.title_en ?? '',
        content_zh: parsed.data.content_zh ?? fallback?.content_zh ?? '',
        content_en: parsed.data.content_en ?? fallback?.content_en ?? '',
        image_url: parsed.data.image_url ?? fallback?.image_url ?? '',
        published_at:
          parsed.data.published_at !== undefined
            ? parsed.data.published_at
            : fallback?.published_at ?? null,
        sort_order: 999999,
        is_published: true,
      };
      const { error } = await supabase.from('news').insert(insert);
      if (error) return noStoreJson({ error: error.message }, { status: 500 });
      await placeNewNewsAt(supabase, id, desiredSort ?? null);
    } else {
      if (Object.keys(patch).length > 0) {
        const { error } = await supabase.from('news').update(patch).eq('id', id);
        if (error) return noStoreJson({ error: error.message }, { status: 500 });
      }
      if (desiredSort !== undefined) {
        await placeNewsAt(supabase, id, desiredSort);
      }
    }

    const { data, error: readErr } = await supabase.from('news').select(NEWS_COLS).eq('id', id).maybeSingle();
    if (readErr) return noStoreJson({ error: readErr.message }, { status: 500 });
    if (!data) return noStoreJson({ error: '不存在' }, { status: 404 });
    return noStoreJson({ ok: true, item: mapNewsRow(data as Record<string, unknown>) });
  } catch (e: any) {
    const status = e?.status === 401 ? 401 : 500;
    return noStoreJson({ error: e?.message || '更新失败' }, { status });
  }
}

export async function DELETE(_req: NextRequest, ctx: RouteCtx) {
  const id = ctx.params.id;
  if (!id) return noStoreJson({ error: '缺少 id' }, { status: 400 });

  try {
    await requireAdminSession();
    if (!hasSupabaseConfig()) {
      return noStoreJson({ error: '未配置 Supabase' }, { status: 503 });
    }

    const supabase = getSupabaseAdmin();
    const { data: row } = await supabase
      .from('news')
      .select('id, image_url')
      .eq('id', id)
      .maybeSingle();

    const { error } = await supabase.from('news').delete().eq('id', id);
    if (error) return noStoreJson({ error: error.message }, { status: 500 });

    // 库删成功后再清云文件，避免删失败却已丢图
    try {
      await removeNewsMediaAssets(id, row?.image_url ? String(row.image_url) : null);
    } catch (e) {
      console.error('[news DELETE] storage cleanup failed', e);
    }

    await normalizeNewsSortOrder(supabase);
    return noStoreJson({ ok: true, id });
  } catch (e: any) {
    const status = e?.status === 401 ? 401 : 500;
    return noStoreJson({ error: e?.message || '删除失败' }, { status });
  }
}
