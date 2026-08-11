// app/api/careers/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';

export const runtime = 'nodejs'; // 允许使用 fs

const DATA_FILE = path.join(process.cwd(), 'data', 'careers.json');

// 尝试导入 KV/Redis 客户端（如果可用）
let kv: any = null;
let useKV = false;

async function initKV() {
  if (useKV && kv) return kv;
  
  // 优先检查 Upstash 环境变量（Vercel 集成后自动添加）
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      const upstashModule = await import('@upstash/redis');
      kv = new upstashModule.Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
      useKV = true;
      return kv;
    } catch (error) {
      console.warn('@upstash/redis not available, trying @vercel/kv');
    }
  }
  
  // 检查 Vercel KV 环境变量
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    try {
      const kvModule = await import('@vercel/kv');
      kv = kvModule.kv;
      useKV = true;
      return kv;
    } catch (error) {
      console.warn('@vercel/kv not available, using file system');
      useKV = false;
      return null;
    }
  }
  return null;
}

const KV_KEY = 'careers:data';

const CareersSchema = z.object({
  jobs: z.array(
    z.object({
      id: z.string(),
      title: z.object({ cn: z.string(), en: z.string() }),
      salary: z.object({ cn: z.string(), en: z.string() }).optional(),
      description: z.object({ cn: z.string(), en: z.string() }).optional(),
      responsibilities: z.object({
        cn: z.string().optional(),
        en: z.string().optional()
      }).optional(),
      requirements: z.object({
        cn: z.string().optional(),
        en: z.string().optional()
      }).optional(),
      workLocation: z.object({
        cn: z.string().optional(),
        en: z.string().optional()
      }).optional(),
      preferredConditions: z.object({
        cn: z.string().optional(),
        en: z.string().optional()
      }).optional()
    })
  ),
  contact: z.object({
    phone: z.string(),
    email: z.string(),
    address: z.object({ cn: z.string(), en: z.string() })
  })
});

// 默认数据
const getDefaultData = () => ({
  jobs: [
    { id: 'business', title: { cn: '商务助理', en: 'Business Assistant' }, salary: { cn: '薪资待遇：面议', en: 'Salary: Negotiable' } },
    { id: 'translator', title: { cn: '现场翻译', en: 'On-site Translator' }, salary: { cn: '薪资待遇：面议', en: 'Salary: Negotiable' } },
    { id: 'freight', title: { cn: '货代操作', en: 'Freight Forwarding Operator' }, salary: { cn: '薪资待遇：面议', en: 'Salary: Negotiable' } }
  ],
  contact: {
    phone: '+63 9510941210',
    email: 'wintexlogistics@wintex.com.ph',
    address: { cn: '菲律宾马尼拉总部', en: 'Headquarters in Manila, Philippines' }
  }
});

// 读数据（优先使用 KV/Redis，否则使用文件系统）
async function readStore() {
  // 尝试使用 KV/Redis
  const kvInstance = await initKV();
  if (kvInstance) {
    try {
      // Upstash Redis 和 Vercel KV 都使用 get 方法
      const data = await kvInstance.get(KV_KEY);
      if (data) {
        return data;
      }
    } catch (error) {
      console.error('KV/Redis read error:', error);
      // KV 读取失败，继续尝试文件系统
    }
  }
  
  // 使用文件系统
  try {
    const buf = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(buf);
  } catch {
    // 返回默认数据
    return getDefaultData();
  }
}

async function writeStore(data: unknown) {
  // 优先使用 KV/Redis
  const kvInstance = await initKV();
  if (kvInstance) {
    try {
      // Upstash Redis 和 Vercel KV 都使用 set 方法
      await kvInstance.set(KV_KEY, data);
      return; // 成功写入 KV/Redis，直接返回
    } catch (error: any) {
      console.error('KV/Redis write error:', error);
      // 在生产环境中，如果 KV 写入失败，应该抛出错误而不是回退到文件系统
      if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
        throw new Error(`KV/Redis 写入失败：${error?.message || 'Unknown error'}。请检查环境变量 KV_REST_API_URL 和 KV_REST_API_TOKEN 是否正确配置。`);
      }
      // 开发环境中，如果 KV 失败，继续尝试文件系统
    }
  }
  
  // 在生产环境中，如果没有 KV 配置，应该抛出错误
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    throw new Error('生产环境需要配置 Vercel KV 或 Upstash Redis。\n\n请确保在 Vercel 项目设置中配置了以下环境变量：\n- KV_REST_API_URL\n- KV_REST_API_TOKEN\n\n或\n- UPSTASH_REDIS_REST_URL\n- UPSTASH_REDIS_REST_TOKEN');
  }
  
  // 使用文件系统（仅开发环境）
  try {
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error: any) {
    // 如果是只读文件系统错误，提供更清晰的错误信息
    if (error.code === 'EROFS' || error.message?.includes('read-only')) {
      throw new Error('文件系统只读：在生产环境中无法直接写入文件。请配置 Vercel KV 或 Upstash Redis。');
    }
    throw error;
  }
}

