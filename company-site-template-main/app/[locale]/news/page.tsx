'use client';

import {useTranslations} from 'next-intl';
import type {Locale} from '@/i18n/routing';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { getNewsPreview } from '@/lib/newsData';

// 自定义 hook：检测元素是否进入视口
function useInView(options = {}) {
  const [isInView, setIsInView] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
        }
      },
      { threshold: 0.1, ...options }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  return [ref, isInView] as const;
}

export default function NewsPage({params:{locale}}:{params:{locale:string}}) {
  const currentLocale = (locale as Locale) ?? 'zh';
  const t = useTranslations('home');

  // 页面标题在页面加载时立即显示动画
  const [titleInView, setTitleInView] = useState(false);
  
  // 页面加载时立即触发标题的动画
  useEffect(() => {
    setTitleInView(true);
  }, []);

  // 新闻卡片网格的滚动检测
  const [newsGridRef, newsGridInView] = useInView();

  // 新闻数据，每个新闻项都有唯一的ID，用于链接到详情页
  const newsItems = [
    { id: '3', img: '/news3_new.png' }, // 2025-11 渡轮修复
    { id: '1', img: '/movenews.JPG' },   // 2025-09 BGC 乔迁
    { id: '2', img: '/news_tanay.jpeg' },// 2025-07 Tanay 首船
    { id: '4', img: '/news4.png' },      // 2025-04 平板驳船直达
  ];

  return (
    <div className="relative min-h-screen bg-white">
      {/* 内容区域 */}
      <div className="relative z-10 pt-32 pb-32" style={{ fontSize: '0.9em' }}>
        <div className="container max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 lg:px-[80px]">
          {/* 页面标题 - 左上方 */}
          <div 
            className="text-left mb-16"
            style={{
              opacity: titleInView ? 1 : 0,
              transform: titleInView ? 'translateY(0)' : 'translateY(20px)',
              transition: 'opacity 0.6s ease-out, transform 0.6s ease-out'
            }}
          >
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-brand-primary mb-4">
              {t('allNews')}
            </h1>
          </div>

          {/* 新闻卡片网格 - 移动端单列，桌面端三列布局 */}
          <div className="max-w-5xl mx-auto">
            <div 
              ref={newsGridRef as any}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-10 sm:gap-12 lg:gap-14"
              style={{
                opacity: newsGridInView ? 1 : 0,
                transform: newsGridInView ? 'translateY(0)' : 'translateY(30px)',
                transition: 'opacity 0.8s ease-out, transform 0.8s ease-out'
              }}
            >
              {newsItems.map((news, i) => {
                const localeKey = currentLocale === 'en' ? 'en' : 'zh';
                const preview = getNewsPreview(news.id, localeKey);
                return (
                <div
                  key={i}
                  className="rounded-card flex flex-col overflow-hidden transition-all hover:shadow-lg"
                >
                  <Link href={`/${currentLocale}/news/${news.id}`}>
                    <div className="w-full rounded-lg mb-4 bg-brand-accent-50 p-2 flex items-center justify-center cursor-pointer aspect-[4/3] overflow-hidden">
                      <img
                        src={news.img}
                        alt={preview.title}
                        className="rounded-lg transition-transform hover:scale-105 object-cover w-full h-full"
                        style={{ 
                          maxWidth: '100%',
                          maxHeight: '100%'
                        }}
                      />
                    </div>
                  </Link>
                  <div className="text-body leading-[150%] text-center px-2 md:px-2" style={{ fontSize: '1em' }}>
                    <p className="mb-3 font-bold text-center md:whitespace-nowrap md:overflow-hidden md:text-ellipsis" style={{ color: '#156082', fontSize: '1.08em' }}>
                      {preview.title}
                    </p>
                    <p className="text-gray-400 line-clamp-2 md:line-clamp-2 mb-2 text-justify md:text-justify" style={{ minHeight: '3em' }}>
                      {preview.preview}...
                    </p>
                    {preview.date && (
                      <p className="text-gray-400 text-right text-sm mt-3">
                        {preview.date}
                      </p>
                    )}
                  </div>
                </div>
              );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

