import { getTranslations } from 'next-intl/server';
import {
  buildNewsPreview,
  loadPublishedNewsPage,
  parseNewsPageParam,
} from '@/lib/newsContent';
import NewsListView from '@/components/news/NewsListView';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function NewsPage({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams: { page?: string };
}) {
  const locale = params.locale === 'en' ? 'en' : 'zh';
  const tHome = await getTranslations({ locale, namespace: 'home' });
  const tNews = await getTranslations({ locale, namespace: 'news' });
  const page = parseNewsPageParam(searchParams.page);
  const result = await loadPublishedNewsPage(page);
  const items = result.items.map((a) => buildNewsPreview(a, locale));

  return (
    <NewsListView
      locale={locale}
      title={tHome('allNews')}
      items={items}
      page={result.page}
      totalPages={result.totalPages}
      prevPageLabel={tNews('prevPage')}
      nextPageLabel={tNews('nextPage')}
    />
  );
}
