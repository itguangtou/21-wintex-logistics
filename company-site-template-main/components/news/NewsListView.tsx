import Link from 'next/link';
import type { NewsPreview } from '@/lib/newsContent';

type Props = {
  locale: string;
  title: string;
  items: NewsPreview[];
};

/** 纯服务端展示：文案直接进 HTML，无客户端取数 */
export default function NewsListView({ locale, title, items }: Props) {
  const lang = locale === 'en' ? 'en' : 'zh';

  return (
    <div className="relative min-h-screen bg-white">
      <div className="relative z-10 pt-32 pb-32" style={{ fontSize: '0.9em' }}>
        <div className="container max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 lg:px-[80px]">
          <div className="text-left mb-16">
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-brand-primary mb-4">
              {title}
            </h1>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-10 sm:gap-12 lg:gap-14">
              {items.map((news) => (
                <div
                  key={news.id}
                  className="rounded-card flex flex-col overflow-hidden transition-all hover:shadow-lg"
                >
                  <Link href={`/${lang}/news/${news.id}`}>
                    <div className="w-full rounded-lg mb-4 bg-brand-accent-50 p-2 flex items-center justify-center cursor-pointer aspect-[4/3] overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={news.image}
                        alt={news.title}
                        className="rounded-lg transition-transform hover:scale-105 object-cover w-full h-full"
                        style={{ maxWidth: '100%', maxHeight: '100%' }}
                      />
                    </div>
                  </Link>
                  <div
                    className="text-body leading-[150%] text-center px-2 md:px-2"
                    style={{ fontSize: '1em' }}
                  >
                    <p
                      className="mb-3 font-bold text-center md:whitespace-nowrap md:overflow-hidden md:text-ellipsis"
                      style={{ color: '#156082', fontSize: '1.08em' }}
                    >
                      {news.title}
                    </p>
                    <p
                      className="text-gray-400 line-clamp-2 md:line-clamp-2 mb-2 text-justify"
                      style={{ minHeight: '3em' }}
                    >
                      {news.preview}...
                    </p>
                    {news.date && (
                      <p className="text-gray-400 text-right text-sm mt-3">{news.date}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
