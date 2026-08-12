import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin, hasSupabaseConfig } from '@/lib/supabase';
import { requireAdminSession } from '@/lib/auth';
import { defaultNewsArticles, mapNewsRow } from '@/lib/newsContent';

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
    const { data, error } = await supabase
      .from('news')
      .select(
        'id, title_zh, title_en, content_zh, content_en, image_url, published_at, sort_order, is_published, updated_at'
      )
      .eq('id', id)
      .maybeSingle();

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

    const patch: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(parsed.data)) {
      if (v !== undefined) patch[k] = v;
    }
    if (Object.keys(patch).length === 0) {
      return noStoreJson({ error: '无更新字段' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: existing } = await supabase.from('news').select('id').eq('id', id).maybeSingle();

    if (!existing) {
      // 从默认文案 upsert，便于首次编辑硬编码新闻
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
        sort_order: parsed.data.sort_order ?? fallback?.sort_order ?? 0,
        is_published: parsed.data.is_published ?? fallback?.is_published ?? true,
      };
      const { data, error } = await supabase
        .from('news')
        .insert(insert)
        .select(
          'id, title_zh, title_en, content_zh, content_en, image_url, published_at, sort_order, is_published, updated_at'
        )
        .single();
      if (error) return noStoreJson({ error: error.message }, { status: 500 });
      return noStoreJson({ ok: true, item: mapNewsRow(data as Record<string, unknown>) });
    }

    const { data, error } = await supabase
      .from('news')
      .update(patch)
      .eq('id', id)
      .select(
        'id, title_zh, title_en, content_zh, content_en, image_url, published_at, sort_order, is_published, updated_at'
      )
      .maybeSingle();

    if (error) return noStoreJson({ error: error.message }, { status: 500 });
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
    const { error } = await supabase.from('news').delete().eq('id', id);
    if (error) return noStoreJson({ error: error.message }, { status: 500 });
    return noStoreJson({ ok: true, id });
  } catch (e: any) {
    const status = e?.status === 401 ? 401 : 500;
    return noStoreJson({ error: e?.message || '删除失败' }, { status });
  }
}
