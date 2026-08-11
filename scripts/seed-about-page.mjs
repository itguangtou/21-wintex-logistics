/**
 * 写入 about 页默认 content（published + draft）
 * 用法：node scripts/seed-about-page.mjs
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

// 与 lib/aboutPageContent.ts 保持一致
const DEFAULT_ABOUT = {
  backgroundImage: '/highresolution/WechatIMG153.jpg',
  intro: [
    {
      title: { zh: '无界定义物流', en: 'Boundless Defines Logistics' },
      body: [
        {
          zh: 'Wintex国际重型工程物流集团，以"无界创新"理念，重构供应链逻辑，开创性实施"中国港口-菲律宾近海"全程不换载的平板驳船直达运输方案，攻克了超限件跨国、端到端运输的行业难题。',
          en: 'We have redefned supply chain logic by pioneering a "China Port to Philippines Offshore" direct fat barge transport solution, eliminating cargo reloading. This breakthrough overcomes the longstanding industry challenge of cross-border, end-to-end transportation for oversized cargo.',
        },
      ],
    },
    {
      title: { zh: '创新由此启幕', en: 'Where Innovation Begins' },
      body: [
        {
          zh: '我们专注于大型工程项目的出海落地，提供量身定制的海、陆、空物流解决方案，灵活应对客户的动态需求，确保您的货物安全、准时、高效送达。',
          en: "Wintex Logistics specializes in the global execution of large-scale engineering projects, delivering tailored multimodal solutions by sea, land, and air. We respond with agility to clients' evolving needs, ensuring your cargo arrives safely, on schedule, and with maximum efficiency.",
        },
      ],
    },
    {
      title: { zh: '我们的愿景', en: 'Our Mission' },
      body: [
        {
          zh: '助力客户成功跨海越洋，将客户的重型设备、装备运往世界各个角落。',
          en: 'Wintex Logistics envisions empowering clients to conquer oceans and continents by delivering their heavy equipment and machinery to every corner of the world.',
        },
        {
          zh: '我们致力于卓越、可持续发展，为员工、客户和合作伙伴创造无可比拟的价值。通过坚持创新、促进协作并秉持最高标准的诚信，我们努力在物流行业树立新的标杆。',
          en: 'We are committed to excellent and sustainable development, creating unparalleled value for our employees, clients, and partners. Through relentless innovation, collaborative partnerships, and uncompromising integrity, we strive to set new benchmarks in the logistics industry.',
        },
      ],
    },
  ],
  network: {
    centerLogo: '/logo.png',
    items: [
      {
        zh: 'Wintex国际重型工程物流集团负责阿拉巴特和塔奈风力发电项目的所有物流和清关操作',
        en: 'Wintex Logistics Corporation is responsible for all logistics and customs clearance operations for both the Alabat and Tanay wind power projects',
      },
      {
        zh: '风力发电机部件的内陆和港口装卸',
        en: 'Inland and port handling of wind turbine components',
      },
      {
        zh: '专用码头、路线改造、大件运输所需要的各种许可和准证',
        en: 'Various permits and approvals required for dedicated jetty, route modifications, and oversized transport.',
      },
      {
        zh: '超大件和重型货物管理',
        en: 'Oversized and heavy-lift cargo management',
      },
      {
        zh: '项目现场的最后一公里交付',
        en: 'Last-mile delivery to project sites',
      },
    ],
  },
};

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: existing } = await supabase
  .from('pages')
  .select('slug')
  .eq('slug', 'about')
  .maybeSingle();

if (existing) {
  console.log('ℹ️ about 已存在，跳过覆盖（避免冲掉线上文案）');
  process.exit(0);
}

const { error } = await supabase.from('pages').insert({
  slug: 'about',
  content: DEFAULT_ABOUT,
  draft_content: DEFAULT_ABOUT,
  status: 'published',
  updated_by: 'seed',
});

if (error) {
  console.error('❌ seed 失败:', error.message);
  process.exit(1);
}

console.log('✅ about 页默认内容已写入 pages');
