'use client';

import {useTranslations} from 'next-intl';
import Link from 'next/link';
import type {Locale} from '@/i18n/routing';
import AnimatedNumber from '@/components/AnimatedNumber';
import StarMap from '@/components/StarMap';
import { useEffect, useRef, useState } from 'react';
import { getNewsPreview } from '@/lib/newsData';

// 自定义 hook：检测元素是否进入视口，支持手动触发动画
function useInView(options = {}) {
  const [isInView, setIsInView] = useState(false);
  const [triggerKey, setTriggerKey] = useState(0); // 用于强制重新触发动画
  const ref = useRef<HTMLElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // 手动触发动画的函数
  const triggerAnimation = () => {
    setIsInView(false);
    setTriggerKey(prev => prev + 1);
    // 短暂延迟后重新设置为 true，触发动画
    setTimeout(() => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        const isInViewport = rect.top < window.innerHeight && rect.bottom > 0;
        if (isInViewport) {
          setIsInView(true);
        }
      }
    }, 50);
  };

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // 清理旧的 observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
          observerRef.current = null;
        }
      },
      { threshold: 0.1, ...options }
    );

    observer.observe(element);
    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [triggerKey]);

  return [ref, isInView, triggerAnimation] as const;
}

export default function Home({params:{locale}}:{params:{locale:string}}) {
  const currentLocale = (locale as Locale) ?? 'zh';
  const t = useTranslations('home');
  
  // 计算年份：从2000年开始（2025年显示25年）
  const baseYear = 2000;
  const currentYear = new Date().getFullYear();
  const yearsOfExperience = currentYear - baseYear;
  
  // Hero
  const heroImgRef = useRef<HTMLImageElement>(null);
  const heroTitleRef = useRef<HTMLHeadingElement>(null);
  const heroSubtitleRef = useRef<HTMLParagraphElement>(null);
  const [heroImgInView, setHeroImgInView] = useState(false);
  const [heroTitleInView, setHeroTitleInView] = useState(false);
  const [heroSubtitleInView, setHeroSubtitleInView] = useState(false);
  
  useEffect(() => {
    setHeroImgInView(true);
    setHeroTitleInView(true);
    const timer = setTimeout(() => {
      setHeroSubtitleInView(true);
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  const [image1Ref, image1InView] = useInView();
  const [buttonSectionRef, buttonSectionInView] = useInView();
  const [missionSectionRef, missionSectionInView] = useInView();
  const [animatedNumberTrigger, setAnimatedNumberTrigger] = useState(0);
  
  useEffect(() => {
    if (missionSectionInView) {
      setAnimatedNumberTrigger(prev => prev + 1);
    }
  }, [missionSectionInView]);

  const [introSectionRef, introSectionInView] = useInView();
  const [strengthSectionRef, strengthSectionInView] = useInView();
  const [newsSectionRef, newsSectionInView] = useInView();
  const [equipmentSectionRef, equipmentSectionInView] = useInView();
  
  const newsItems = [
    { img: '/news3_new.png', id: '3' }, // 2025-11 渡轮修复
    { img: '/movenews.JPG', id: '1' },   // 2025-09 BGC 乔迁
    { img: '/news_tanay.jpeg', id: '2' },// 2025-07 Tanay 首船
    { img: '/news4.png', id: '4' },      // 2025-04 平板驳船直达
  ];
  const newsRefs = [
    useRef<HTMLImageElement>(null), 
    useRef<HTMLImageElement>(null), 
    useRef<HTMLImageElement>(null),
    useRef<HTMLImageElement>(null)
  ];
  const equipmentRefs = [useRef<HTMLImageElement>(null), useRef<HTMLImageElement>(null), useRef<HTMLImageElement>(null), useRef<HTMLImageElement>(null)];
  const [newsInViews, setNewsInViews] = useState(Array(newsItems.length).fill(false));
  const [equipmentInViews, setEquipmentInViews] = useState([false, false, false, false]);
  
  const newsObserversRef = useRef<IntersectionObserver[]>([]);
  const equipmentObserversRef = useRef<IntersectionObserver[]>([]);
  
  // news images
  useEffect(() => {
    setNewsInViews(Array(newsItems.length).fill(false));
    
    const setupObservers = () => {
      newsObserversRef.current.forEach(observer => observer.disconnect());
      newsObserversRef.current = [];
      
      newsRefs.forEach((ref, i) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const isInViewport = rect.top < window.innerHeight && rect.bottom > 0;
        
        if (isInViewport) {
          setTimeout(() => {
            setNewsInViews(prev => {
              if (prev[i]) return prev;
              const newState = [...prev];
              newState[i] = true;
              return newState;
            });
          }, 50 + i * 50);
        } else {
          const observer = new IntersectionObserver(
            ([entry]) => {
              if (entry.isIntersecting) {
                setNewsInViews(prev => {
                  if (prev[i]) return prev;
                  const newState = [...prev];
                  newState[i] = true;
                  return newState;
                });
                observer.disconnect();
                newsObserversRef.current = newsObserversRef.current.filter(obs => obs !== observer);
              }
            },
            { threshold: 0.1 }
          );
          observer.observe(ref.current);
          newsObserversRef.current.push(observer);
        }
      });
    };
    
    const timer = setTimeout(setupObservers, 150);
    return () => {
      clearTimeout(timer);
      newsObserversRef.current.forEach(observer => observer.disconnect());
      newsObserversRef.current = [];
    };
  }, []);
  
  // equipment images
  useEffect(() => {
    setEquipmentInViews([false, false, false, false]);
    
    const setupObservers = () => {
      equipmentObserversRef.current.forEach(observer => observer.disconnect());
      equipmentObserversRef.current = [];
      
      equipmentRefs.forEach((ref, i) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const isInViewport = rect.top < window.innerHeight && rect.bottom > 0;
        
        if (isInViewport) {
          setTimeout(() => {
            setEquipmentInViews(prev => {
              if (prev[i]) return prev;
              const newState = [...prev];
              newState[i] = true;
              return newState;
            });
          }, 50 + i * 50);
        } else {
          const observer = new IntersectionObserver(
            ([entry]) => {
              if (entry.isIntersecting) {
                setEquipmentInViews(prev => {
                  if (prev[i]) return prev;
                  const newState = [...prev];
                  newState[i] = true;
                  return newState;
                });
                observer.disconnect();
                equipmentObserversRef.current = equipmentObserversRef.current.filter(obs => obs !== observer);
              }
            },
            { threshold: 0.1 }
          );
          observer.observe(ref.current);
          equipmentObserversRef.current.push(observer);
        }
      });
    };
    
    const timer = setTimeout(setupObservers, 150);
    return () => {
      clearTimeout(timer);
      equipmentObserversRef.current.forEach(observer => observer.disconnect());
      equipmentObserversRef.current = [];
    };
  }, []);
  

  return (
    <main>
      {/* Hero Section */}
      <section
        className="relative w-full overflow-hidden"
        style={{ maxWidth: '100%' }}
      >
        <div className="w-full relative" style={{ maxWidth: '100%' }}>
          <div className="w-full mx-auto relative" style={{ aspectRatio: '1287/432', maxWidth: '100%', width: '100%' }}>
            <img
              ref={heroImgRef as any}
              src="/images/hero.png"
              alt="Hero"
              className="absolute inset-0 w-full h-full object-cover"
              style={{ 
                maxWidth: '100%', 
                height: 'auto', 
                width: '100%',
                objectPosition: 'center bottom',
                opacity: heroImgInView ? 1 : 0,
                transform: heroImgInView ? 'translateY(0)' : 'translateY(30px)',
                transition: heroImgInView ? 'opacity 0.8s ease-out, transform 0.8s ease-out' : 'none'
              }}
            />
            <div className="relative z-10 text-center h-full flex flex-col items-center justify-center px-4">
              <h1 
                ref={heroTitleRef as any}
                className="text-hero text-white mb-2 sm:mb-4"
                style={{
                  opacity: heroTitleInView ? 1 : 0,
                  transform: heroTitleInView ? 'translateY(0)' : 'translateY(30px)',
                  transition: heroTitleInView ? 'opacity 0.8s ease-out, transform 0.8s ease-out 0.2s' : 'none'
                }}
              >
                {t('heroTitle')}
              </h1>
              <p 
                ref={heroSubtitleRef as any}
                className="text-hero-sub text-brand-accent"
                style={{
                  opacity: heroSubtitleInView ? 1 : 0,
                  transform: heroSubtitleInView ? 'translateY(0)' : 'translateY(30px)',
                  transition: heroSubtitleInView ? 'opacity 0.8s ease-out 0.2s, transform 0.8s ease-out 0.2s' : 'none'
                }}
              >
                {t('heroSubtitle')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 三个图标按钮区域 */}
      <section
        className="flex items-center justify-center"
        style={{ maxWidth: '100%', paddingTop: 'clamp(32px, 3vw, 30px)', paddingBottom: 'clamp(32px, 3vw, 30px)', marginBottom: 'clamp(-16px, -1.5vw, -40px)' }}
        ref={buttonSectionRef as any}
      >
        <div className="w-full max-w-[1287px] mx-auto px-4 sm:px-6 md:px-8 flex items-center justify-center">
          <div className="flex flex-nowrap justify-evenly items-center w-full gap-4 sm:gap-8 md:gap-12 lg:gap-16">
            {/* 按钮 1 */}
            <button 
              onClick={() => {
                console.log('重型工程物流 clicked');
              }}
              className="flex flex-col items-center justify-center text-center cursor-pointer hover:opacity-80 transition-opacity relative flex-shrink-0"
              style={{ 
                border: 'none', 
                outline: 'none',
                background: 'transparent',
                boxShadow: 'none',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                fontFamily: 'Inter, ui-sans-serif, system-ui, Segoe UI, Helvetica, Arial, sans-serif',
                padding: 0,
                opacity: buttonSectionInView ? 1 : 0,
                transform: buttonSectionInView ? 'translateY(0)' : 'translateY(30px)',
                transition: buttonSectionInView ? 'opacity 0.8s ease-out 0.4s, transform 0.8s ease-out 0.4s' : 'none'
              }}
              onFocus={(e) => (e.target as HTMLButtonElement).style.outline = 'none'}
              onBlur={(e) => (e.target as HTMLButtonElement).style.outline = 'none'}
            >
              <div className="w-[clamp(30px,6vw,80px)] h-[clamp(28px,5.5vw,70px)] flex items-center justify-center mb-1 sm:mb-2" style={{ border: 'none', outline: 'none', flexShrink: 0 }}>
                <img src="/icons/Anchor.svg" alt="Anchor" className="w-full h-full object-contain" />
              </div>
              <p className="text-[clamp(9px,2vw,16px)] font-bold text-brand-primary text-center whitespace-nowrap leading-tight">
                {t('icon1Title')}
              </p>
            </button>

            {/* 按钮 2 */}
            <button 
              onClick={() => {
                console.log('可再生能源项目 clicked');
              }}
              className="flex flex-col items-center justify-center text-center cursor-pointer hover:opacity-80 transition-opacity relative flex-shrink-0"
              style={{ 
                border: 'none', 
                outline: 'none',
                background: 'transparent',
                boxShadow: 'none',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                fontFamily: 'Inter, ui-sans-serif, system-ui, Segoe UI, Helvetica, Arial, sans-serif',
                padding: 0,
                opacity: buttonSectionInView ? 1 : 0,
                transform: buttonSectionInView ? 'translateY(0)' : 'translateY(30px)',
                transition: buttonSectionInView ? 'opacity 0.8s ease-out 0.6s, transform 0.8s ease-out 0.6s' : 'none'
              }}
              onFocus={(e) => (e.target as HTMLButtonElement).style.outline = 'none'}
              onBlur={(e) => (e.target as HTMLButtonElement).style.outline = 'none'}
            >
              <div className="w-[clamp(30px,6vw,80px)] h-[clamp(28px,5.5vw,70px)] flex items-center justify-center mb-1 sm:mb-2" style={{ border: 'none', outline: 'none', flexShrink: 0 }}>
                <img src="/icons/Feather.svg" alt="Feather" className="w-full h-full object-contain" />
              </div>
              <p className="text-[clamp(9px,2vw,16px)] font-bold text-brand-primary text-center whitespace-nowrap leading-tight">
                {t('icon2Title')}
              </p>
            </button>

            {/* 按钮 3 */}
            <button 
              onClick={() => {
                console.log('菲律宾深耕 clicked');
              }}
              className="flex flex-col items-center justify-center text-center cursor-pointer hover:opacity-80 transition-opacity relative flex-shrink-0"
              style={{ 
                border: 'none', 
                outline: 'none',
                background: 'transparent',
                boxShadow: 'none',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                fontFamily: 'Inter, ui-sans-serif, system-ui, Segoe UI, Helvetica, Arial, sans-serif',
                padding: 0,
                opacity: buttonSectionInView ? 1 : 0,
                transform: buttonSectionInView ? 'translateY(0)' : 'translateY(30px)',
                transition: buttonSectionInView ? 'opacity 0.8s ease-out 0.8s, transform 0.8s ease-out 0.8s' : 'none'
              }}
              onFocus={(e) => (e.target as HTMLButtonElement).style.outline = 'none'}
              onBlur={(e) => (e.target as HTMLButtonElement).style.outline = 'none'}
            >
              <div className="w-[clamp(30px,6vw,80px)] h-[clamp(28px,5.5vw,70px)] flex items-center justify-center mb-1 sm:mb-2" style={{ border: 'none', outline: 'none', flexShrink: 0 }}>
                <img src="/icons/Box.svg" alt="Box" className="w-full h-full object-contain" />
              </div>
              <p className="text-[clamp(9px,2vw,16px)] font-bold text-brand-primary text-center whitespace-nowrap leading-tight">
                {t('icon3Title')}
              </p>
            </button>
          </div>
        </div>
      </section>

      {/* 深蓝色统计区域 */}
      <section
        id="mission"
        className="text-white scroll-mt-20 py-4 sm:py-6 md:py-10"
        style={{ maxWidth: '100%' }}
        ref={missionSectionRef as any}
      >
        <div className="w-full relative" style={{ maxWidth: '100%' }}>
          <div className="w-full mx-auto relative overflow-visible bg-brand-primary" style={{ aspectRatio: '1287/648', maxWidth: '100%', width: '100%' }}>
            <div className="relative z-10 flex flex-col px-4 sm:px-6 md:px-12 lg:px-[80px] pr-4 sm:pr-6 md:pr-12 lg:pr-[73px] h-full pb-3 sm:pb-4 md:pb-6 lg:pb-8 xl:pb-10">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-3 sm:mb-4 md:mb-6 lg:mb-8 gap-4 sm:gap-6 lg:gap-8 flex-shrink-0" style={{ position: 'relative', top: 'clamp(-15px, -2.5vw, -50px)' }}>
                <div className="flex flex-col flex-shrink-0" style={{ marginTop: 'clamp(10px, 2vw, 40px)' }}>
                  <div className="flex items-baseline gap-2">
                    <div
                      style={{
                        opacity: missionSectionInView ? 1 : 0,
                        transform: missionSectionInView ? 'translateY(0)' : 'translateY(30px)',
                        transition: missionSectionInView ? 'opacity 0.8s ease-out, transform 0.8s ease-out' : 'none'
                      }}
                    >
                      <AnimatedNumber 
                        key={`${currentLocale}-${animatedNumberTrigger}`}
                        target={yearsOfExperience} 
                        duration={2000}
                        className="text-display-lg text-gray-100"
                        trigger={animatedNumberTrigger}
                      />
                    </div>
                    <span 
                      className="text-[clamp(16px,2.5vw,30px)] font-bold text-gray-100" 
                      style={{ 
                        lineHeight: 'normal', 
                        letterSpacing: '-0.6px',
                        opacity: missionSectionInView ? 1 : 0,
                        transform: missionSectionInView ? 'translateY(0)' : 'translateY(30px)',
                        transition: missionSectionInView ? 'opacity 0.8s ease-out 0.1s, transform 0.8s ease-out 0.1s' : 'none'
                      }}
                    >
                      {t('statsYearsText')}
                    </span>
                  </div>
                  <span 
                    className="text-[clamp(16px,2.5vw,30px)] font-bold text-gray-100 mt-2" 
                    style={{ 
                      lineHeight: 'normal', 
                      letterSpacing: '-0.6px',
                      opacity: missionSectionInView ? 1 : 0,
                      transform: missionSectionInView ? 'translateY(0)' : 'translateY(30px)',
                      transition: missionSectionInView ? 'opacity 0.8s ease-out 0.2s, transform 0.8s ease-out 0.2s' : 'none'
                    }}
                  >
                    {t('statsExperience')}
                  </span>
                </div>
              </div>

              <div className="absolute inset-0 flex items-center justify-end" style={{ paddingTop: 'clamp(80px, 12vw, 150px)', paddingLeft: '0', paddingRight: 'clamp(20px, 3vw, 60px)', paddingBottom: '0', left: 'clamp(200px, 25vw, 400px)', maxWidth: '100%' }}>
                <div style={{ width: '100%', height: '100%', maxWidth: '100%', maxHeight: '100%' }}>
                  <StarMap>
                    <img
                      ref={image1Ref as any}
                      src="/images/image_1.png"
                      alt="World Map"
                      className="w-full h-full object-contain"
                      style={{ 
                        display: 'block', 
                        width: '100%',
                        height: '100%',
                        maxWidth: '100%',
                        maxHeight: '100%',
                        objectFit: 'contain',
                        opacity: image1InView ? 1 : 0,
                        transform: image1InView ? 'translateY(0)' : 'translateY(30px)',
                        transition: image1InView ? 'opacity 0.8s ease-out, transform 0.8s ease-out' : 'none'
                      }}
                    />
                  </StarMap>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 关于我们 */}
      <section id="about" className="bg-white scroll-mt-20 py-4 sm:py-6 md:py-10" style={{ maxWidth: '100%' }}>
        <div className="container max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 lg:px-[80px]" style={{ maxWidth: '100%' }}>
          <div className="max-w-[1287px] mx-auto" style={{ maxWidth: '100%' }}>
            <div className="flex flex-col md:flex-row gap-6 sm:gap-8 md:gap-[60px] items-center">
              <div className="flex-1" ref={introSectionRef as any}>
                <h2 
                  className="text-section-title text-brand-primary mb-4 text-base sm:text-lg md:text-2xl lg:text-3xl"
                  style={{
                    opacity: introSectionInView ? 1 : 0,
                    transform: introSectionInView ? 'translateY(0)' : 'translateY(30px)',
                    transition: introSectionInView ? 'opacity 0.8s ease-out, transform 0.8s ease-out' : 'none'
                  }}
                >
                  {t('introTitle')}
                </h2>
                <p 
                  className="text-subtitle text-brand-accent mb-6"
                  style={{
                    fontSize: 'clamp(12px, 2.25vw, 18px)',
                    opacity: introSectionInView ? 1 : 0,
                    transform: introSectionInView ? 'translateY(0)' : 'translateY(30px)',
                    transition: introSectionInView ? 'opacity 0.8s ease-out 0.1s, transform 0.8s ease-out 0.1s' : 'none'
                  }}
                >
                  {t('introSubtitle')}
                </p>
                <p 
                  className="text-body text-gray-400 mb-8"
                  style={{
                    fontSize: '0.75em',
                    opacity: introSectionInView ? 1 : 0,
                    transform: introSectionInView ? 'translateY(0)' : 'translateY(30px)',
                    transition: introSectionInView ? 'opacity 0.8s ease-out 0.2s, transform 0.8s ease-out 0.2s' : 'none'
                  }}
                >
                  {t('introDesc')}
                </p>
                <Link 
                  href={`/${currentLocale}/about`} 
                  className="btn btn-primary"
                  style={{
                    fontSize: 'clamp(12px, 2.25vw, 18px)',
                    opacity: introSectionInView ? 1 : 0,
                    transform: introSectionInView ? 'translateY(0)' : 'translateY(30px)',
                    transition: introSectionInView ? 'opacity 0.8s ease-out 0.3s, transform 0.8s ease-out 0.3s' : 'none'
                  }}
                >
                  {t('ctaPlan')}
                </Link>
              </div>

              <div className="flex-1" style={{ maxWidth: '100%' }}>
                <img
                  src="/images/introduction.png"
                  alt="Introduction"
                  className="w-full h-auto rounded-lg"
                  style={{ 
                    maxWidth: '100%', 
                    height: 'auto', 
                    width: '100%',
                    opacity: introSectionInView ? 1 : 0,
                    transform: introSectionInView ? 'translateY(0)' : 'translateY(30px)',
                    transition: introSectionInView ? 'opacity 0.8s ease-out 0.4s, transform 0.8s ease-out 0.4s' : 'none'
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 新闻区域 */}
      <section id="news" className="bg-white scroll-mt-20 py-4 sm:py-6 md:py-10" style={{ maxWidth: '100%' }} ref={newsSectionRef as any}>
        <div className="container max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 lg:px-[80px] pr-4 sm:pr-6 md:pr-8 lg:pr-[73px]" style={{ maxWidth: '100%' }}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
            <h2 
              className="text-section-title text-brand-primary text-base sm:text-lg md:text-2xl lg:text-3xl"
              style={{
                opacity: newsSectionInView ? 1 : 0,
                transform: newsSectionInView ? 'translateY(0)' : 'translateY(30px)',
                transition: newsSectionInView ? 'opacity 0.8s ease-out, transform 0.8s ease-out' : 'none'
              }}
            >
              {t('newsTitle')}
            </h2>
            <Link 
              href={`/${currentLocale}/news`} 
              className="inline-flex items-center justify-center bg-gray-50 text-brand-primary hover:bg-gray-100 rounded-button px-6 py-3 font-medium transition-colors shadow-button whitespace-nowrap"
              style={{
                fontSize: 'clamp(12px, 2.25vw, 18px)',
              }}
            >
              {t('allNews')}
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {newsItems.map((news, i) => {
              const localeKey = currentLocale === 'en' ? 'en' : 'zh';
              const preview = getNewsPreview(news.id, localeKey);
              return (
              <div
                key={i}
                className="rounded-card flex flex-col overflow-hidden transition-all hover:shadow-lg"
              >
                <Link href={`/${currentLocale}/news/${news.id}`}>
                  <div className="w-full rounded-lg mb-3 bg-brand-accent-50 p-[11.7px] flex items-center justify-center cursor-pointer aspect-[4/3] overflow-hidden">
                    <img
                      ref={newsRefs[i]}
                      src={news.img}
                      alt={preview.title}
                      className="w-full h-full object-cover rounded-lg transition-transform hover:scale-105"
                      style={{ 
                        maxWidth: '100%',
                        maxHeight: '100%',
                        opacity: newsInViews[i] ? 1 : 0,
                        transform: newsInViews[i] ? 'translateY(0)' : 'translateY(30px)',
                        transition: newsInViews[i] ? `opacity 0.8s ease-out ${i * 0.1}s, transform 0.8s ease-out ${i * 0.1}s` : 'none'
                      }}
                    />
                  </div>
                </Link>
                <div 
                  className="text-body leading-[150%] min-h-[5rem] text-center"
                  style={{
                    fontSize: '0.9375em',
                    opacity: newsInViews[i] ? 1 : 0,
                    transform: newsInViews[i] ? 'translateY(0)' : 'translateY(30px)',
                    transition: newsInViews[i] ? `opacity 0.8s ease-out ${(i * 0.1 + 0.2)}s, transform 0.8s ease-out ${(i * 0.1 + 0.2)}s` : 'none'
                  }}
                >
                  <p className="mb-2 font-bold truncate" style={{ color: '#156082' }}>
                    {preview.title}
                  </p>
                  <p className="text-gray-400 line-clamp-2 mb-1">
                    {preview.preview}...
                  </p>
                  {preview.date && (
                    <p className="text-gray-400 text-right text-sm mt-2">
                      {preview.date}
                    </p>
                  )}
                </div>
              </div>
            );
            })}
          </div>
        </div>
      </section>

      {/* 实力见证 */}
      <section id="strength" className="bg-white scroll-mt-20 py-4 sm:py-6 md:py-10" style={{ maxWidth: '100%', paddingBottom: 'clamp(60px, 8vw, 40px)' }}>
        <div className="container max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 lg:px-[80px] pr-4 sm:pr-6 md:pr-8 lg:pr-[73px]" style={{ maxWidth: '100%' }}>
          <div className="flex flex-col md:flex-row gap-6 sm:gap-8 md:gap-[60px] items-start">
            <div className="flex-1" style={{ maxWidth: '100%', overflow: 'visible', display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-start' }}>
              <img
                src="/images/strength.png"
                alt="Proof of Strength"
                className="rounded-lg"
                style={{ 
                  maxWidth: '100%', 
                  height: 'auto', 
                  width: '100%',
                  transform: strengthSectionInView ? 'scale(0.85) translateY(0)' : 'scale(0.85) translateY(30px)',
                  transformOrigin: 'left top',
                  opacity: strengthSectionInView ? 1 : 0,
                  transition: strengthSectionInView ? 'opacity 0.8s ease-out, transform 0.8s ease-out' : 'none',
                  marginTop: '0px',
                  marginBottom: '0px'
                }}
              />
            </div>

            <div className="flex-1" ref={strengthSectionRef as any} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', position: 'relative', zIndex: 10 }}>
                <h2 
                  className="text-section-title text-brand-primary mb-4"
                  style={{
                    fontSize: 'clamp(15px, 3.75vw, 36px)',
                    opacity: strengthSectionInView ? 1 : 0,
                    transform: strengthSectionInView ? 'translateY(0)' : 'translateY(30px)',
                    transition: strengthSectionInView ? 'opacity 0.8s ease-out 0.2s, transform 0.8s ease-out 0.2s' : 'none'
                  }}
                >
                  {t('strengthTitle')}
                </h2>
                <p 
                  className="text-subtitle text-brand-accent mb-6"
                  style={{
                    fontSize: 'clamp(12px, 2.25vw, 18px)',
                    opacity: strengthSectionInView ? 1 : 0,
                    transform: strengthSectionInView ? 'translateY(0)' : 'translateY(30px)',
                    transition: strengthSectionInView ? 'opacity 0.8s ease-out 0.3s, transform 0.8s ease-out 0.3s' : 'none'
                  }}
                >
                  {t('strengthSubtitle')}
                </p>
                <p 
                  className="text-body text-gray-400 mb-8"
                  style={{
                    fontSize: '0.75em',
                    opacity: strengthSectionInView ? 1 : 0,
                    transform: strengthSectionInView ? 'translateY(0)' : 'translateY(30px)',
                    transition: strengthSectionInView ? 'opacity 0.8s ease-out 0.4s, transform 0.8s ease-out 0.4s' : 'none'
                  }}
                >
                  {t('strengthDesc')}
                </p>
                <Link 
                  href={`/${currentLocale}/mission`} 
                  className="btn btn-primary"
                  style={{
                    fontSize: 'clamp(12px, 2.25vw, 18px)',
                    opacity: strengthSectionInView ? 1 : 0,
                    transform: strengthSectionInView ? 'translateY(0)' : 'translateY(30px)',
                    transition: strengthSectionInView ? 'opacity 0.8s ease-out 0.5s, transform 0.8s ease-out 0.5s' : 'none',
                    position: 'relative',
                    zIndex: 20
                  }}
                >
                  {t('readMore')}
                </Link>
              </div>
            </div>
        </div>
      </section>

      {/* 设备清单 */}
      <section id="equipment" className="bg-brand-accent scroll-mt-20 py-4 sm:py-6 md:py-10" style={{ maxWidth: '100%', marginTop: 'clamp(0px, 0vw, -120px)' }} ref={equipmentSectionRef as any}>
        <div className="container max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 lg:px-[80px] pr-4 sm:pr-6 md:pr-8 lg:pr-[73px]" style={{ maxWidth: '100%'}}>
          <div className="max-w-[1287px] mx-auto" style={{ maxWidth: '100%' }}>
            <div className="flex flex-row justify-between items-center mb-6 sm:mb-8 gap-2 sm:gap-4">
              <h2 
                className="text-section-title text-white shrink-0 sm:flex-shrink"
                style={{
                  fontSize: 'clamp(15px, 3.75vw, 36px)',
                  opacity: equipmentSectionInView ? 1 : 0,
                  transform: equipmentSectionInView ? 'translateY(0)' : 'translateY(30px)',
                  transition: equipmentSectionInView ? 'opacity 0.8s ease-out, transform 0.8s ease-out' : 'none',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: 'calc(100% - 100px)'
                }}
              >
                {t('equipmentListTitle')}
              </h2>
              <Link 
                href={`/${currentLocale}/equipment`} 
                className="inline-flex items-center justify-center bg-white text-brand-primary hover:bg-gray-100 rounded-button px-2 sm:px-6 py-1.5 sm:py-3 font-medium transition-colors whitespace-nowrap shrink-0"
                style={{
                  fontSize: 'clamp(10px, 2vw, 18px)',
                }}
              >
                {t('readMore')}
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {[
                { img: '/images/equipment_1.jpg', name: t('equip1Name') },
                { img: '/images/equipment_2.jpg', name: t('equip2Name') },
                { img: '/images/equipment_3.jpg', name: t('equip3Name') },
                { img: '/images/equipment_4.jpg', name: t('equip4Name') },
              ].map((equip, i) => (
                <div
                  key={i}
                  className="bg-white rounded-lg overflow-hidden"
                >
                  <div className="aspect-video" style={{ maxWidth: '100%' }}>
                    <img
                      ref={equipmentRefs[i]}
                      src={equip.img}
                      alt={equip.name}
                      className="w-full h-full object-cover"
                      style={{ 
                        maxWidth: '100%', 
                        height: 'auto', 
                        width: '100%',
                        opacity: equipmentInViews[i] ? 1 : 0,
                        transform: equipmentInViews[i] ? 'translateY(0)' : 'translateY(30px)',
                        transition: equipmentInViews[i] ? `opacity 0.8s ease-out ${i * 0.1}s, transform 0.8s ease-out ${i * 0.1}s` : 'none'
                      }}
                    />
                  </div>
                  <p 
                    className="text-brand-primary text-center py-2 sm:py-3"
                    style={{
                      fontSize: 'clamp(12px, 2.25vw, 18px)',
                      opacity: equipmentInViews[i] ? 1 : 0,
                      transform: equipmentInViews[i] ? 'translateY(0)' : 'translateY(30px)',
                      transition: equipmentInViews[i] ? `opacity 0.8s ease-out ${(i * 0.1 + 0.2)}s, transform 0.8s ease-out ${(i * 0.1 + 0.2)}s` : 'none'
                    }}
                  >
                    {equip.name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-white scroll-mt-20 py-4 sm:py-6 md:py-10" style={{ maxWidth: '100%', paddingTop: 'clamp(60px, 7vw, 80px)' }}>
        <div className="container max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 lg:px-[80px] pr-4 sm:pr-6 md:pr-8 lg:pr-[73px]" style={{ maxWidth: '100%' }}>
          <div className="max-w-[1287px] mx-auto" style={{ maxWidth: '100%' }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 mb-6 sm:mb-8">
              <div>
                <h3 className="text-1xl md:text-2xl lg:text-3xl font-bold text-brand-primary mb-6 leading-tight">{t('contactUsTitle')}</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <img src="/icons/Phone.svg" alt="Phone" className="w-[30px] h-[30px]" style={{ maxWidth: '100%', height: 'auto' }} />
                    <span className="text-body text-gray-500 text-[1.035em] md:text-[1.15em]">{t('contactTel')}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <img src="/icons/Mail.svg" alt="Mail" className="w-[30px] h-[30px]" style={{ maxWidth: '100%', height: 'auto' }} />
                    <span className="text-body text-gray-500 text-[1.035em] md:text-[1.15em]">{t('contactEmail')}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <img src="/icons/Map pin.svg" alt="Map pin" className="w-[30px] h-[30px]" style={{ maxWidth: '100%', height: 'auto' }} />
                    <span className="text-body text-gray-500 text-[1.035em] md:text-[1.15em]">{t('contactAddress')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
