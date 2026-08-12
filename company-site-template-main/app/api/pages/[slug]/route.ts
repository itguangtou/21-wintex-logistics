import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin, hasSupabaseConfig } from '@/lib/supabase';
import { getAdminSession, requireAdminSession } from '@/lib/auth';
import { DEFAULT_ABOUT_CONTENT, type AboutPageContent } from '@/lib/aboutPageContent';
import { DEFAULT_MISSION_CONTENT, type MissionPageContent } from '@/lib/missionPageContent';
import {
  DEFAULT_EQUIPMENT_CONTENT,
  type EquipmentPageContent,
} from '@/lib/equipmentPageContent';
import {
  DEFAULT_CONTACT_CONTENT,
  type ContactPageContent,
} from '@/lib/contactContent';

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

const MissionContentSchema = z.object({
  header: z.object({
    title: LocaleTextSchema,
    subtitle: LocaleTextSchema,
  }),
  focus: z.object({
    label: LocaleTextSchema,
    body: LocaleTextSchema,
    cards: z
      .array(
        z.object({
          image: z.string(),
          title: LocaleTextSchema,
          caption: LocaleTextSchema,
        })
      )
      .min(1),
  }),
});

const DetailCardSchema = z.object({
  title: LocaleTextSchema,
  desc: LocaleTextSchema,
});

const EquipmentContentSchema = z.object({
  pageTitle: LocaleTextSchema,
  gallery: z
    .array(
      z.object({
        image: z.string(),
        name: LocaleTextSchema,
      })
    )
    .length(4),
  detailModule1: z.object({
    row1: z.array(DetailCardSchema).length(3),
    row2: z.array(DetailCardSchema).length(2),
  }),
  detailModule2: z.object({
    row1: z.array(DetailCardSchema).length(2),
    row2: z.array(DetailCardSchema).length(2),
  }),
});

const ContactContentSchema = z.object({
  title: LocaleTextSchema,
  tel: LocaleTextSchema,
  email: LocaleTextSchema,
  address: LocaleTextSchema,
});

type SupportedSlug = 'about' | 'mission' | 'equipment' | 'contact';
type PageContent =
  | AboutPageContent
  | MissionPageContent
  | EquipmentPageContent
  | ContactPageContent;

function isSupportedSlug(slug: string): slug is SupportedSlug {
  return slug === 'about' || slug === 'mission' || slug === 'equipment' || slug === 'contact';
}

function defaultFor(slug: SupportedSlug): PageContent {
  if (slug === 'about') return structuredClone(DEFAULT_ABOUT_CONTENT);
  if (slug === 'mission') return structuredClone(DEFAULT_MISSION_CONTENT);
  if (slug === 'equipment') return structuredClone(DEFAULT_EQUIPMENT_CONTENT);
  return structuredClone(DEFAULT_CONTACT_CONTENT);
}

function normalizeContent(slug: SupportedSlug, raw: unknown): PageContent {
  if (slug === 'about') {
    const parsed = AboutContentSchema.safeParse(raw);
    if (parsed.success) return parsed.data;
    return structuredClone(DEFAULT_ABOUT_CONTENT);
  }
  if (slug === 'mission') {
    const parsed = MissionContentSchema.safeParse(raw);
    if (parsed.success) return parsed.data;
    return structuredClone(DEFAULT_MISSION_CONTENT);
  }
  if (slug === 'equipment') {
    const parsed = EquipmentContentSchema.safeParse(raw);
    if (parsed.success) return parsed.data;
    return structuredClone(DEFAULT_EQUIPMENT_CONTENT);
  }
  const parsed = ContactContentSchema.safeParse(raw);
  if (parsed.success) return parsed.data;
  return structuredClone(DEFAULT_CONTACT_CONTENT);
}

function parseContent(
  slug: SupportedSlug,
  raw: unknown
): { ok: true; data: PageContent } | { ok: false; error: z.ZodError } {
  if (slug === 'about') {
    const parsed = AboutContentSchema.safeParse(raw);
    return parsed.success ? { ok: true, data: parsed.data } : { ok: false, error: parsed.error };
  }
  if (slug === 'mission') {
    const parsed = MissionContentSchema.safeParse(raw);
    return parsed.success ? { ok: true, data: parsed.data } : { ok: false, error: parsed.error };
  }
  if (slug === 'equipment') {
    const parsed = EquipmentContentSchema.safeParse(raw);
    return parsed.success ? { ok: true, data: parsed.data } : { ok: false, error: parsed.error };
  }
  const parsed = ContactContentSchema.safeParse(raw);
  return parsed.success ? { ok: true, data: parsed.data } : { ok: false, error: parsed.error };
}

type RouteCtx = { params: { slug: string } };

function noStoreJson(body: unknown, init?: { status?: number }) {
  return NextResponse.json(body, {
    status: init?.status ?? 200,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      Pragma: 'no-cache',
    },
  });
}

export async function GET(_req: NextRequest, ctx: RouteCtx) {
  const slug = ctx.params.slug;
  if (!slug) {
    return noStoreJson({ error: '缺少 slug' }, { status: 400 });
  }

  if (!hasSupabaseConfig()) {
    if (isSupportedSlug(slug)) {
      return noStoreJson({
        slug,
        status: 'published',
        content: defaultFor(slug),
        source: 'default',
      });
    }
    return noStoreJson({ error: '未配置 Supabase' }, { status: 503 });
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
      return noStoreJson({ error: error.message }, { status: 500 });
    }

    if (!data) {
      if (isSupportedSlug(slug)) {
        return noStoreJson({
          slug,
          status: 'published',
          content: defaultFor(slug),
          source: 'default',
        });
      }
      return noStoreJson({ error: '页面不存在' }, { status: 404 });
    }

    if (!isSupportedSlug(slug)) {
      return noStoreJson({
        slug: data.slug,
        status: data.status,
        content: session ? data.draft_content ?? data.content : data.content,
        updated_at: data.updated_at,
        updated_by: data.updated_by,
        source: 'db',
      });
    }

    const content = session
      ? normalizeContent(slug, data.draft_content ?? data.content)
      : normalizeContent(slug, data.content);

    return noStoreJson({
      slug: data.slug,
      status: data.status,
      content,
      updated_at: data.updated_at,
      updated_by: data.updated_by,
      source: 'db',
    });
  } catch (e: any) {
    console.error('[pages GET]', e);
    return noStoreJson({ error: e?.message || '读取失败' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, ctx: RouteCtx) {
  const slug = ctx.params.slug;
  if (!slug) {
    return NextResponse.json({ error: '缺少 slug' }, { status: 400 });
  }
  if (!isSupportedSlug(slug)) {
    return NextResponse.json({ error: `暂不支持编辑页面: ${slug}` }, { status: 400 });
  }

  try {
    const session = await requireAdminSession();
    if (!hasSupabaseConfig()) {
      return NextResponse.json({ error: '未配置 Supabase' }, { status: 503 });
    }

    const body = await req.json();
    const mode = body?.mode === 'draft' ? 'draft' : 'publish';
    const parsed = parseContent(slug, body?.content);
    if (!parsed.ok) {
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
          content: defaultFor(slug),
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
