export type LocaleText = { zh: string; en: string };

export type AboutIntroBlock = {
  title: LocaleText;
  body: LocaleText[];
};

export type AboutPageContent = {
  backgroundImage: string;
  intro: AboutIntroBlock[];
  network: {
    centerLogo: string;
    items: LocaleText[];
  };
};

/** 与当前 about 页硬编码文案一致，供管理端与后续 API 回退使用 */
export const DEFAULT_ABOUT_CONTENT: AboutPageContent = {
  backgroundImage: '/highresolution/WechatIMG153.jpg',
  intro: [
    {
      title: {
        zh: '无界定义物流',
        en: 'Boundless Defines Logistics',
      },
      body: [
        {
          zh: 'Wintex国际重型工程物流集团，以"无界创新"理念，重构供应链逻辑，开创性实施"中国港口-菲律宾近海"全程不换载的平板驳船直达运输方案，攻克了超限件跨国、端到端运输的行业难题。',
          en: 'We have redefned supply chain logic by pioneering a "China Port to Philippines Offshore" direct fat barge transport solution, eliminating cargo reloading. This breakthrough overcomes the longstanding industry challenge of cross-border, end-to-end transportation for oversized cargo.',
        },
      ],
    },
    {
      title: {
        zh: '创新由此启幕',
        en: 'Where Innovation Begins',
      },
      body: [
        {
          zh: '我们专注于大型工程项目的出海落地，提供量身定制的海、陆、空物流解决方案，灵活应对客户的动态需求，确保您的货物安全、准时、高效送达。',
          en: "Wintex Logistics specializes in the global execution of large-scale engineering projects, delivering tailored multimodal solutions by sea, land, and air. We respond with agility to clients' evolving needs, ensuring your cargo arrives safely, on schedule, and with maximum efficiency.",
        },
      ],
    },
    {
      title: {
        zh: '我们的愿景',
        en: 'Our Mission',
      },
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
