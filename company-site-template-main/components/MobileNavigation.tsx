'use client';

import {useTranslations, useLocale} from 'next-intl';
import Link from 'next/link';
import LocaleSwitcher from '@/components/LocaleSwitcher';

export default function MobileNavigation() {
  const n = useTranslations('nav');
  const locale = useLocale();

  return (
    <nav className="md:hidden flex items-center gap-2 text-[10px] font-medium text-gray-800 flex-wrap justify-end">
      <Link href={`/${locale}/about`} className="hover:text-gray-600 whitespace-nowrap">{n('About Us')}</Link>
      <Link href={`/${locale}/mission`} className="hover:text-gray-600 whitespace-nowrap">{n('mission')}</Link>
      <Link href={`/${locale}/news`} className="hover:text-gray-600 whitespace-nowrap">{n('news')}</Link>
      <Link href={`/${locale}/equipment`} className="hover:text-gray-600 whitespace-nowrap">{n('equipment')}</Link>
      <a href={`/careers.html?lang=${locale}`} target="_blank" rel="noopener noreferrer" className="hover:text-gray-600 whitespace-nowrap">{n('careers')}</a>
      <Link href={`/${locale}#contact`} className="hover:text-gray-600 whitespace-nowrap">{n('contact')}</Link>
      <div className="ml-1">
        <LocaleSwitcher />
      </div>
    </nav>
  );
}

