export type LocaleText = { zh: string; en: string };

export type HomeTeaserBlock = {
  title: LocaleText;
  subtitle: LocaleText;
  desc: LocaleText;
  ctaLabel: LocaleText;
  image: string;
};

export type HomeNewsSection = {
  sectionTitle: LocaleText;
  allNewsLabel: LocaleText;
  /** 首页展示的 4 条新闻 id，顺序即展示顺序 */
  featuredIds: [string, string, string, string];
};

export type HomeEquipmentSection = {
  sectionTitle: LocaleText;
  ctaLabel: LocaleText;
  /** 装备页 gallery 下标 0–3，恰好 4 个且互不重复 */
  featuredIndices: [number, number, number, number];
};

export type HomePageContent = {
  about: HomeTeaserBlock;
  strength: HomeTeaserBlock;
  news: HomeNewsSection;
  equipment: HomeEquipmentSection;
};

/** 与现网首页文案/默认新闻顺序一致 */
export const DEFAULT_HOME_CONTENT: HomePageContent = {
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

export function pickLocaleText(text: LocaleText, locale: string): string {
  return locale === 'en' ? text.en : text.zh;
}
