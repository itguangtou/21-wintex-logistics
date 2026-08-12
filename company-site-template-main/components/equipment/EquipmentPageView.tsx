'use client';

import { useEffect, useRef, useState } from 'react';
import type { EquipmentPageContent } from '@/lib/equipmentPageContent';

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
    return () => observer.disconnect();
  }, []);

  return [ref, isInView] as const;
}

type Props = {
  locale: string;
  content: EquipmentPageContent;
};

/** 前台展示：保留原页面布局与动效；文案/图片来自 props，不 fetch */
export default function EquipmentPageView({ locale, content }: Props) {
  const lang = locale === 'en' ? 'en' : 'zh';
  const [titleInView, setTitleInView] = useState(false);
  const [imageGridInView, setImageGridInView] = useState(false);
  const [firstModuleRef, firstModuleInView] = useInView();
  const [secondModuleRef, secondModuleInView] = useInView();

  useEffect(() => {
    setTitleInView(true);
    const timer = setTimeout(() => setImageGridInView(true), 200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative min-h-screen bg-white">
      <div className="relative z-10 pt-32 pb-32" style={{ fontSize: '0.9em' }}>
        <div className="container max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 lg:px-[80px]">
          <div
            className="text-left mb-16"
            style={{
              opacity: titleInView ? 1 : 0,
              transform: titleInView ? 'translateY(0)' : 'translateY(20px)',
              transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
            }}
          >
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-brand-primary mb-4">
              {content.pageTitle[lang]}
            </h1>
          </div>

          <div
            className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 max-w-6xl mx-auto mb-16"
            style={{
              opacity: imageGridInView ? 1 : 0,
              transform: imageGridInView ? 'translateY(0)' : 'translateY(20px)',
              transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
            }}
          >
            {content.gallery.map((item, index) => (
              <div key={index} className="group">
                <div className="mb-4 text-center">
                  <h3 className="text-xl md:text-2xl font-bold text-brand-primary">
                    {item.name[lang]}
                  </h3>
                </div>
                <div className="relative">
                  <div className="aspect-video bg-equip-blue rounded-lg shadow-lg transform group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 p-2 flex items-center justify-center">
                    <div
                      className="w-full h-full relative overflow-hidden rounded-lg"
                      style={{ backgroundColor: 'transparent' }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.image}
                        alt={item.name[lang]}
                        className="w-full h-full object-contain"
                        style={{ filter: 'none', backgroundColor: 'transparent' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div
            ref={firstModuleRef as any}
            className="bg-brand-primary rounded-lg p-8 md:p-12 max-w-6xl mx-auto mb-8"
            style={{
              opacity: firstModuleInView ? 1 : 0,
              transform: firstModuleInView ? 'translateY(0)' : 'translateY(30px)',
              transition: 'opacity 0.8s ease-out, transform 0.8s ease-out',
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
              {content.detailModule1.row1.map((item, index) => (
                <div key={index} className="flex flex-col">
                  <h3 className="text-lg md:text-xl font-bold text-brand-accent mb-3">
                    {item.title[lang]}
                  </h3>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 flex flex-col border-2 border-brand-accent flex-grow">
                    <p className="text-sm md:text-base text-white/90 leading-relaxed">
                      {item.desc[lang]}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {content.detailModule1.row2.map((item, index) => (
                <div key={index} className="flex flex-col">
                  <h3 className="text-lg md:text-xl font-bold text-brand-accent mb-3">
                    {item.title[lang]}
                  </h3>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 flex flex-col border-2 border-brand-accent flex-grow">
                    <p className="text-sm md:text-base text-white/90 leading-loose">
                      {item.desc[lang]}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            ref={secondModuleRef as any}
            className="bg-brand-primary rounded-lg p-8 md:p-12 max-w-6xl mx-auto"
            style={{
              opacity: secondModuleInView ? 1 : 0,
              transform: secondModuleInView ? 'translateY(0)' : 'translateY(30px)',
              transition: 'opacity 0.8s ease-out, transform 0.8s ease-out',
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
              {content.detailModule2.row1.map((item, index) => (
                <div key={index} className="flex flex-col">
                  <h3 className="text-lg md:text-xl font-bold text-brand-accent mb-3">
                    {item.title[lang]}
                  </h3>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 flex flex-col border-2 border-brand-accent flex-grow">
                    <p className="text-sm md:text-base text-white/90 leading-relaxed">
                      {item.desc[lang]}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {content.detailModule2.row2.map((item, index) => (
                <div key={index} className="flex flex-col">
                  <h3 className="text-lg md:text-xl font-bold text-brand-accent mb-3">
                    {item.title[lang]}
                  </h3>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 flex flex-col border-2 border-brand-accent flex-grow">
                    <p className="text-sm md:text-base text-white/90 leading-relaxed">
                      {item.desc[lang]}
                    </p>
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
