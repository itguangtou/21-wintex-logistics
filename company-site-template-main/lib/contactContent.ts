export type LocaleText = { zh: string; en: string };

/** 首页底部 #contact 联系区域 */
export type ContactPageContent = {
  title: LocaleText;
  tel: LocaleText;
  email: LocaleText;
  address: LocaleText;
};

export const DEFAULT_CONTACT_CONTENT: ContactPageContent = {
  title: {
    zh: '联系我们',
    en: 'Contact Us',
  },
  tel: {
    zh: '+63 917 620 0268',
    en: '+63 917 620 0268',
  },
  email: {
    zh: 'wintexlogistics@wintex.com.ph',
    en: 'wintexlogistics@wintex.com.ph',
  },
  address: {
    zh: 'U1203, The Trade & Financial Tower ,7th Ave cor 32nd St.,BGC,Taguig City, Philippines',
    en: 'U1203, The Trade & Financial Tower ,7th Ave cor 32nd St.,BGC,Taguig City, Philippines',
  },
};

export function pickLocale(text: LocaleText, locale: string): string {
  return locale === 'en' ? text.en : text.zh;
}
