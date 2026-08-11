'use client';

import {useTranslations} from 'next-intl';
import type {Locale} from '@/i18n/routing';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { newsData } from '@/lib/newsData';

export default function NewsDetailPage() {
  const params = useParams();
  const newsId = params.id as string;
  const currentLocale = (params.locale as Locale) ?? 'zh';
  const t = useTranslations('home');

  // 页面标题在页面加载时立即显示动画
  const [titleInView, setTitleInView] = useState(false);
  const [contentInView, setContentInView] = useState(false);
  
  // 页面加载时立即触发动画
  useEffect(() => {
    setTitleInView(true);
    const timer = setTimeout(() => {
      setContentInView(true);
    }, 200);
    return () => clearTimeout(timer);
  }, []);


  const currentNews = newsData[newsId] || newsData['1'];
  const newsImage = currentNews.image;
  const localeKey = currentLocale === 'en' ? 'en' : 'zh';
  const firstParagraph = currentNews.title[localeKey];
  const secondParagraph = currentNews.content[localeKey];

  return (
    <div className="relative min-h-screen bg-white" style={{ fontSize: '0.72em' }}>
      {/* 内容区域 */}
      <div className="relative z-10 pt-32 pb-32">
        <div className="container max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 lg:px-[80px]">
          {/* 页面标题 - 第一段文字（图片上方） */}
          <div 
            className="text-center mb-8"
            style={{
              opacity: titleInView ? 1 : 0,
              transform: titleInView ? 'translateY(0)' : 'translateY(20px)',
              transition: 'opacity 0.6s ease-out, transform 0.6s ease-out'
            }}
          >
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold mb-4" style={{ color: '#156082' }}>
              {firstParagraph}
            </h1>
          </div>

          {/* 新闻图片 - 高清分辨率显示 */}
          <div 
            className="w-full mb-12 flex items-center justify-center"
          >
            <div className="inline-block max-w-3xl">
              <img
                src={newsImage}
                alt="News"
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

          {/* 页面正文 - 第二段文字（图片下方） */}
          <div 
            className="max-w-4xl mx-auto"
            style={{
              opacity: contentInView ? 1 : 0,
              transform: contentInView ? 'translateY(0)' : 'translateY(20px)',
              transition: 'opacity 0.6s ease-out 0.2s, transform 0.6s ease-out 0.2s'
            }}
          >
            <div 
              className="text-sm md:text-base text-gray-700 leading-relaxed whitespace-pre-line"
              dangerouslySetInnerHTML={{ __html: secondParagraph.replace(/\n/g, '<br />') }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

