/**
 * 建表 + 插入初始管理员 wintex / wintex2026（role=admin）
 * 用法：node scripts/seed-admin.mjs
 */
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

config({ path: path.join(root, '.env.local') });
config({ path: path.join(root, 'company-site-template-main', '.env.local') });

const databaseUrl = process.env.DATABASE_URL;
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!databaseUrl || !url || !key) {
  console.error('❌ 缺少 DATABASE_URL / SUPABASE 环境变量');
  process.exit(1);
}

// 1) 执行建表 SQL
const sql = fs.readFileSync(
  path.join(root, 'doc', 'sql', '002_admin_users.sql'),
  'utf8'
);
const client = new pg.Client({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
});
await client.connect();
await client.query(sql);
console.log('✅ admin_users 表已就绪');
await client.end();

// 2) 插入/更新初始用户
const username = process.env.SEED_ADMIN_USERNAME || 'wintex';
const password = process.env.SEED_ADMIN_PASSWORD || 'wintex2026';
const role = 'admin';
const password_hash = await bcrypt.hash(password, 10);

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { error } = await supabase.from('admin_users').upsert(
  {
    username,
    password_hash,
    role,
    is_active: true,
    updated_at: new Date().toISOString(),
  },
  { onConflict: 'username' }
);

if (error) {
  console.error('❌ 插入管理员失败:', error.message);
  process.exit(1);
}

console.log('✅ 管理员已写入 admin_users');
console.log(`   username: ${username}`);
console.log(`   role: ${role}`);
console.log(`   password: ${password}（仅本次种子脚本明文提示，库中为哈希）`);
