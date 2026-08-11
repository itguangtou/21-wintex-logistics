import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin, hasSupabaseConfig } from '@/lib/supabase';
import { requireAdminSession } from '@/lib/auth';
import {
  defaultTimelineRows,
  type TimelineItemRow,
} from '@/lib/missionPageContent';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TimelineCreateSchema = z.object({
  year: z.string().min(1),
  project_name_zh: z.string(),
  project_name_en: z.string(),
  description_zh: z.string(),
  description_en: z.string(),
  parent_group: z.number().nullable().optional(),
  sort_order: z.number().int().optional(),
});

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

export async function GET() {
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ items: defaultTimelineRows(), source: 'default' });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('timeline_items')
      .select(
        'id, year, project_name_zh, project_name_en, description_zh, description_en, parent_group, sort_order, updated_at'
      )
      .order('year', { ascending: true })
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('[timeline GET]', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ items: defaultTimelineRows(), source: 'default' });
    }

    return NextResponse.json({
      items: data.map((row) => mapRow(row as Record<string, unknown>)),
      source: 'db',
    });
  } catch (e: any) {
    console.error('[timeline GET]', e);
    return NextResponse.json({ error: e?.message || '读取失败' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdminSession();
    if (!hasSupabaseConfig()) {
      return NextResponse.json({ error: '未配置 Supabase' }, { status: 503 });
    }

    const body = await req.json();
    const parsed = TimelineCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: '内容格式不正确', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    let sort_order = parsed.data.sort_order;
    if (sort_order == null) {
      const { data: last } = await supabase
        .from('timeline_items')
        .select('sort_order')
        .order('sort_order', { ascending: false })
        .limit(1)
        .maybeSingle();
      sort_order = (last?.sort_order ?? 0) + 10;
    }

    const insert = {
      year: parsed.data.year,
      project_name_zh: parsed.data.project_name_zh,
      project_name_en: parsed.data.project_name_en,
      description_zh: parsed.data.description_zh,
      description_en: parsed.data.description_en,
      parent_group: parsed.data.parent_group ?? null,
      sort_order,
    };

    const { data, error } = await supabase
      .from('timeline_items')
      .insert(insert)
      .select(
        'id, year, project_name_zh, project_name_en, description_zh, description_en, parent_group, sort_order, updated_at'
      )
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, item: mapRow(data as Record<string, unknown>) });
  } catch (e: any) {
    const status = e?.status === 401 ? 401 : 500;
    return NextResponse.json({ error: e?.message || '创建失败' }, { status });
  }
}
