import { unstable_noStore as noStore } from 'next/cache';
import { getSupabaseAdmin, hasSupabaseConfig } from '@/lib/supabase';

export type CareersJob = {
  id: string;
  title: { cn: string; en: string };
  salary?: { cn: string; en: string };
  description?: { cn: string; en: string };
  responsibilities?: { cn?: string; en?: string };
  requirements?: { cn?: string; en?: string };
  preferredConditions?: { cn?: string; en?: string };
  workLocation?: { cn?: string; en?: string };
};

export type CareersData = {
  jobs: CareersJob[];
  contact: {
    phone: string;
    email: string;
    address: { cn: string; en: string };
  };
};

const CAREERS_ROW_ID = 'main';

export function defaultCareersData(): CareersData {
  return {
    jobs: [
      {
        id: 'business',
        title: { cn: '商务助理', en: 'Business Assistant' },
        salary: { cn: '薪资待遇：面议', en: 'Salary: Negotiable' },
      },
      {
        id: 'translator',
        title: { cn: '现场翻译', en: 'On-site Translator' },
        salary: { cn: '薪资待遇：面议', en: 'Salary: Negotiable' },
      },
      {
        id: 'freight',
        title: { cn: '货代操作', en: 'Freight Forwarding Operator' },
        salary: { cn: '薪资待遇：面议', en: 'Salary: Negotiable' },
      },
    ],
    contact: {
      phone: '+63 9510941210',
      email: 'wintexlogistics@wintex.com.ph',
      address: {
        cn: '菲律宾马尼拉总部',
        en: 'Headquarters in Manila, Philippines',
      },
    },
  };
}

/** 将岗位正文（HTML li 或纯文本）拆成展示用行 */
export function jobFieldToLines(raw: string | undefined | null): string[] {
  if (!raw || !raw.trim()) return [];
  const content = raw.trim();

  if (content.startsWith('<')) {
    const items = Array.from(content.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)).map((m) =>
      m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
    );
    if (items.length > 0) return items.filter(Boolean);

    const plain = content.replace(/<[^>]+>/g, '\n');
    return plain
      .split(/\n+/)
      .map((l) => l.trim())
      .filter(Boolean);
  }

  return content
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);
}

export async function loadCareersData(): Promise<CareersData> {
  noStore();
  if (!hasSupabaseConfig()) {
    return defaultCareersData();
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('careers_data')
      .select('data')
      .eq('id', CAREERS_ROW_ID)
      .maybeSingle();

    if (error) {
      console.error('[careers page] load:', error.message);
      return defaultCareersData();
    }
    if (!data?.data) {
      return defaultCareersData();
    }
    return data.data as CareersData;
  } catch (e) {
    console.error('[careers page] load failed', e);
    return defaultCareersData();
  }
}
