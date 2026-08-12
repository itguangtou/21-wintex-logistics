/**
 * 写入 home 页默认 content（published + draft）
 * 用法：node scripts/seed-home.mjs
 * 已存在则跳过
 */
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
  console.error('❌ 缺少 DATABASE_URL / Supabase 环境变量');
  process.exit(1);
}

const sql = fs.readFileSync(path.join(root, 'doc', 'sql', '003_pages.sql'), 'utf8');
const client = new pg.Client({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
});
await client.connect();
await client.query(sql);
console.log('✅ pages 表已就绪');
await client.end();

/** 与 lib/homePageContent.ts 保持一致 */
const DEFAULT_HOME = {
  about: {
    title: { zh: '破界起航', en: 'Sailing Beyond Boundaries' },
    subtitle: {
      zh: '无界定义物流 | 创新由此启幕',
      en: 'Boundless Defines Logistics | Where Innovation Begins',
    },
    desc: {
      zh: '我们提供端到端的工程物流解决方案，包括货运代理、超限重大件陆运＆海运＆空运；设备租赁；仓储、进出口报关、清关服务；物流方案设计与管理等。',
      en: 'We deliver comprehensive, end-to-end engineering logistics solutions.',
    },
    ctaLabel: { zh: '关于我们', en: 'About Us' },
    image: '/images/introduction.png',
  },
  strength: {
    title: { zh: '实力见证', en: 'Proof of Strength' },
    subtitle: {
      zh: '全过程风电物流：清洁能源项目的成功实践（2023-2025）',
      en: 'End-to-End International Wind Power Logistics: Successful Practices in Clean Energy Projects',
    },
    desc: {
      zh: 'Wintex国际重型工程物流集团在菲律宾各地的可再生能源项目中，建立了可靠且量身定制的物流解决方案，获得了良好的口碑，确保水电、太阳能和风电项目的货物能够及时、安全、高效地送达。',
      en: 'Wintex Logistics has built a strong reputation establishing reliable and tailor-made logistics renewable energy projects across the Philippines ensures that goods for hydroelectric, solar, and wind power projects are delivered to their destinations in a timely, safe, and efficient manner.',
    },
    ctaLabel: { zh: '阅读更多', en: 'Read More' },
    image: '/images/strength.png',
  },
  news: {
    sectionTitle: { zh: '新闻', en: 'News' },
    allNewsLabel: { zh: '全部新闻', en: 'All News' },
    featuredIds: ['3', '1', '2', '4'],
  },
  equipment: {
    sectionTitle: { zh: '装备清单', en: 'Equipment List' },
    ctaLabel: { zh: '阅读更多', en: 'Read More' },
    featuredIndices: [0, 1, 2, 3],
  },
};

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: existing } = await supabase
  .from('pages')
  .select('slug')
  .eq('slug', 'home')
  .maybeSingle();

if (existing) {
  console.log('ℹ️ home 已存在，跳过覆盖');
  process.exit(0);
}

const { error } = await supabase.from('pages').insert({
  slug: 'home',
  content: DEFAULT_HOME,
  draft_content: DEFAULT_HOME,
  status: 'published',
  updated_by: 'seed',
});

if (error) {
  console.error('❌ seed 失败:', error.message);
  process.exit(1);
}

console.log('✅ home 页默认内容已写入 pages');
