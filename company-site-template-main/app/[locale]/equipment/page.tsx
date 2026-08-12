import { unstable_noStore as noStore } from 'next/cache';
import { getSupabaseAdmin, hasSupabaseConfig } from '@/lib/supabase';
import {
  DEFAULT_EQUIPMENT_CONTENT,
  type EquipmentPageContent,
} from '@/lib/equipmentPageContent';
import EquipmentPageView from '@/components/equipment/EquipmentPageView';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

async function loadEquipmentContent(): Promise<EquipmentPageContent> {
  noStore();
  if (!hasSupabaseConfig()) {
    return structuredClone(DEFAULT_EQUIPMENT_CONTENT);
  }
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('pages')
      .select('content')
      .eq('slug', 'equipment')
      .maybeSingle();
    if (error || !data?.content) {
      if (error) console.error('[equipment page] load:', error.message);
      return structuredClone(DEFAULT_EQUIPMENT_CONTENT);
    }
    return data.content as EquipmentPageContent;
  } catch (e) {
    console.error('[equipment page] load failed', e);
    return structuredClone(DEFAULT_EQUIPMENT_CONTENT);
  }
}

export default async function EquipmentPage({
  params,
}: {
  params: { locale: string };
}) {
  const content = await loadEquipmentContent();
  return <EquipmentPageView locale={params.locale} content={content} />;
}
