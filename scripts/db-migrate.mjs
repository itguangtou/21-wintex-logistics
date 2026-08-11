/**
 * 直接连接 Supabase PostgreSQL 执行 SQL，无需打开网页。
 *
 * 用法：
 *   node scripts/db-migrate.mjs
 *   node scripts/db-migrate.mjs doc/sql/001_init_schema.sql
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { config } from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

config({ path: path.join(root, '.env.local') });
config({ path: path.join(root, 'company-site-template-main', '.env.local') });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('❌ 缺少 DATABASE_URL。请在 .env.local 中配置数据库连接串。');
  process.exit(1);
}

if (databaseUrl.includes('[YOUR-PASSWORD]') || databaseUrl.includes('YOUR-PASSWORD')) {
  console.error('❌ DATABASE_URL 里还是占位密码，请换成创建项目时保存的真实密码。');
  process.exit(1);
}

const sqlFile =
  process.argv[2] || path.join(root, 'doc', 'sql', '001_init_schema.sql');
const absoluteSql = path.isAbsolute(sqlFile) ? sqlFile : path.join(root, sqlFile);

if (!fs.existsSync(absoluteSql)) {
  console.error(`❌ 找不到 SQL 文件: ${absoluteSql}`);
  process.exit(1);
}

const sql = fs.readFileSync(absoluteSql, 'utf8');
const client = new pg.Client({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
});

try {
  console.log(`→ 连接数据库…`);
  await client.connect();
  console.log(`→ 执行: ${path.relative(root, absoluteSql)}`);
  await client.query(sql);
  console.log('✅ SQL 执行成功');

  const { rows } = await client.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);
  console.log('📋 当前 public 表:');
  for (const row of rows) {
    console.log(`   - ${row.table_name}`);
  }
} catch (error) {
  console.error('❌ 执行失败:', error.message);
  process.exit(1);
} finally {
  await client.end().catch(() => {});
}
