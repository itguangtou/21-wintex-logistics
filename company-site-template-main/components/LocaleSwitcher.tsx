
'use client';
import {usePathname, useRouter} from 'next/navigation';
import {useLocale} from 'next-intl';
import Link from 'next/link';

export default function LocaleSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();

  // 移除当前语言前缀，获取原始路径
  const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}/, '') || '/';

  const switchLocale = (newLocale: string) => {
    const newPath = `/${newLocale}${pathWithoutLocale}`;
    router.push(newPath);
  };

  return (
    <div className="flex items-center gap-2">
      <button 
        onClick={() => switchLocale('zh')}
        className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
          locale === 'zh' 
            ? 'bg-red-500 text-white' 
            : 'text-red-500 hover:text-red-600 hover:bg-red-50'
        }`}
      >
        CN
      </button>
      <span className="text-gray-400">|</span>
      <button 
        onClick={() => switchLocale('en')}
        className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
          locale === 'en' 
            ? 'bg-gray-800 text-white' 
            : 'text-gray-800 hover:text-gray-600 hover:bg-gray-100'
        }`}
      >
        EN
      </button>
    </div>
  );
}
