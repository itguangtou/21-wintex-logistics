import {
  buildNewsPreview,
  loadPublishedNews,
  type NewsArticle,
  type NewsPreview,
} from '@/lib/newsContent';
import {
  DEFAULT_CONTACT_CONTENT,
  pickLocale,
  type ContactPageContent,
} from '@/lib/contactContent';
import {
  DEFAULT_HOME_CONTENT,
  pickLocaleText,
  type HomePageContent,
} from '@/lib/homePageContent';
import {
  DEFAULT_EQUIPMENT_CONTENT,
  type EquipmentPageContent,
} from '@/lib/equipmentPageContent';
import { getSupabaseAdmin, hasSupabaseConfig } from '@/lib/supabase';
import HomePageClient from '@/components/home/HomePageClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

async function loadPageContent<T>(slug: string, fallback: T): Promise<T> {
  if (!hasSupabaseConfig()) return structuredClone(fallback);
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('pages')
      .select('content')
      .eq('slug', slug)
      .maybeSingle();
    if (error || !data?.content) return structuredClone(fallback);
    return data.content as T;
  } catch {
    return structuredClone(fallback);
  }
}

function resolveNewsItems(
  articles: NewsArticle[],
  featuredIds: string[],
  locale: 'zh' | 'en'
): NewsPreview[] {
  const byId = new Map(articles.map((a) => [a.id, a]));
  const picked: NewsPreview[] = [];
  for (const id of featuredIds.slice(0, 4)) {
    const article = byId.get(id);
    if (article) picked.push(buildNewsPreview(article, locale));
  }
  if (picked.length < 4) {
    for (const a of articles) {
      if (picked.some((p) => p.id === a.id)) continue;
      picked.push(buildNewsPreview(a, locale));
      if (picked.length >= 4) break;
    }
  }
  return picked.slice(0, 4);
}

function resolveEquipmentItems(
  equipment: EquipmentPageContent,
  indices: number[],
  locale: 'zh' | 'en'
) {
  const gallery = equipment.gallery?.length
    ? equipment.gallery
    : DEFAULT_EQUIPMENT_CONTENT.gallery;
  const lang = locale === 'en' ? 'en' : 'zh';
  return indices.slice(0, 4).map((i) => {
    const item = gallery[i] ?? gallery[0] ?? DEFAULT_EQUIPMENT_CONTENT.gallery[0];
    return {
      image: item.image,
      name: item.name[lang],
    };
  });
}

export default async function HomePage({
  params,
}: {
  params: { locale: string };
}) {
  const locale = params.locale === 'en' ? 'en' : 'zh';
  const [articles, contact, homeRaw, equipment] = await Promise.all([
    loadPublishedNews(),
    loadPageContent<ContactPageContent>('contact', DEFAULT_CONTACT_CONTENT),
    loadPageContent<HomePageContent>('home', DEFAULT_HOME_CONTENT),
    loadPageContent<EquipmentPageContent>('equipment', DEFAULT_EQUIPMENT_CONTENT),
  ]);

  const home: HomePageContent = {
    ...DEFAULT_HOME_CONTENT,
    ...homeRaw,
    about: { ...DEFAULT_HOME_CONTENT.about, ...homeRaw.about },
    strength: { ...DEFAULT_HOME_CONTENT.strength, ...homeRaw.strength },
    news: { ...DEFAULT_HOME_CONTENT.news, ...homeRaw.news },
    equipment: { ...DEFAULT_HOME_CONTENT.equipment, ...homeRaw.equipment },
  };

  const newsItems = resolveNewsItems(articles, home.news.featuredIds, locale);
  const equipmentItems = resolveEquipmentItems(
    equipment,
    home.equipment.featuredIndices,
    locale
  );

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
      about={{
        title: pickLocaleText(home.about.title, locale),
        subtitle: pickLocaleText(home.about.subtitle, locale),
        desc: pickLocaleText(home.about.desc, locale),
        ctaLabel: pickLocaleText(home.about.ctaLabel, locale),
        image: home.about.image,
      }}
      strength={{
        title: pickLocaleText(home.strength.title, locale),
        subtitle: pickLocaleText(home.strength.subtitle, locale),
        desc: pickLocaleText(home.strength.desc, locale),
        ctaLabel: pickLocaleText(home.strength.ctaLabel, locale),
        image: home.strength.image,
      }}
      newsSection={{
        sectionTitle: pickLocaleText(home.news.sectionTitle, locale),
        allNewsLabel: pickLocaleText(home.news.allNewsLabel, locale),
      }}
      equipmentSection={{
        sectionTitle: pickLocaleText(home.equipment.sectionTitle, locale),
        ctaLabel: pickLocaleText(home.equipment.ctaLabel, locale),
        items: equipmentItems,
      }}
    />
  );
}
