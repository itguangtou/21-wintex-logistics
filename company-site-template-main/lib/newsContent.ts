import { unstable_noStore as noStore } from 'next/cache';
import { getSupabaseAdmin, hasSupabaseConfig } from '@/lib/supabase';
import { newsData } from '@/lib/newsData';

export type NewsArticle = {
  id: string;
  title_zh: string;
  title_en: string;
  content_zh: string;
  content_en: string;
  image_url: string;
  published_at: string | null;
  sort_order: number;
  is_published: boolean;
  updated_at?: string;
};

export type NewsPreview = {
  id: string;
  image: string;
  title: string;
  preview: string;
  date: string;
};

const DEFAULT_ORDER = ['3', '1', '2', '4'] as const;

export function defaultNewsArticles(): NewsArticle[] {
  return DEFAULT_ORDER.map((id, i) => {
    const n = newsData[id];
    return {
      id,
      title_zh: n.title.zh,
      title_en: n.title.en,
      content_zh: n.content.zh,
      content_en: n.content.en,
      image_url: n.image,
      published_at: null,
      sort_order: i + 1,
      is_published: true,
    };
  });
}

export function mapNewsRow(row: Record<string, unknown>): NewsArticle {
  return {
    id: String(row.id),
    title_zh: String(row.title_zh ?? ''),
    title_en: String(row.title_en ?? ''),
    content_zh: String(row.content_zh ?? ''),
    content_en: String(row.content_en ?? ''),
    image_url: String(row.image_url ?? ''),
    published_at: row.published_at ? String(row.published_at).slice(0, 10) : null,
    sort_order: Number(row.sort_order ?? 0),
    is_published: row.is_published !== false,
    updated_at: row.updated_at ? String(row.updated_at) : undefined,
  };
}

function removeHtmlTags(text: string) {
  return text.replace(/<[^>]*>/g, '').trim();
}

export function buildNewsPreview(article: NewsArticle, locale: 'zh' | 'en'): NewsPreview {
  const title = locale === 'en' ? article.title_en : article.title_zh;
  const content = locale === 'en' ? article.content_en : article.content_zh;

  let date = '';
  if (article.published_at) {
    date = article.published_at;
  } else {
    const dateMatch = content.match(/日期[：:]\s*(.+)|Date[：:]\s*(.+)/);
    if (dateMatch) date = (dateMatch[1] || dateMatch[2] || '').trim();
  }

  const lines = content.split('\n').filter((line) => {
    const trimmed = line.trim();
    return trimmed !== '' && !trimmed.match(/^(日期|Date)[：:]/);
  });
  const firstTwoLines = lines
    .slice(0, 2)
    .map((line) => removeHtmlTags(line.trim()))
    .join(' ');
  const previewText =
    firstTwoLines.length > 0 ? firstTwoLines : removeHtmlTags(content.substring(0, 100));

  return {
    id: article.id,
    image: article.image_url,
    title,
    preview: previewText,
    date,
  };
}

export const NEWS_PAGE_SIZE = 6;

export type NewsPageResult = {
  items: NewsArticle[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export function parseNewsPageParam(raw?: string): number {
  const n = parseInt(raw || '1', 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

function paginateArticles(
  articles: NewsArticle[],
  page: number,
  pageSize: number
): NewsPageResult {
  const total = articles.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    items: articles.slice(start, start + pageSize),
    page: safePage,
    pageSize,
    total,
    totalPages,
  };
}

export async function loadPublishedNews(): Promise<NewsArticle[]> {
  noStore();
  if (!hasSupabaseConfig()) return defaultNewsArticles();
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('news')
      .select(
        'id, title_zh, title_en, content_zh, content_en, image_url, published_at, sort_order, is_published, updated_at'
      )
      .eq('is_published', true)
      .order('sort_order', { ascending: true })
      .order('published_at', { ascending: false });

    if (error) {
      console.error('[news] list:', error.message);
      return defaultNewsArticles();
    }
    if (!data?.length) return defaultNewsArticles();
    return data.map((row) => mapNewsRow(row as Record<string, unknown>));
  } catch (e) {
    console.error('[news] list failed', e);
    return defaultNewsArticles();
  }
}

export async function loadPublishedNewsPage(
  page: number,
  pageSize = NEWS_PAGE_SIZE
): Promise<NewsPageResult> {
  noStore();
  const safePage = parseNewsPageParam(String(page));

  if (!hasSupabaseConfig()) {
    return paginateArticles(defaultNewsArticles(), safePage, pageSize);
  }

  try {
    const supabase = getSupabaseAdmin();
    const from = (safePage - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from('news')
      .select(
        'id, title_zh, title_en, content_zh, content_en, image_url, published_at, sort_order, is_published, updated_at',
        { count: 'exact' }
      )
      .eq('is_published', true)
      .order('sort_order', { ascending: true })
      .order('published_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('[news] page:', error.message);
      return paginateArticles(defaultNewsArticles(), safePage, pageSize);
    }

    const total = count ?? 0;
    if (total === 0) {
      return paginateArticles(defaultNewsArticles(), safePage, pageSize);
    }

    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const clampedPage = Math.min(safePage, totalPages);

    if (clampedPage !== safePage) {
      return loadPublishedNewsPage(clampedPage, pageSize);
    }

    return {
      items: (data ?? []).map((row) => mapNewsRow(row as Record<string, unknown>)),
      page: clampedPage,
      pageSize,
      total,
      totalPages,
    };
  } catch (e) {
    console.error('[news] page failed', e);
    return paginateArticles(defaultNewsArticles(), safePage, pageSize);
  }
}

export async function loadNewsById(id: string): Promise<NewsArticle | null> {
  noStore();
  if (!id) return null;
  if (!hasSupabaseConfig()) {
    return defaultNewsArticles().find((a) => a.id === id) || null;
  }
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('news')
      .select(
        'id, title_zh, title_en, content_zh, content_en, image_url, published_at, sort_order, is_published, updated_at'
      )
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('[news] byId:', error.message);
      return defaultNewsArticles().find((a) => a.id === id) || null;
    }
    if (!data) return defaultNewsArticles().find((a) => a.id === id) || null;
    return mapNewsRow(data as Record<string, unknown>);
  } catch (e) {
    console.error('[news] byId failed', e);
    return defaultNewsArticles().find((a) => a.id === id) || null;
  }
}
