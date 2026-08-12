import { loadCareersData } from '@/lib/careersContent';
import CareersPageView from '@/components/careers/CareersPageView';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function CareersPage({
  params,
}: {
  params: { locale: string };
}) {
  const data = await loadCareersData();
  return <CareersPageView locale={params.locale} data={data} />;
}