// 转换数据格式：将数组格式的 requirements 转换为字符串
function normalizeJobData(data: any) {
  if (Array.isArray(data.jobs)) {
    data.jobs = data.jobs.map((job: any) => {
      const normalized = { ...job };
      
      // 转换 requirements：如果是数组，转换为字符串
      if (normalized.requirements) {
        if (Array.isArray(normalized.requirements.cn)) {
          normalized.requirements.cn = normalized.requirements.cn.join('\n');
        }
        if (Array.isArray(normalized.requirements.en)) {
          normalized.requirements.en = normalized.requirements.en.join('\n');
        }
      }
      
      // 转换 responsibilities：如果是数组，转换为字符串
      if (normalized.responsibilities) {
        if (Array.isArray(normalized.responsibilities.cn)) {
          normalized.responsibilities.cn = normalized.responsibilities.cn.join('\n');
        }
        if (Array.isArray(normalized.responsibilities.en)) {
          normalized.responsibilities.en = normalized.responsibilities.en.join('\n');
        }
      }
      
      // 转换 workLocation：如果是数组，转换为字符串
      if (normalized.workLocation) {
        if (Array.isArray(normalized.workLocation.cn)) {
          normalized.workLocation.cn = normalized.workLocation.cn.join('\n');
        }
        if (Array.isArray(normalized.workLocation.en)) {
          normalized.workLocation.en = normalized.workLocation.en.join('\n');
        }
      }
      
      // 转换 preferredConditions：如果是数组，转换为字符串
      if (normalized.preferredConditions) {
        if (Array.isArray(normalized.preferredConditions.cn)) {
          normalized.preferredConditions.cn = normalized.preferredConditions.cn.join('\n');
        }
        if (Array.isArray(normalized.preferredConditions.en)) {
          normalized.preferredConditions.en = normalized.preferredConditions.en.join('\n');
        }
      }
      
      return normalized;
    });
  }
  return data;
}

export async function GET() {
  const data = await readStore();
  // 规范化数据格式，确保 requirements 是字符串格式
  const normalized = normalizeJobData(data);
  return NextResponse.json(normalized, { 
    headers: { 
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-Content-Type-Options': 'nosniff'
    } 
  });
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    // 先规范化数据格式
    const normalized = normalizeJobData(body);
    const parsed = CareersSchema.parse(normalized);
    
    try {
      await writeStore(parsed);
      return NextResponse.json({ ok: true }, { 
        headers: { 
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        } 
      });
    } catch (writeError: any) {
      // 记录错误信息
      console.error('[Careers API] Write error:', writeError?.message || writeError);
      
      // 如果是存储相关错误，返回更详细的错误信息
      if (writeError.code === 'EROFS' || 
          writeError.message?.includes('read-only') || 
          writeError.message?.includes('文件系统只读') ||
          writeError.message?.includes('KV/Redis 写入失败') ||
          writeError.message?.includes('生产环境需要配置')) {
        return NextResponse.json({ 
          ok: false, 
          error: writeError.message || '文件系统只读：在生产环境中无法直接写入文件。请配置 Vercel KV 或 Upstash Redis。',
          code: 'STORAGE_ERROR',
          suggestion: '请确保在 Vercel 项目设置中配置了环境变量 KV_REST_API_URL 和 KV_REST_API_TOKEN。'
        }, { status: 500 });
      }
      throw writeError;
    }
  } catch (e: any) {
    // 如果是验证错误，返回 400
    if (e.name === 'ZodError') {
      return NextResponse.json({ ok: false, error: e?.message || 'Invalid payload' }, { status: 400 });
    }
    // 其他错误返回 500
    return NextResponse.json({ ok: false, error: e?.message || 'Server error' }, { status: 500 });
  }
}

// 添加 POST 方法作为备选，以防某些服务器不支持 PUT
export async function POST(req: Request) {
  try {
    const body = await req.json();
    // 先规范化数据格式
    const normalized = normalizeJobData(body);
    const parsed = CareersSchema.parse(normalized);
    
    try {
      await writeStore(parsed);
      return NextResponse.json({ ok: true }, { 
        headers: { 
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        } 
      });
    } catch (writeError: any) {
      // 记录错误信息
      console.error('[Careers API] Write error:', writeError?.message || writeError);
      
      // 如果是存储相关错误，返回更详细的错误信息
      if (writeError.code === 'EROFS' || 
          writeError.message?.includes('read-only') || 
          writeError.message?.includes('文件系统只读') ||
          writeError.message?.includes('KV/Redis 写入失败') ||
          writeError.message?.includes('生产环境需要配置')) {
        return NextResponse.json({ 
          ok: false, 
          error: writeError.message || '文件系统只读：在生产环境中无法直接写入文件。请配置 Vercel KV 或 Upstash Redis。',
          code: 'STORAGE_ERROR',
          suggestion: '请确保在 Vercel 项目设置中配置了环境变量 KV_REST_API_URL 和 KV_REST_API_TOKEN。'
        }, { status: 500 });
      }
      throw writeError;
    }
  } catch (e: any) {
    // 如果是验证错误，返回 400
    if (e.name === 'ZodError') {
      return NextResponse.json({ ok: false, error: e?.message || 'Invalid payload' }, { status: 400 });
    }
    // 其他错误返回 500
    return NextResponse.json({ ok: false, error: e?.message || 'Server error' }, { status: 500 });
  }
}
