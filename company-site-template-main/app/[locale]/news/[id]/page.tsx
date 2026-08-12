import { notFound } from 'next/navigation';
import { loadNewsById } from '@/lib/newsContent';
import NewsDetailView from '@/components/news/NewsDetailView';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function NewsDetailPage({
  params,
}: {
  params: { locale: string; id: string };
}) {
  const article = await loadNewsById(params.id);
  if (!article || !article.is_published) notFound();

  return <NewsDetailView locale={params.locale} article={article} />;
}
