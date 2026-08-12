import {
  buildNewsPreview,
  loadPublishedNews,
} from '@/lib/newsContent';
import {
  DEFAULT_CONTACT_CONTENT,
  pickLocale,
  type ContactPageContent,
} from '@/lib/contactContent';
import { getSupabaseAdmin, hasSupabaseConfig } from '@/lib/supabase';
import HomePageClient from '@/components/home/HomePageClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

async function loadContactContent(): Promise<ContactPageContent> {
  if (!hasSupabaseConfig()) return structuredClone(DEFAULT_CONTACT_CONTENT);
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('pages')
      .select('content')
      .eq('slug', 'contact')
      .maybeSingle();
    if (error || !data?.content) return structuredClone(DEFAULT_CONTACT_CONTENT);
    const c = data.content as Partial<ContactPageContent>;
    return {
      title: {
        zh: c.title?.zh ?? DEFAULT_CONTACT_CONTENT.title.zh,
        en: c.title?.en ?? DEFAULT_CONTACT_CONTENT.title.en,
      },
      tel: {
        zh: c.tel?.zh ?? DEFAULT_CONTACT_CONTENT.tel.zh,
        en: c.tel?.en ?? DEFAULT_CONTACT_CONTENT.tel.en,
      },
      email: {
        zh: c.email?.zh ?? DEFAULT_CONTACT_CONTENT.email.zh,
        en: c.email?.en ?? DEFAULT_CONTACT_CONTENT.email.en,
      },
      address: {
        zh: c.address?.zh ?? DEFAULT_CONTACT_CONTENT.address.zh,
        en: c.address?.en ?? DEFAULT_CONTACT_CONTENT.address.en,
      },
    };
  } catch {
    return structuredClone(DEFAULT_CONTACT_CONTENT);
  }
}

export default async function HomePage({
  params,
}: {
  params: { locale: string };
}) {
  const locale = params.locale === 'en' ? 'en' : 'zh';
  const [articles, contact] = await Promise.all([loadPublishedNews(), loadContactContent()]);
  const newsItems = articles.slice(0, 4).map((a) => buildNewsPreview(a, locale));

  return (
    <HomePageClient
      locale={params.locale}
      newsItems={newsItems}
      contact={{
        title: pickLocale(contact.title, locale),
        tel: pickLocale(contact.tel, locale),
        email: pickLocale(contact.email, locale),
        address: pickLocale(contact.address, locale),
      }}
    />
  );
}
