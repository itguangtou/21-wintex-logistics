import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin, hasSupabaseConfig } from '@/lib/supabase';
import { requireAdminSession } from '@/lib/auth';
import type { TimelineItemRow } from '@/lib/missionPageContent';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TimelineUpdateSchema = z.object({
  year: z.string().min(1).optional(),
  project_name_zh: z.string().optional(),
  project_name_en: z.string().optional(),
  description_zh: z.string().optional(),
  description_en: z.string().optional(),
  parent_group: z.number().nullable().optional(),
  sort_order: z.number().int().optional(),
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

function mapRow(row: Record<string, unknown>): TimelineItemRow {
  return {
    id: Number(row.id),
    year: String(row.year ?? ''),
    project_name_zh: String(row.project_name_zh ?? ''),
    project_name_en: String(row.project_name_en ?? ''),
    description_zh: String(row.description_zh ?? ''),
    description_en: String(row.description_en ?? ''),
    parent_group: row.parent_group == null ? null : Number(row.parent_group),
    sort_order: Number(row.sort_order ?? 0),
    updated_at: row.updated_at ? String(row.updated_at) : undefined,
  };
}

type RouteCtx = { params: { id: string } };

export async function PUT(req: NextRequest, ctx: RouteCtx) {
  const id = Number(ctx.params.id);
  if (!Number.isFinite(id) || id <= 0) {
    return noStoreJson({ error: '无效 id' }, { status: 400 });
  }

  try {
    await requireAdminSession();
    if (!hasSupabaseConfig()) {
      return noStoreJson({ error: '未配置 Supabase' }, { status: 503 });
    }

    const body = await req.json();
    const parsed = TimelineUpdateSchema.safeParse(body);
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
    const { data, error } = await supabase
      .from('timeline_items')
      .update(patch)
      .eq('id', id)
      .select(
        'id, year, project_name_zh, project_name_en, description_zh, description_en, parent_group, sort_order, updated_at'
      )
      .maybeSingle();

    if (error) {
      return noStoreJson({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return noStoreJson({ error: '条目不存在' }, { status: 404 });
    }

    return noStoreJson({ ok: true, item: mapRow(data as Record<string, unknown>) });
  } catch (e: any) {
    const status = e?.status === 401 ? 401 : 500;
    return noStoreJson({ error: e?.message || '更新失败' }, { status });
  }
}

export async function DELETE(_req: NextRequest, ctx: RouteCtx) {
  const id = Number(ctx.params.id);
  if (!Number.isFinite(id) || id <= 0) {
    return noStoreJson({ error: '无效 id' }, { status: 400 });
  }

  try {
    await requireAdminSession();
    if (!hasSupabaseConfig()) {
      return noStoreJson({ error: '未配置 Supabase' }, { status: 503 });
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('timeline_items').delete().eq('id', id);
    if (error) {
      return noStoreJson({ error: error.message }, { status: 500 });
    }

    return noStoreJson({ ok: true, id });
  } catch (e: any) {
    const status = e?.status === 401 ? 401 : 500;
    return noStoreJson({ error: e?.message || '删除失败' }, { status });
  }
}
