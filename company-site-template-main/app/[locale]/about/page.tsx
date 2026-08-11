import { unstable_noStore as noStore } from 'next/cache';
import { getSupabaseAdmin, hasSupabaseConfig } from '@/lib/supabase';
import {
  DEFAULT_ABOUT_CONTENT,
  type AboutPageContent,
} from '@/lib/aboutPageContent';
import AboutPageClient from '@/components/about/AboutPageClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

async function loadAboutContent(): Promise<AboutPageContent> {
  noStore();
  if (!hasSupabaseConfig()) {
    return structuredClone(DEFAULT_ABOUT_CONTENT);
  }
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('pages')
      .select('content')
      .eq('slug', 'about')
      .maybeSingle();
    if (error || !data?.content) {
      console.error('[about page] load:', error?.message);
      return structuredClone(DEFAULT_ABOUT_CONTENT);
    }
    return data.content as AboutPageContent;
  } catch (e) {
    console.error('[about page] load failed', e);
    return structuredClone(DEFAULT_ABOUT_CONTENT);
  }
}

export default async function AboutPage({
  params,
}: {
  params: { locale: string };
}) {
  const content = await loadAboutContent();
  return <AboutPageClient locale={params.locale} initialContent={content} />;
}
