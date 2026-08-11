/**
 * 将 data/careers.json 导入 Supabase careers_data 表
 * 用法（仓库根目录）：node scripts/seed-careers.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

config({ path: path.join(root, '.env.local') });
config({ path: path.join(root, 'company-site-template-main', '.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('❌ 缺少 NEXT_PUBLIC_SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const jsonPath = path.join(
  root,
  'company-site-template-main',
  'data',
  'careers.json'
);
const careers = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { error } = await supabase.from('careers_data').upsert(
  {
    id: 'main',
    data: careers,
    updated_at: new Date().toISOString(),
  },
  { onConflict: 'id' }
);

if (error) {
  console.error('❌ 导入失败:', error.message);
  process.exit(1);
}

console.log('✅ 已导入 careers_data (id=main)');
console.log(`   岗位数: ${careers.jobs?.length ?? 0}`);
careers.jobs?.forEach((j) => {
  console.log(`   - ${j.id}: ${j.title?.cn || ''}`);
});
