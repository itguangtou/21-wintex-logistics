import type { NewsArticle } from '@/lib/newsContent';

type Props = {
  locale: string;
  article: NewsArticle;
};

/** 纯服务端展示：标题/正文直接进 HTML */
export default function NewsDetailView({ locale, article }: Props) {
  const lang = locale === 'en' ? 'en' : 'zh';
  const title = lang === 'en' ? article.title_en : article.title_zh;
  const body = lang === 'en' ? article.content_en : article.content_zh;

  return (
    <div className="relative min-h-screen bg-white" style={{ fontSize: '0.72em' }}>
      <div className="relative z-10 pt-32 pb-32">
        <div className="container max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 lg:px-[80px]">
          <div className="text-center mb-8">
            <h1
              className="text-xl md:text-2xl lg:text-3xl font-bold mb-4"
              style={{ color: '#156082' }}
            >
              {title}
            </h1>
          </div>

          <div className="w-full mb-12 flex items-center justify-center">
            <div className="inline-block max-w-3xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={article.image_url}
                alt={title}
                className="rounded-lg shadow-lg w-full h-auto"
                style={{
                  maxWidth: '100%',
                  maxHeight: '480px',
                  imageRendering: 'auto',
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
            </div>
          </div>

          <div className="max-w-4xl mx-auto">
            <div
              className="text-sm md:text-base text-gray-700 leading-relaxed whitespace-pre-line"
              dangerouslySetInnerHTML={{ __html: body.replace(/\n/g, '<br />') }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
