/**
 * 确保 Supabase Storage 有公开桶 media（上传 API 也会自检创建）
 * 用法：node scripts/ensure-media-bucket.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

config({ path: path.join(root, '.env.local') });
config({ path: path.join(root, 'company-site-template-main', '.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('❌ 缺少 NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const BUCKET = 'media';
const { data: buckets, error } = await supabase.storage.listBuckets();
if (error) {
  console.error('❌ listBuckets:', error.message);
  process.exit(1);
}

if (buckets?.some((b) => b.name === BUCKET)) {
  console.log('ℹ️ media 桶已存在');
  process.exit(0);
}

const { error: createErr } = await supabase.storage.createBucket(BUCKET, {
  public: true,
  fileSizeLimit: 8 * 1024 * 1024,
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
});

if (createErr) {
  console.error('❌ 创建失败:', createErr.message);
  process.exit(1);
}

console.log('✅ 已创建公开桶 media');
