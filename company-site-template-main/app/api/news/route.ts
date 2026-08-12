import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin, hasSupabaseConfig } from '@/lib/supabase';
import { requireAdminSession } from '@/lib/auth';
import { defaultNewsArticles, mapNewsRow } from '@/lib/newsContent';
import { placeNewNewsAt } from '@/lib/newsSort';
import { promoteNewsDraftCover } from '@/lib/mediaUpload';

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

const NEWS_COLS =
  'id, title_zh, title_en, content_zh, content_en, image_url, published_at, sort_order, is_published, updated_at';

export async function GET(req: NextRequest) {
  const admin = !!req.nextUrl.searchParams.get('all');
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
      .select(NEWS_COLS)
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
    const id = parsed.data.id?.trim() || `n-${Date.now()}`;

    let image_url = parsed.data.image_url || '';
    try {
      image_url = await promoteNewsDraftCover(image_url, id);
    } catch (e) {
      console.error('[news POST] promote cover failed', e);
    }

    // 先插入末尾占位，再按目标位重排为连续 1..n
    const insert = {
      id,
      title_zh: parsed.data.title_zh,
      title_en: parsed.data.title_en,
      content_zh: parsed.data.content_zh,
      content_en: parsed.data.content_en,
      image_url,
      published_at: parsed.data.published_at || null,
      sort_order: 999999,
      is_published: true,
    };

    const { error } = await supabase.from('news').insert(insert);
    if (error) return noStoreJson({ error: error.message }, { status: 500 });

    await placeNewNewsAt(supabase, id, parsed.data.sort_order ?? null);

    const { data, error: readErr } = await supabase.from('news').select(NEWS_COLS).eq('id', id).single();
    if (readErr) return noStoreJson({ error: readErr.message }, { status: 500 });

    return noStoreJson({ ok: true, item: mapNewsRow(data as Record<string, unknown>) });
  } catch (e: any) {
    const status = e?.status === 401 ? 401 : 500;
    return noStoreJson({ error: e?.message || '创建失败' }, { status });
  }
}
