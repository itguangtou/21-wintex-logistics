'use client';

import type { Locale } from '@/i18n/routing';
import { useEffect, useRef, useState } from 'react';
import type { AboutPageContent } from '@/lib/aboutPageContent';

function useInView(options = {}) {
  const [isInView, setIsInView] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsInView(true);
      },
      {
        threshold: 0.2,
        rootMargin: '0px 0px -100px 0px',
        ...options,
      }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, isInView] as const;
}

export default function AboutPageClient({
  locale,
  initialContent,
}: {
  locale: string;
  initialContent: AboutPageContent;
}) {
  const currentLocale = (locale as Locale) ?? 'zh';
  const lang = currentLocale === 'en' ? 'en' : 'zh';
  const pageContent = initialContent;

  const [section1InView, setSection1InView] = useState(true);
  const [section2InView, setSection2InView] = useState(true);
  const [section3InView, setSection3InView] = useState(true);

  useEffect(() => {
    setSection1InView(true);
    setSection2InView(true);
    setSection3InView(true);
  }, []);

  const [bgImageLoaded, setBgImageLoaded] = useState(true);
  const [bgImageError, setBgImageError] = useState(false);

  const [networkRef, networkInView] = useInView();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const intro = pageContent.intro;
  const networkItems = pageContent.network.items;
  const bgUrl = pageContent.backgroundImage || '/highresolution/WechatIMG153.jpg';
  const logoUrl = pageContent.network.centerLogo || '/logo.png';
  const introInView = [section1InView, section2InView, section3InView];

  const cornerNodes = [
    { position: 'left-top', x: '15%', y: '40%', yMobile: '43%', delay: 1.2, itemIndex: 0 },
    { position: 'right-top', x: '85%', y: '40%', yMobile: '43%', delay: 1.4, itemIndex: 1 },
    { position: 'left-bottom', x: '15%', y: '60%', yMobile: '57%', delay: 1.6, itemIndex: 2 },
    { position: 'right-bottom', x: '85%', y: '60%', yMobile: '57%', delay: 1.8, itemIndex: 3 },
  ];

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 z-0">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: bgImageLoaded && !bgImageError ? `url(${bgUrl})` : 'none',
            backgroundColor: bgImageError ? '#1a1a1a' : 'transparent',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: bgImageLoaded ? 1 : 0,
            transition: 'opacity 1.2s ease-in-out',
            willChange: 'opacity',
          }}
        />
        <div
          className="absolute inset-0 bg-black/40"
          style={{
            opacity: bgImageLoaded ? 1 : 0,
            transition: 'opacity 1.2s ease-in-out',
          }}
        />
      </div>

      <div className="relative z-10 pt-32 pb-32" style={{ fontSize: '0.9em' }}>
        <div className="container max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 lg:px-[80px]">
          <div className="max-w-[1287px] mx-auto space-y-16 md:space-y-24">
            {intro.map((block, bi) => {
              const inView = introInView[bi] ?? true;
              return (
                <div
                  key={bi}
                  className="max-w-4xl mx-auto text-center"
                  style={{
                    opacity: inView ? 1 : 0,
                    transform: inView ? 'translateY(0)' : 'translateY(30px)',
                    transition: 'opacity 0.8s ease-out, transform 0.8s ease-out',
                  }}
                >
                  <h2 className="text-1xl md:text-2xl lg:text-3xl font-bold text-brand-accent mb-6 leading-tight">
                    {block.title[lang]}
                  </h2>
                  <div className="space-y-6">
                    {block.body.map((para, pi) => (
                      <p key={pi} className="text-sm md:text-xl text-white/90 leading-relaxed">
                        {para[lang]}
                      </p>
                    ))}
                  </div>

                  {bi === intro.length - 1 && (
                    <div
                      className="flex flex-col justify-center items-center mt-16 gap-2"
                      style={{
                        opacity: inView ? 1 : 0,
                        transform: inView ? 'translateY(0)' : 'translateY(30px)',
                        transition: 'opacity 0.8s ease-out 0.6s, transform 0.8s ease-out 0.6s',
                        marginBottom: '-4rem',
                      }}
                    >
                      {[0, 0.3, 0.6].map((delay, i) => (
                        <svg
                          key={i}
                          className="w-12 h-12 md:w-24 md:h-24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#F7B959"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{
                            animation: 'blink 1.5s ease-in-out infinite',
                            animationDelay: `${delay}s`,
                            opacity: 1 - i * 0.2,
                          }}
                        >
                          <path d="M6 9l6 6 6-6" />
                        </svg>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            <div
              ref={networkRef as any}
              className="relative w-full h-screen min-h-[800px] flex items-center justify-center"
              style={{
                opacity: networkInView ? 1 : 0,
                transform: networkInView ? 'scale(1)' : 'scale(0.95)',
                transition: networkInView ? 'opacity 1s ease-out, transform 1s ease-out' : 'none',
              }}
            >
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{
                  opacity: networkInView ? 1 : 0,
                  transition: networkInView ? 'opacity 1.5s ease-out 0.5s' : 'none',
                }}
              >
                <line
                  x1="50%"
                  y1={isMobile ? '43%' : '40%'}
                  x2="15%"
                  y2={isMobile ? '43%' : '40%'}
                  stroke="rgba(247, 185, 89, 0.6)"
                  strokeWidth="2"
                  strokeDasharray={networkInView ? '0' : '10,5'}
                  style={{
                    transition: networkInView ? 'stroke-dasharray 1s ease-out 1s' : 'none',
                  }}
                />
                <line
                  x1="50%"
                  y1={isMobile ? '43%' : '40%'}
                  x2="85%"
                  y2={isMobile ? '43%' : '40%'}
                  stroke="rgba(247, 185, 89, 0.6)"
                  strokeWidth="2"
                  strokeDasharray={networkInView ? '0' : '10,5'}
                  style={{ transition: 'stroke-dasharray 1s ease-out 1.2s' }}
                />
                <line
                  x1="50%"
                  y1={isMobile ? '57%' : '60%'}
                  x2="15%"
                  y2={isMobile ? '57%' : '60%'}
                  stroke="rgba(247, 185, 89, 0.6)"
                  strokeWidth="2"
                  strokeDasharray={networkInView ? '0' : '10,5'}
                  style={{ transition: 'stroke-dasharray 1s ease-out 1.4s' }}
                />
                <line
                  x1="50%"
                  y1={isMobile ? '57%' : '60%'}
                  x2="85%"
                  y2={isMobile ? '57%' : '60%'}
                  stroke="rgba(247, 185, 89, 0.6)"
                  strokeWidth="2"
                  strokeDasharray={networkInView ? '0' : '10,5'}
                  style={{ transition: 'stroke-dasharray 1s ease-out 1.6s' }}
                />
                <line
                  x1="50%"
                  y1="50%"
                  x2="50%"
                  y2={isMobile ? '72%' : '85%'}
                  stroke="rgba(247, 185, 89, 0.6)"
                  strokeWidth="2"
                  strokeDasharray={networkInView ? '0' : '10,5'}
                  style={{ transition: 'stroke-dasharray 1s ease-out 2s' }}
                />
                {[
                  { x: 32.5, y: isMobile ? 43 : 40 },
                  { x: 67.5, y: isMobile ? 43 : 40 },
                  { x: 32.5, y: isMobile ? 57 : 60 },
                  { x: 67.5, y: isMobile ? 57 : 60 },
                  { x: 50, y: isMobile ? 61 : 67.5 },
                ].map((point, i) => {
                  const scale = networkInView ? 1 : 0;
                  return (
                    <g
                      key={i}
                      transform={`translate(${point.x}%, ${point.y}%) scale(${scale})`}
                      style={{
                        opacity: networkInView ? 1 : 0,
                        transition: networkInView
                          ? `opacity 0.5s ease-out ${1.8 + i * 0.2}s, transform 0.5s ease-out ${1.8 + i * 0.2}s`
                          : 'none',
                      }}
                    >
                      <polygon
                        points="0,-8 8,0 0,8 -8,0"
                        fill="#F7B959"
                        stroke="rgba(247, 185, 89, 0.8)"
                        strokeWidth="1"
                      />
                    </g>
                  );
                })}
              </svg>

              <div
                className="relative z-20 flex items-center justify-center"
                style={{
                  opacity: networkInView ? 1 : 0,
                  transform: networkInView ? 'scale(1)' : 'scale(0)',
                  transition: networkInView
                    ? 'opacity 0.8s ease-out 0.8s, transform 0.8s ease-out 0.8s'
                    : 'none',
                }}
              >
                <div className="absolute w-32 h-32 md:w-80 md:h-80 rounded-full bg-gray-400" />
                <div className="relative w-24 h-24 md:w-64 md:h-64 rounded-full bg-white border-2 border-brand-accent flex flex-col items-center justify-center overflow-hidden">
                  <img
                    src={logoUrl}
                    alt="Wintex Logo"
                    className="object-contain"
                    style={{ width: '60%', height: '60%' }}
                  />
                </div>
              </div>

              {cornerNodes.map((node) => {
                const text = networkItems[node.itemIndex]?.[lang] || '';
                return (
                  <div
                    key={node.position}
                    className="absolute rounded-2xl bg-white/10 backdrop-blur-md border-2 border-brand-accent/70 p-1.5 md:p-5 w-[110px] md:w-[280px] min-h-[50px] md:min-h-[105px] flex flex-col justify-center text-center shadow-lg"
                    style={{
                      left: node.x,
                      top: isMobile && node.yMobile ? node.yMobile : node.y,
                      opacity: networkInView ? 1 : 0,
                      transform: networkInView
                        ? 'translate(-50%, -50%) scale(1)'
                        : 'translate(-50%, -50%) scale(0)',
                      transition: networkInView
                        ? `opacity 0.6s ease-out ${node.delay}s, transform 0.6s ease-out ${node.delay}s`
                        : 'none',
                    }}
                  >
                    <div className="text-[8px] md:text-xs text-white/80 leading-tight md:leading-relaxed">
                      <div className="flex items-start justify-center gap-0.5 md:gap-2">
                        <svg
                          width="6"
                          height="6"
                          viewBox="0 0 12 12"
                          className="flex-shrink-0 mt-0.5 md:mt-1"
                          style={{ width: '6px', height: '6px' }}
                        >
                          <polygon
                            points="6,0 12,6 6,12 0,6"
                            fill="#F7B959"
                            stroke="rgba(247, 185, 89, 0.8)"
                            strokeWidth="0.5"
                          />
                        </svg>
                        <span className="text-center">
                          {node.itemIndex + 1}. {text}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div
                className="absolute rounded-xl bg-white/10 backdrop-blur-md border-2 border-brand-accent/70 p-1.5 md:p-6 w-[55%] max-w-[110px] md:w-[90%] md:max-w-[260px] text-center shadow-lg"
                style={{
                  left: '50%',
                  top: isMobile ? '72%' : '85%',
                  opacity: networkInView ? 1 : 0,
                  transform: networkInView
                    ? 'translate(-50%, -50%) scale(1)'
                    : 'translate(-50%, -50%) scale(0)',
                  transition: networkInView
                    ? 'opacity 0.6s ease-out 2.2s, transform 0.6s ease-out 2.2s'
                    : 'none',
                }}
              >
                <div className="text-[8px] md:text-xs text-white/80 leading-tight md:leading-relaxed">
                  <div className="flex items-start justify-center gap-0.5 md:gap-2">
                    <svg
                      width="6"
                      height="6"
                      viewBox="0 0 12 12"
                      className="flex-shrink-0 mt-0.5 md:mt-1"
                      style={{ width: '6px', height: '6px' }}
                    >
                      <polygon
                        points="6,0 12,6 6,12 0,6"
                        fill="#F7B959"
                        stroke="rgba(247, 185, 89, 0.8)"
                        strokeWidth="0.5"
                      />
                    </svg>
                    <span className="text-center">5. {networkItems[4]?.[lang] || ''}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
