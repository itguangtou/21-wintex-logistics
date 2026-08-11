'use client';

import React from 'react';

export type StatusFilter = 'all' | 'published' | 'draft';

type SearchBarProps = {
  keyword: string;
  onKeywordChange: (v: string) => void;
  status?: StatusFilter;
  onStatusChange?: (v: StatusFilter) => void;
  onCreate?: () => void;
  createLabel?: string;
  placeholder?: string;
  showStatus?: boolean;
};

export default function SearchBar({
  keyword,
  onKeywordChange,
  status = 'all',
  onStatusChange,
  onCreate,
  createLabel = '新建',
  placeholder = '搜索标题…',
  showStatus = true,
}: SearchBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <input
        type="search"
        value={keyword}
        onChange={(e) => onKeywordChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 min-w-[200px] flex-1 max-w-sm px-3 rounded-lg border border-gray-300 bg-white text-sm outline-none focus:border-[#0E2745] focus:ring-2 focus:ring-[#0E2745]/15"
      />
      {showStatus && onStatusChange && (
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value as StatusFilter)}
          className="h-10 px-3 rounded-lg border border-gray-300 bg-white text-sm outline-none focus:border-[#0E2745]"
        >
          <option value="all">全部状态</option>
          <option value="published">已发布</option>
          <option value="draft">草稿</option>
        </select>
      )}
      {onCreate && (
        <button
          type="button"
          onClick={onCreate}
          className="h-10 px-4 rounded-lg bg-[#0E2745] text-white text-sm font-medium hover:bg-[#163a5f] ml-auto"
        >
          {createLabel}
        </button>
      )}
    </div>
  );
}
