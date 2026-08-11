export type LocaleText = { zh: string; en: string };

export type MissionFocusCard = {
  image: string;
  title: LocaleText;
  caption: LocaleText;
};

export type MissionPageContent = {
  header: {
    title: LocaleText;
    subtitle: LocaleText;
  };
  focus: {
    label: LocaleText;
    body: LocaleText;
    cards: MissionFocusCard[];
  };
};

export type TimelineItemRow = {
  id: number;
  year: string;
  project_name_zh: string;
  project_name_en: string;
  description_zh: string;
  description_en: string;
  parent_group: number | null;
  sort_order: number;
  updated_at?: string;
};

export type TimelineYearGroup = {
  year: string;
  projects: Array<{
    id?: number;
    projectName: string;
    description: string;
  }>;
};

/** 与当前 mission 页硬编码文案一致，供管理端与 API 回退 */
export const DEFAULT_MISSION_CONTENT: MissionPageContent = {
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

/** 默认时间轴（与硬编码一致；seed / API 空库回退） */
export const DEFAULT_TIMELINE_SEED: Omit<TimelineItemRow, 'id' | 'updated_at'>[] = [
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

export function groupTimelineByYear(
  rows: TimelineItemRow[],
  locale: 'zh' | 'en'
): TimelineYearGroup[] {
  // 前台顺序以 sort_order 为准（管理端上下移动即改此值）；同年条目合并展示
  const sorted = [...rows].sort((a, b) => {
    const so = (a.sort_order ?? 0) - (b.sort_order ?? 0);
    if (so !== 0) return so;
    return a.id - b.id;
  });

  const map = new Map<string, TimelineYearGroup>();
  for (const row of sorted) {
    const projectName = locale === 'zh' ? row.project_name_zh : row.project_name_en;
    const description = locale === 'zh' ? row.description_zh : row.description_en;
    const existing = map.get(row.year);
    if (existing) {
      existing.projects.push({ id: row.id, projectName, description });
    } else {
      map.set(row.year, {
        year: row.year,
        projects: [{ id: row.id, projectName, description }],
      });
    }
  }
  return Array.from(map.values());
}

export function defaultTimelineRows(): TimelineItemRow[] {
  return DEFAULT_TIMELINE_SEED.map((row, i) => ({
    ...row,
    id: -(i + 1),
  }));
}
