// app/api/careers/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';
import { getSupabaseAdmin, hasSupabaseConfig } from '@/lib/supabase';
import { requireAdminSession } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DATA_FILE = path.join(process.cwd(), 'data', 'careers.json');
const CAREERS_ROW_ID = 'main';

const CareersSchema = z.object({
  jobs: z.array(
    z.object({
      id: z.string(),
      title: z.object({ cn: z.string(), en: z.string() }),
      salary: z.object({ cn: z.string(), en: z.string() }).optional(),
      description: z.object({ cn: z.string(), en: z.string() }).optional(),
      responsibilities: z
        .object({
          cn: z.string().optional(),
          en: z.string().optional(),
        })
        .optional(),
      requirements: z
        .object({
          cn: z.string().optional(),
          en: z.string().optional(),
        })
        .optional(),
      workLocation: z
        .object({
          cn: z.string().optional(),
          en: z.string().optional(),
        })
        .optional(),
      preferredConditions: z
        .object({
          cn: z.string().optional(),
          en: z.string().optional(),
        })
        .optional(),
    })
  ),
  contact: z.object({
    phone: z.string(),
    email: z.string(),
    address: z.object({ cn: z.string(), en: z.string() }),
  }),
});

type CareersData = z.infer<typeof CareersSchema>;

const getDefaultData = (): CareersData => ({
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
});

async function readFromFile(): Promise<CareersData> {
  try {
    const buf = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(buf) as CareersData;
  } catch {
    return getDefaultData();
  }
}

async function writeToFile(data: CareersData): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

async function readStore(): Promise<CareersData> {
  if (hasSupabaseConfig()) {
    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from('careers_data')
        .select('data')
        .eq('id', CAREERS_ROW_ID)
        .maybeSingle();

      if (error) {
        console.error('[Careers API] Supabase read error:', error.message);
        throw error;
      }

      if (data?.data) {
        return data.data as CareersData;
      }

      // 表中无数据：用本地文件种子一次
      const seed = await readFromFile();
      await writeStore(seed);
      return seed;
    } catch (error: any) {
      console.error('[Careers API] Supabase read failed:', error?.message || error);
      // 仅本地开发回退文件；生产环境应报错
      if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
        throw new Error(
          `Supabase 读取失败：${error?.message || 'Unknown error'}。请检查环境变量是否已配置。`
        );
      }
      return readFromFile();
    }
  }

  // 未配置 Supabase：本地开发用文件
  return readFromFile();
}

async function writeStore(payload: CareersData): Promise<void> {
  if (hasSupabaseConfig()) {
    try {
      const supabase = getSupabaseAdmin();
      const { error } = await supabase.from('careers_data').upsert(
        {
          id: CAREERS_ROW_ID,
          data: payload,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

      if (error) {
        console.error('[Careers API] Supabase write error:', error.message);
        throw error;
      }
      return;
    } catch (error: any) {
      console.error('[Careers API] Supabase write failed:', error?.message || error);
      if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
        throw new Error(
          `Supabase 写入失败：${error?.message || 'Unknown error'}。请检查环境变量 NEXT_PUBLIC_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY。`
        );
      }
      // 本地开发回退文件
      await writeToFile(payload);
      return;
    }
  }

  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    throw new Error(
      '生产环境需要配置 Supabase。请在 Vercel 环境变量中设置 NEXT_PUBLIC_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY。'
    );
  }

  await writeToFile(payload);
}

function normalizeJobData(data: any) {
  if (Array.isArray(data.jobs)) {
    data.jobs = data.jobs.map((job: any) => {
      const normalized = { ...job };

      const stringFields = [
        'requirements',
        'responsibilities',
        'workLocation',
        'preferredConditions',
      ] as const;

      for (const field of stringFields) {
        if (normalized[field]) {
          if (Array.isArray(normalized[field].cn)) {
            normalized[field].cn = normalized[field].cn.join('\n');
          }
          if (Array.isArray(normalized[field].en)) {
            normalized[field].en = normalized[field].en.join('\n');
          }
        }
      }

      return normalized;
    });
  }
  return data;
}

const noStoreHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
  'X-Content-Type-Options': 'nosniff',
};

export async function GET() {
  try {
    const data = await readStore();
    const normalized = normalizeJobData(data);
    return NextResponse.json(normalized, { headers: noStoreHeaders });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || 'Server error' },
      { status: 500, headers: noStoreHeaders }
    );
  }
}

async function saveCareers(req: Request) {
  try {
    await requireAdminSession();
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || '未登录或登录已过期' },
      { status: e?.status || 401, headers: noStoreHeaders }
    );
  }

  try {
    const body = await req.json();
    const normalized = normalizeJobData(body);
    const parsed = CareersSchema.parse(normalized);

    try {
      await writeStore(parsed);
      return NextResponse.json({ ok: true }, { headers: noStoreHeaders });
    } catch (writeError: any) {
      console.error('[Careers API] Write error:', writeError?.message || writeError);
      return NextResponse.json(
        {
          ok: false,
          error: writeError.message || '写入失败',
          code: 'STORAGE_ERROR',
          suggestion:
            '请确保 Vercel 已配置 NEXT_PUBLIC_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY。',
        },
        { status: 500, headers: noStoreHeaders }
      );
    }
  } catch (e: any) {
    if (e.name === 'ZodError') {
      return NextResponse.json(
        { ok: false, error: e?.message || 'Invalid payload' },
        { status: 400, headers: noStoreHeaders }
      );
    }
    return NextResponse.json(
      { ok: false, error: e?.message || 'Server error' },
      { status: 500, headers: noStoreHeaders }
    );
  }
}

export async function PUT(req: Request) {
  return saveCareers(req);
}

export async function POST(req: Request) {
  return saveCareers(req);
}
