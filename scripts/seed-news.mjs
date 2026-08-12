/**
 * 写入 news 表默认文章（已有数据则跳过，避免冲掉线上）
 * 用法：npm run db:seed:news
 */
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

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

const rows = JSON.parse(
  fs.readFileSync(path.join(root, 'scripts', 'news-seed-data.json'), 'utf8')
);

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { count, error: countErr } = await supabase
  .from('news')
  .select('*', { count: 'exact', head: true });

if (countErr) {
  console.error('❌ 读取 news 失败:', countErr.message);
  process.exit(1);
}

if ((count ?? 0) > 0) {
  console.log(`ℹ️ news 已有 ${count} 条，跳过覆盖`);
  process.exit(0);
}

const { error } = await supabase.from('news').insert(rows);
if (error) {
  console.error('❌ seed 失败:', error.message);
  process.exit(1);
}

console.log(`✅ 已写入 ${rows.length} 条新闻`);
