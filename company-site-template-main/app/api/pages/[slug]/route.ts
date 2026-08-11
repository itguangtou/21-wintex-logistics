import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin, hasSupabaseConfig } from '@/lib/supabase';
import { getAdminSession, requireAdminSession } from '@/lib/auth';
import { DEFAULT_ABOUT_CONTENT, type AboutPageContent } from '@/lib/aboutPageContent';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const LocaleTextSchema = z.object({ zh: z.string(), en: z.string() });

const AboutContentSchema = z.object({
  backgroundImage: z.string(),
  intro: z.array(
    z.object({
      title: LocaleTextSchema,
      body: z.array(LocaleTextSchema).min(1),
    })
  ),
  network: z.object({
    centerLogo: z.string(),
    items: z.array(LocaleTextSchema).min(1),
  }),
});

function normalizeAbout(raw: unknown): AboutPageContent {
  const parsed = AboutContentSchema.safeParse(raw);
  if (parsed.success) return parsed.data;
  return structuredClone(DEFAULT_ABOUT_CONTENT);
}

type RouteCtx = { params: { slug: string } };

export async function GET(_req: NextRequest, ctx: RouteCtx) {
  const slug = ctx.params.slug;
  if (!slug) {
    return NextResponse.json({ error: '缺少 slug' }, { status: 400 });
  }

  if (!hasSupabaseConfig()) {
    if (slug === 'about') {
      return NextResponse.json({
        slug,
        status: 'published',
        content: DEFAULT_ABOUT_CONTENT,
        source: 'default',
      });
    }
    return NextResponse.json({ error: '未配置 Supabase' }, { status: 503 });
  }

  try {
    const session = await getAdminSession();
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('pages')
      .select('slug, content, draft_content, status, updated_at, updated_by')
      .eq('slug', slug)
      .maybeSingle();

    if (error) {
      console.error('[pages GET]', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      if (slug === 'about') {
        return NextResponse.json({
          slug,
          status: 'published',
          content: DEFAULT_ABOUT_CONTENT,
          source: 'default',
        });
      }
      return NextResponse.json({ error: '页面不存在' }, { status: 404 });
    }

    const content = session
      ? normalizeAbout(data.draft_content ?? data.content)
      : normalizeAbout(data.content);

    return NextResponse.json({
      slug: data.slug,
      status: data.status,
      content,
      updated_at: data.updated_at,
      updated_by: data.updated_by,
      source: 'db',
    });
  } catch (e: any) {
    console.error('[pages GET]', e);
    return NextResponse.json({ error: e?.message || '读取失败' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, ctx: RouteCtx) {
  const slug = ctx.params.slug;
  if (!slug) {
    return NextResponse.json({ error: '缺少 slug' }, { status: 400 });
  }

  try {
    const session = await requireAdminSession();
    if (!hasSupabaseConfig()) {
      return NextResponse.json({ error: '未配置 Supabase' }, { status: 503 });
    }

    const body = await req.json();
    const mode = body?.mode === 'draft' ? 'draft' : 'publish';
    const parsed = AboutContentSchema.safeParse(body?.content);
    if (!parsed.success) {
      return NextResponse.json(
        { error: '内容格式不正确', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const now = new Date().toISOString();
    const updated_by = session.username;
    const content = parsed.data;

    const { data: existing } = await supabase
      .from('pages')
      .select('slug, content')
      .eq('slug', slug)
      .maybeSingle();

    if (mode === 'draft') {
      if (existing) {
        const { error } = await supabase
          .from('pages')
          .update({
            draft_content: content,
            updated_at: now,
            updated_by,
          })
          .eq('slug', slug);
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
      } else {
        const { error } = await supabase.from('pages').insert({
          slug,
          content: slug === 'about' ? DEFAULT_ABOUT_CONTENT : content,
          draft_content: content,
          status: 'published',
          updated_at: now,
          updated_by,
        });
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
      }

      return NextResponse.json({ ok: true, mode: 'draft', slug, updated_at: now });
    }

    // publish：前台立刻读到新 content
    if (existing) {
      const { error } = await supabase
        .from('pages')
        .update({
          content,
          draft_content: content,
          status: 'published',
          updated_at: now,
          updated_by,
        })
        .eq('slug', slug);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else {
      const { error } = await supabase.from('pages').insert({
        slug,
        content,
        draft_content: content,
        status: 'published',
        updated_at: now,
        updated_by,
      });
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({
      ok: true,
      mode: 'publish',
      slug,
      status: 'published',
      updated_at: now,
    });
  } catch (e: any) {
    const status = e?.status === 401 ? 401 : 500;
    return NextResponse.json({ error: e?.message || '保存失败' }, { status });
  }
}
