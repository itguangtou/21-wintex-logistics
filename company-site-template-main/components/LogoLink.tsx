'use client';

import {useLocale} from 'next-intl';
import Link from 'next/link';
import {siteConfig} from '@/lib/site';

export default function LogoLink() {
  const locale = useLocale();
  
  return (
    <Link href={`/${locale}`} className="flex items-center gap-2">
      <img 
        src="/images/wintex-logo.png" 
        alt={siteConfig.name} 
        className="h-[clamp(32px,4.44vw,64px)] w-auto transition-transform hover:scale-105" 
      />
      <span className="sr-only">{siteConfig.name}</span>
    </Link>
  );
}

