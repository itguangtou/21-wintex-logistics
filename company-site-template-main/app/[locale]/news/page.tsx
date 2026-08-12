import { getTranslations } from 'next-intl/server';
import {
  buildNewsPreview,
  loadPublishedNews,
} from '@/lib/newsContent';
import NewsListView from '@/components/news/NewsListView';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function NewsPage({
  params,
}: {
  params: { locale: string };
}) {
  const locale = params.locale === 'en' ? 'en' : 'zh';
  const t = await getTranslations({ locale, namespace: 'home' });
  const articles = await loadPublishedNews();
  const items = articles.map((a) => buildNewsPreview(a, locale));

  return <NewsListView locale={locale} title={t('allNews')} items={items} />;
}
