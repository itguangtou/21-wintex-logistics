/**
 * 写入 mission 页默认 content + timeline_items（已存在则跳过，避免冲掉线上）
 * 用法：node scripts/seed-mission.mjs
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

const DEFAULT_MISSION = {
  header: {
    title: {
      zh: '全过程风电物流',
      en: 'Full-process Wind Power Logistics',
    },
    subtitle: {
      zh: '清洁能源项目的成功实践（2023-2025）',
      en: 'Successful Practice of Clean Energy Projects (2023-2025)',
    },
  },
  focus: {
    label: {
      zh: '聚焦：阿拉巴特与塔奈',
      en: 'Focus: Alabat and Tanay',
    },
    body: {
      zh: '项目由Alternergy牵头，BOP合同方为中国能建集团的子公司GEDI，负责两个场址的设计、工程、土建和电气施工、设备运输、安装及调试工作。',
      en: 'The Alabat (Quezon) and Tanay (Quezon) Wind Power Projects are led by Alternergy and BOP contracted to GEDI, a subsidiary of China Energy Engineering Group, covering the design, engineering, civil and electrical works, equipment transport, installation, and commissioning for both sites.',
    },
    cards: [
      {
        image: '/highresolution/WechatIMG241.jpeg',
        title: {
          zh: '阿拉巴特风力发电项目8X8MW',
          en: 'Alabat Wind Power Project 8X8MW',
        },
        caption: {
          zh: '风力发电机组部件的重大件、超限物流运输，确保准时且安全交付',
          en: 'Oversized/heavy-lift logistics transport for wind turbine components, ensuring timely and secure delivery',
        },
      },
      {
        image: '/highresolution/WechatIMG254.jpg',
        title: {
          zh: '塔奈风力发电项目16X8MW',
          en: 'Tanay Wind Power Project 16X8MW',
        },
        caption: {
          zh: '风力发电机组部件的物流运输及特种货物操作',
          en: 'Logistics transport and specialized cargo handling for wind turbine components',
        },
      },
    ],
  },
};

const TIMELINE_SEED = [
  {
    year: '2023',
    project_name_zh: '良安水电站——北拉瑙省',
    project_name_en: 'Liangan Hydroelectric Power Plant - Lanao Del Norte',
    description_zh: '发电机、变压器及输电线路材料的物流运输',
    description_en: 'Logistics transport of generators, transformers, and transmission line materials',
    parent_group: null,
    sort_order: 10,
  },
  {
    year: '2024',
    project_name_zh: '拉布拉多太阳能电站——邦阿西南省',
    project_name_en: 'Labrador Solar Power Plant - Pangasinan',
    description_zh: '光伏组件及太阳能电站材料的物流运输',
    description_en: 'Logistics transport of photovoltaic modules and solar power plant material',
    parent_group: null,
    sort_order: 20,
  },
  {
    year: '2025',
    project_name_zh: '塔奈风电项目——奎松省',
    project_name_en: 'Tanay Wind Power Project - Quezon',
    description_zh: '风力发电机组部件的物流运输及特种货物操作',
    description_en:
      "Full-process logistics for the Philippines'first 8MW wind turbine generator, transporting its oversized components along 90 km of mountainous roads with sharp turns and steady gradients",
    parent_group: null,
    sort_order: 30,
  },
  {
    year: '2025',
    project_name_zh: '阿拉巴特风电项目——奎松省',
    project_name_en: 'Alabat Wind Power Project - Quezon',
    description_zh: '风力发电机组部件的重大件、超限物流运输',
    description_en:
      "Full-process logistics transportation and special cargo operations for the components of the Philippines' first BMW standalone wind turbine generator",
    parent_group: null,
    sort_order: 40,
  },
];

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: existingPage } = await supabase
  .from('pages')
  .select('slug')
  .eq('slug', 'mission')
  .maybeSingle();

if (existingPage) {
  console.log('ℹ️ mission 页已存在，跳过覆盖');
} else {
  const { error } = await supabase.from('pages').insert({
    slug: 'mission',
    content: DEFAULT_MISSION,
    draft_content: DEFAULT_MISSION,
    status: 'published',
    updated_by: 'seed',
  });
  if (error) {
    console.error('❌ mission seed 失败:', error.message);
    process.exit(1);
  }
  console.log('✅ mission 页默认内容已写入 pages');
}

const { count, error: countErr } = await supabase
  .from('timeline_items')
  .select('*', { count: 'exact', head: true });

if (countErr) {
  console.error('❌ 读取 timeline_items 失败:', countErr.message);
  process.exit(1);
}

if ((count ?? 0) > 0) {
  console.log(`ℹ️ timeline_items 已有 ${count} 条，跳过覆盖`);
} else {
  const { error } = await supabase.from('timeline_items').insert(TIMELINE_SEED);
  if (error) {
    console.error('❌ timeline seed 失败:', error.message);
    process.exit(1);
  }
  console.log(`✅ 已写入 ${TIMELINE_SEED.length} 条 timeline_items`);
}
