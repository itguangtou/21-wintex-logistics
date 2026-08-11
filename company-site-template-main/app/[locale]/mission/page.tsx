import { unstable_noStore as noStore } from 'next/cache';
import { getSupabaseAdmin, hasSupabaseConfig } from '@/lib/supabase';
import {
  DEFAULT_MISSION_CONTENT,
  defaultTimelineRows,
  groupTimelineByYear,
  type MissionPageContent,
  type TimelineItemRow,
} from '@/lib/missionPageContent';
import MissionPageView from '@/components/mission/MissionPageView';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

async function loadMissionContent(): Promise<MissionPageContent> {
  noStore();
  if (!hasSupabaseConfig()) {
    return structuredClone(DEFAULT_MISSION_CONTENT);
  }
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('pages')
      .select('content')
      .eq('slug', 'mission')
      .maybeSingle();
    if (error || !data?.content) {
      console.error('[mission page] load:', error?.message);
      return structuredClone(DEFAULT_MISSION_CONTENT);
    }
    return data.content as MissionPageContent;
  } catch (e) {
    console.error('[mission page] load failed', e);
    return structuredClone(DEFAULT_MISSION_CONTENT);
  }
}

async function loadTimelineRows(): Promise<TimelineItemRow[]> {
  noStore();
  if (!hasSupabaseConfig()) {
    return defaultTimelineRows();
  }
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('timeline_items')
      .select(
        'id, year, project_name_zh, project_name_en, description_zh, description_en, parent_group, sort_order, updated_at'
      )
      .order('sort_order', { ascending: true })
      .order('id', { ascending: true });

    if (error) {
      console.error('[mission timeline] load:', error.message);
      return defaultTimelineRows();
    }
    if (!data || data.length === 0) {
      return defaultTimelineRows();
    }
    return data.map((row) => ({
      id: Number(row.id),
      year: String(row.year ?? ''),
      project_name_zh: String(row.project_name_zh ?? ''),
      project_name_en: String(row.project_name_en ?? ''),
      description_zh: String(row.description_zh ?? ''),
      description_en: String(row.description_en ?? ''),
      parent_group: row.parent_group == null ? null : Number(row.parent_group),
      sort_order: Number(row.sort_order ?? 0),
      updated_at: row.updated_at ? String(row.updated_at) : undefined,
    }));
  } catch (e) {
    console.error('[mission timeline] load failed', e);
    return defaultTimelineRows();
  }
}

export default async function MissionPage({
  params,
}: {
  params: { locale: string };
}) {
  const lang = params.locale === 'en' ? 'en' : 'zh';
  const [content, timelineRows] = await Promise.all([
    loadMissionContent(),
    loadTimelineRows(),
  ]);
  const timelineGroups = groupTimelineByYear(timelineRows, lang);

  return (
    <MissionPageView
      locale={params.locale}
      content={content}
      timelineGroups={timelineGroups}
    />
  );
}
