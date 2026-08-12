import {
  buildNewsPreview,
  loadPublishedNews,
} from '@/lib/newsContent';
import HomePageClient from '@/components/home/HomePageClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function HomePage({
  params,
}: {
  params: { locale: string };
}) {
  const locale = params.locale === 'en' ? 'en' : 'zh';
  const articles = await loadPublishedNews();
  const newsItems = articles.slice(0, 4).map((a) => buildNewsPreview(a, locale));

  return <HomePageClient locale={params.locale} newsItems={newsItems} />;
}
