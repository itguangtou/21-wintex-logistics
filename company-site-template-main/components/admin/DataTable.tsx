'use client';

import React from 'react';

export type DataTableColumn<T> = {
  key: string;
  header: string;
  className?: string;
  render: (row: T) => React.ReactNode;
};

type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  emptyText?: string;
  /** 填满父容器并在表体区域纵向滚动（表头吸顶） */
  fillHeight?: boolean;
  className?: string;
};

export default function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  emptyText = '暂无数据',
  fillHeight = false,
  className = '',
}: DataTableProps<T>) {
  return (
    <div
      className={[
        'rounded-xl border border-gray-200 bg-white overflow-hidden',
        fillHeight ? 'flex flex-col min-h-0 h-full' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div
        className={[
          fillHeight ? 'flex-1 min-h-0 overflow-auto' : 'overflow-x-auto',
        ].join(' ')}
      >
        <table className="w-full text-sm text-left border-collapse">
          <thead
            className={[
              'bg-gray-50 text-gray-500 border-b border-gray-200',
              fillHeight ? 'sticky top-0 z-10 shadow-[0_1px_0_0_rgba(0,0,0,0.06)]' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 font-medium whitespace-nowrap bg-gray-50 ${col.className || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-gray-400">
                  {emptyText}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={rowKey(row)}
                  onClick={() => onRowClick?.(row)}
                  className={[
                    'border-b border-gray-100 last:border-0 bg-white',
                    onRowClick ? 'cursor-pointer hover:bg-gray-50' : '',
                  ].join(' ')}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={`px-4 py-3 align-middle ${col.className || ''}`}>
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
