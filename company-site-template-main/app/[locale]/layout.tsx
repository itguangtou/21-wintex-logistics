import '../globals.css';
import type {Metadata} from 'next';
import {NextIntlClientProvider, useTranslations, useLocale} from 'next-intl';
import {siteConfig} from '@/lib/site';
import Link from 'next/link';
import type {Locale} from '@/i18n/routing';
import LocaleSwitcher from '@/components/LocaleSwitcher';
import LogoLink from '@/components/LogoLink';
import MobileNavigation from '@/components/MobileNavigation';

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {default: siteConfig.name, template: `%s · ${siteConfig.name}`},
  description: siteConfig.description
};

function Navigation() {
  const n = useTranslations('nav');
  const locale = useLocale();
  
  return (
    <nav className="hidden md:flex items-center gap-5 text-[13px] font-medium text-gray-800">
      <Link href={`/${locale}/about`} className="hover:text-gray-600">{n('About Us')}</Link>
      <Link href={`/${locale}/mission`} className="hover:text-gray-600">{n('mission')}</Link>
      <Link href={`/${locale}/news`} className="hover:text-gray-600">{n('news')}</Link>
      <Link href={`/${locale}/equipment`} className="hover:text-gray-600">{n('equipment')}</Link>
      <a href={`/careers.html?lang=${locale}`} target="_blank" rel="noopener noreferrer" className="hover:text-gray-600">{n('careers')}</a>
      <Link href={`/${locale}#contact`} className="hover:text-gray-600">{n('contact')}</Link>
      <div className="ml-2">
        <LocaleSwitcher />
      </div>
    </nav>
  );
}

export default async function RootLayout({
  children,
  params: {locale}
}: {
  children: React.ReactNode;
  params: {locale: string};
}) {
  const currentLocale = locale as Locale;  // ✅ 关键修改
  const messages = (await import(`../../messages/${currentLocale}.json`)).default;

  return (
    <html lang={currentLocale}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@200;300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <NextIntlClientProvider locale={currentLocale} messages={messages}>
          {/* Top white header */}
          <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
            <div className="mx-auto max-w-[1200px] px-4 h-20 flex items-center justify-between">
              <LogoLink />
              <Navigation />
              <MobileNavigation />
            </div>
          </header>
          {/* spacer to avoid cover by fixed header */}
          <div className="h-20"></div>
          <main className="min-h-dvh">{children}</main>
        </NextIntlClientProvider>

        <footer className="border-t mt-16 bg-gray-50">
          <div className="container py-10 text-sm text-gray-600 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <p>© {new Date().getFullYear()} {siteConfig.name}. All rights reserved.</p>
            <div className="flex gap-4">
              <a href="#" className="text-gray-500 hover:text-gray-700">Privacy Policy</a>
              <a href="#" className="text-gray-500 hover:text-gray-700">Terms of Service</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
