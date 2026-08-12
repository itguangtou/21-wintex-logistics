import Link from 'next/link';

type Props = {
  locale: string;
  page: number;
  totalPages: number;
  prevLabel: string;
  nextLabel: string;
};

function newsPageHref(lang: string, targetPage: number) {
  return targetPage <= 1 ? `/${lang}/news` : `/${lang}/news?page=${targetPage}`;
}

function getVisiblePages(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | 'ellipsis')[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) pages.push('ellipsis');
  for (let i = start; i <= end; i += 1) pages.push(i);
  if (end < total - 1) pages.push('ellipsis');
  if (total > 1) pages.push(total);

  return pages;
}

export default function NewsPagination({
  locale,
  page,
  totalPages,
  prevLabel,
  nextLabel,
}: Props) {
  if (totalPages <= 1) return null;

  const lang = locale === 'en' ? 'en' : 'zh';
  const pages = getVisiblePages(page, totalPages);
  const prevDisabled = page <= 1;
  const nextDisabled = page >= totalPages;

  const linkClass =
    'inline-flex h-10 min-w-10 items-center justify-center rounded-md border border-gray-200 px-3 text-sm font-medium text-brand-primary transition-colors hover:border-brand-primary hover:bg-brand-accent-50';
  const activeClass =
    'inline-flex h-10 min-w-10 items-center justify-center rounded-md border border-brand-primary bg-brand-primary px-3 text-sm font-medium text-white';
  const disabledClass =
    'inline-flex h-10 min-w-10 cursor-not-allowed items-center justify-center rounded-md border border-gray-100 px-3 text-sm font-medium text-gray-300';

  return (
    <nav
      className="mt-10 flex flex-wrap items-center justify-end gap-2"
      aria-label={locale === 'en' ? 'News pagination' : '新闻分页'}
    >
      {prevDisabled ? (
        <span className={disabledClass} aria-disabled="true">
          {prevLabel}
        </span>
      ) : (
        <Link href={newsPageHref(lang, page - 1)} className={linkClass} rel="prev">
          {prevLabel}
        </Link>
      )}

      {pages.map((item, index) =>
        item === 'ellipsis' ? (
          <span key={`ellipsis-${index}`} className="px-1 text-gray-400" aria-hidden="true">
            …
          </span>
        ) : item === page ? (
          <span key={item} className={activeClass} aria-current="page">
            {item}
          </span>
        ) : (
          <Link key={item} href={newsPageHref(lang, item)} className={linkClass}>
            {item}
          </Link>
        )
      )}

      {nextDisabled ? (
        <span className={disabledClass} aria-disabled="true">
          {nextLabel}
        </span>
      ) : (
        <Link href={newsPageHref(lang, page + 1)} className={linkClass} rel="next">
          {nextLabel}
        </Link>
      )}
    </nav>
  );
}
