import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin, hasSupabaseConfig } from '@/lib/supabase';
import { requireAdminSession } from '@/lib/auth';
import { defaultNewsArticles, mapNewsRow } from '@/lib/newsContent';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NewsCreateSchema = z.object({
  id: z.string().min(1).optional(),
  title_zh: z.string(),
  title_en: z.string(),
  content_zh: z.string(),
  content_en: z.string(),
  image_url: z.string(),
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

export async function GET(req: NextRequest) {
  const admin = !!req.nextUrl.searchParams.get('all');
  // all=1 仅管理端；未登录时忽略 all
  let wantAll = false;
  if (admin) {
    try {
      await requireAdminSession();
      wantAll = true;
    } catch {
      wantAll = false;
    }
  }

  if (!hasSupabaseConfig()) {
    const items = defaultNewsArticles().filter((a) => wantAll || a.is_published);
    return noStoreJson({ items, source: 'default' });
  }

  try {
    const supabase = getSupabaseAdmin();
    let q = supabase
      .from('news')
      .select(
        'id, title_zh, title_en, content_zh, content_en, image_url, published_at, sort_order, is_published, updated_at'
      )
      .order('sort_order', { ascending: true })
      .order('published_at', { ascending: false });

    if (!wantAll) q = q.eq('is_published', true);

    const { data, error } = await q;
    if (error) return noStoreJson({ error: error.message }, { status: 500 });

    if (!data?.length) {
      const items = defaultNewsArticles().filter((a) => wantAll || a.is_published);
      return noStoreJson({ items, source: 'default' });
    }

    return noStoreJson({
      items: data.map((row) => mapNewsRow(row as Record<string, unknown>)),
      source: 'db',
    });
  } catch (e: any) {
    return noStoreJson({ error: e?.message || '读取失败' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdminSession();
    if (!hasSupabaseConfig()) {
      return noStoreJson({ error: '未配置 Supabase' }, { status: 503 });
    }

    const body = await req.json();
    const parsed = NewsCreateSchema.safeParse(body);
    if (!parsed.success) {
      return noStoreJson(
        { error: '内容格式不正确', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    let sort_order = parsed.data.sort_order;
    if (sort_order == null) {
      const { data: last } = await supabase
        .from('news')
        .select('sort_order')
        .order('sort_order', { ascending: false })
        .limit(1)
        .maybeSingle();
      sort_order = (last?.sort_order ?? 0) + 1;
    }

    const id = parsed.data.id?.trim() || `n-${Date.now()}`;
    const insert = {
      id,
      title_zh: parsed.data.title_zh,
      title_en: parsed.data.title_en,
      content_zh: parsed.data.content_zh,
      content_en: parsed.data.content_en,
      image_url: parsed.data.image_url,
      published_at: parsed.data.published_at || null,
      sort_order,
      // 有记录即前台可见；删除即消失，不再做草稿态
      is_published: true,
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
  } catch (e: any) {
    const status = e?.status === 401 ? 401 : 500;
    return noStoreJson({ error: e?.message || '创建失败' }, { status });
  }
}
