'use client';

type Props = {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  pageSize?: number;
  pageSizeOptions?: number[];
  onPageSizeChange?: (size: number) => void;
};

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

export default function AdminPagination({
  page,
  totalPages,
  onChange,
  pageSize,
  pageSizeOptions = [5, 10, 20, 50],
  onPageSizeChange,
}: Props) {
  const pages = getVisiblePages(page, Math.max(1, totalPages));
  const prevDisabled = page <= 1;
  const nextDisabled = page >= totalPages;

  const btn =
    'inline-flex h-9 min-w-9 items-center justify-center rounded-md border border-gray-200 px-2.5 text-sm font-medium text-[#0E2745] transition-colors hover:border-[#0E2745] hover:bg-gray-50 disabled:cursor-not-allowed disabled:border-gray-100 disabled:text-gray-300 disabled:hover:bg-transparent';
  const active =
    'inline-flex h-9 min-w-9 items-center justify-center rounded-md border border-[#0E2745] bg-[#0E2745] px-2.5 text-sm font-medium text-white';

  return (
    <div className="flex flex-wrap items-center justify-end gap-3">
      {onPageSizeChange && pageSize != null && (
        <label className="flex items-center gap-2 text-xs text-gray-500">
          <span>每页</span>
          <select
            className="h-9 rounded-md border border-gray-200 bg-white px-2 text-sm text-[#0E2745] outline-none focus:border-[#0E2745]"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
          >
            {pageSizeOptions.map((n) => (
              <option key={n} value={n}>
                {n} 条
              </option>
            ))}
          </select>
        </label>
      )}

      <nav className="flex flex-wrap items-center justify-end gap-1.5" aria-label="列表分页">
        <button
          type="button"
          className={btn}
          disabled={prevDisabled || totalPages <= 1}
          onClick={() => onChange(page - 1)}
        >
          上一页
        </button>

        {totalPages > 1 &&
          pages.map((item, index) =>
            item === 'ellipsis' ? (
              <span key={`ellipsis-${index}`} className="px-1 text-gray-400" aria-hidden="true">
                …
              </span>
            ) : item === page ? (
              <span key={item} className={active} aria-current="page">
                {item}
              </span>
            ) : (
              <button key={item} type="button" className={btn} onClick={() => onChange(item)}>
                {item}
              </button>
            )
          )}

        <button
          type="button"
          className={btn}
          disabled={nextDisabled || totalPages <= 1}
          onClick={() => onChange(page + 1)}
        >
          下一页
        </button>
      </nav>
    </div>
  );
}
