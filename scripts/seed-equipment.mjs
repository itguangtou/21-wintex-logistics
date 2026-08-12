/**
 * 写入 equipment 页默认 content（published + draft）
 * 用法：node scripts/seed-equipment.mjs
 * 已存在则跳过，避免冲掉线上文案
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

/** 与 company-site-template-main/lib/equipmentPageContent.ts 保持一致 */
const DEFAULT_EQUIPMENT = {
  pageTitle: { zh: '装备清单', en: 'Equipment List' },
  gallery: [
    {
      image: '/images/equipment_1.jpg',
      name: { zh: '超级版重载车头', en: 'Super Heavy-Duty Prime Mover' },
    },
    {
      image: '/images/equipment_2.jpg',
      name: { zh: '液压模块轴线车', en: 'Hydraulic Modular Trailer' },
    },
    {
      image: '/images/equipment_3.jpg',
      name: { zh: '叶片运输扬举车', en: 'Blade Lifting Vehicle' },
    },
    {
      image: '/images/equipment_4.jpg',
      name: { zh: '汽车起重机', en: 'Truck-mounted Crane' },
    },
  ],
  detailModule1: {
    row1: [
      {
        title: { zh: '超级版牵引车', en: 'Super-Duty Tractor Truck' },
        desc: {
          zh: '配备全轮驱动扭矩转换器传动系统，具有卓越的越野牵引能力，轻松应对各种复杂地形。广泛适用于风力发电设备运输和重型工程拖运等专业作业。',
          en: 'Equipped with an all wheel drive torque converter transmission system, it delivers exceptional off-road traction capabilities, effortlessly handling diverse and challenging terrains. Widely applicable for specialized operations such as wind turbine equipment transport and heavy-duty engineering towing.',
        },
      },
      {
        title: { zh: '超强版牵引车', en: 'Heavy-Duty Tractor Truck' },
        desc: {
          zh: '全轮驱动牵引车具有出色的越野导航和拖运能力，专为复杂地形的苛刻运输作业而设计，包括风力发电设备物流和工程项目。',
          en: 'The all-wheel drive tractor truck delivers outstanding off-road navigation and towing capacity, engineered for demanding transport operations across complex terrains—including wind turbine equipment logistics and engineering projects.',
        },
      },
      {
        title: { zh: '超强、重版牵引车', en: 'Heavy-Duty / High-Capacity Tractor Truck' },
        desc: {
          zh: '配备全轮驱动扭矩转换器传动系统，具有卓越的越野牵引能力，轻松应对各种复杂地形。广泛适用于风力发电设备运输和重型工程拖运等专业作业。',
          en: 'Equipped with an all-wheel-drive torque converter transmission system, it delivers exceptional off-road traction capabilities, effortlessly handling diverse and challenging terrains. Widely applicable for specialized operations such as wind turbine equipment transport and heavy-duty engineering towing.',
        },
      },
    ],
    row2: [
      {
        title: {
          zh: '多轴线伸缩式叶片长途运输车',
          en: 'Multi-axle Telescopic Blade Long-Distance Transporter',
        },
        desc: {
          zh: '专为运输超长风力发电叶片而设计，能够运输支撑点长度≥55米的叶片。车辆可根据叶片长度和重量通过轴配置和多级伸缩调整进行调整，满足山区、丘陵和狭窄道路的运输要求。',
          en: 'Specifically designed for transporting extra long wind turbine blades, it is capable of transporting blades with a support point length ≥ 55m. The vehicle body can be adjusted through axle configuration and multi-stage telescopic adjustment based on blade length and weight, designed to meet the transportation requirements of mountainous, hilly, and narrow roads.',
        },
      },
      {
        title: {
          zh: '多轴线模块化叶片扬举车',
          en: 'Multi-Axle Modular Wind Turbine Blade Lifter',
        },
        desc: {
          zh: '该设备是专为超长风力发电叶片山区运输而设计的液压控制运输系统。具有升降、回转和俯仰调节功能，采用模块化设计，可根据路况灵活配置轴数。能够运输质量力矩为500-1200t-m的叶片，可在障碍物密集、弯道多的狭窄山区道路上安全通行。',
          en: 'This equipment is a hydraulically controlled transport system specifically designed for mountainous transportation of ultra-long wind turbine blades. Featuring lifting, slewing, and pitch adjustment capabilities, it employs a modular design allowing flexible axle configuration according to road conditions. Capable of transporting blades with mass moments of 500-1200t-m, it enables safe passage through narrow mountain roads with dense obstacles and multiple curves.',
        },
      },
    ],
  },
  detailModule2: {
    row1: [
      {
        title: {
          zh: '多轴线模块化机舱运输车',
          en: 'Multi-Axle Modular Nacelle Transport Trailer',
        },
        desc: {
          zh: '根据机舱的重量和通行桥梁的限重，可组合成不同轴线数量的机舱运输车，专为大型工程运输设计。自带驱动和升降功能，满足长距离、大吨位设备运输需求，广泛应用于山区或复杂工况下的工程运输项目。',
          en: 'Based on the weight of the cabin module and bridge weight restrictions, cabin transport vehicles can be configured with varying axle configurations. Designed specifically for large-scale engineering transport, these self-propelled vehicles feature integrated drive and lifting capabilities. They fulfill long-distance, heavy-load equipment transportation requirements and are widely used in engineering projects across mountainous terrain or complex working conditions.',
        },
      },
      {
        title: {
          zh: '多轴线模块化轮毂运输车',
          en: 'Multi-Axle Modular Hub Transport Trailer',
        },
        desc: {
          zh: '可根据轮毂的特点组装成多轴液压运输车，专为大型风电轮毂运输而设计。可在装卸或坡道路段调节牵引高度，提高通过性；多轴线布局确保轴荷分配均匀，适配多规格轮毂，满足不同重量等级设备的长距离、安全运输需求。',
          en: 'Based on the characteristics of the hub, multi-axle hydraulic transport vehicles can be assembled, specifically designed for transporting large wind turbine hubs. They can adjust the suspension height during loading/unloading or on sloped sections to enhance maneuverability. The multi-axle configuration ensures even axle load distribution, accommodates various hub specifications, and meets long-distance, safe transportation requirements for equipment of varying weight classes.',
        },
      },
    ],
    row2: [
      {
        title: {
          zh: '多轴线模块化塔筒运输车',
          en: 'Multi-Axle Modular Tower Transport Trailer',
        },
        desc: {
          zh: '通过加装抽拉平台、抽拉框架，可运输超重、超高塔筒，具备主动驱动功能，提升整体爬坡能力与转弯性能，可根据塔筒长度灵活调节，多轴线组合实现整车高载重、低载荷、强适应性的完美平衡。',
          en: 'Through the installation of telescopic platforms/frames, these vehicles can transport overweight/oversized tower sections. Equipped with self-propelled functionality, they enhance overall climbing ability and maneuverability. The transport length is flexibly adjustable according to tower segment dimensions. Multi-axle configurations achieve an optimal balance of high payload capacity, reduced ground pressure, and superior terrain adaptability.',
        },
      },
      {
        title: { zh: '低平板辅助运输车', en: 'Low-Bed Auxiliary Transporter' },
        desc: {
          zh: '主要为风机设备配套的集装箱和附件的运输使用，是一种专为重型设备、超高超重大件构件运输设计的半挂车，车架离地高度较低，具有较强的通过性与装载稳定性。常用于运输风电机舱、变压器、履带式设备等高重心或限高场景下的重型货物。',
          en: 'Primarily used for transporting containers and accessories for wind turbine equipment, this specialized semi-trailer is engineered for heavy-duty machinery and oversized/heavy components. Featuring a low deck height, it offers enhanced ground clearance for improved passability and exceptional load stability. Commonly deployed for transporting wind turbine nacelles, transformers, tracked equipment, and other high center-of-gravity or height-restricted heavy cargo in constrained scenarios.',
        },
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
  .eq('slug', 'equipment')
  .maybeSingle();

if (existing) {
  console.log('ℹ️ equipment 已存在，跳过覆盖（避免冲掉线上文案）');
  process.exit(0);
}

const { error } = await supabase.from('pages').insert({
  slug: 'equipment',
  content: DEFAULT_EQUIPMENT,
  draft_content: DEFAULT_EQUIPMENT,
  status: 'published',
  updated_by: 'seed',
});

if (error) {
  console.error('❌ seed 失败:', error.message);
  process.exit(1);
}

console.log('✅ equipment 页默认内容已写入 pages');
