'use client';

import {useTranslations} from 'next-intl';
import type {Locale} from '@/i18n/routing';
import { useEffect, useRef, useState } from 'react';

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
      { 
        threshold: 0.2, // 当元素20%进入视口时触发，确保动画更明显
        rootMargin: '0px 0px -100px 0px', // 提前100px触发，让动画更早开始
        ...options 
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  return [ref, isInView] as const;
}

export default function AboutPage({params:{locale}}:{params:{locale:string}}) {
  const currentLocale = (locale as Locale) ?? 'zh';
  const t = useTranslations('home');
  
  // 背景图片加载状态
  const [bgImageLoaded, setBgImageLoaded] = useState(false);
  const [bgImageError, setBgImageError] = useState(false);
  
  // 预加载背景图片
  useEffect(() => {
    const img = new Image();
    img.src = '/highresolution/WechatIMG153.jpg';
    img.onload = () => {
      setBgImageLoaded(true);
    };
    img.onerror = () => {
      setBgImageError(true);
      // 即使加载失败，也显示背景（使用占位色）
      setBgImageLoaded(true);
    };
  }, []);
  
  // 文字部分的动画状态 - 页面加载时立即触发
  const [section1InView, setSection1InView] = useState(false);
  const [section2InView, setSection2InView] = useState(false);
  const [section3InView, setSection3InView] = useState(false);
  
  // 页面加载时立即触发文字部分的动画
  useEffect(() => {
    setSection1InView(true);
    setTimeout(() => setSection2InView(true), 200);
    setTimeout(() => setSection3InView(true), 400);
  }, []);
  
  // 网络图区域的滚动检测
  const [networkRef, networkInView] = useInView();
  
  // 检测是否为移动端（仅在客户端）
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="relative min-h-screen">
      {/* 背景图片 */}
      <div className="fixed inset-0 z-0">
        {/* 背景图 - WechatIMG153.jpg */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: bgImageLoaded && !bgImageError ? 'url(/highresolution/WechatIMG153.jpg)' : 'none',
            backgroundColor: bgImageError ? '#1a1a1a' : 'transparent',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: bgImageLoaded ? 1 : 0,
            transition: 'opacity 1.2s ease-in-out',
            willChange: 'opacity',
          }}
        ></div>
        
        {/* 背景遮罩层，确保文字可读性 */}
        <div 
          className="absolute inset-0 bg-black/40"
          style={{
            opacity: bgImageLoaded ? 1 : 0,
            transition: 'opacity 1.2s ease-in-out',
          }}
        ></div>
      </div>

      {/* 内容区域 */}
      <div className="relative z-10 pt-32 pb-32" style={{ fontSize: '0.9em' }}>
        <div className="container max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 lg:px-[80px]">
          <div className="max-w-[1287px] mx-auto space-y-16 md:space-y-24">
            
            {/* 第一部分：无界定义物流 */}
            <div 
              className="max-w-4xl mx-auto text-center"
              style={{
                opacity: section1InView ? 1 : 0,
                transform: section1InView ? 'translateY(0)' : 'translateY(30px)',
                transition: 'opacity 0.8s ease-out, transform 0.8s ease-out'
              }}
            >
              <h2 className="text-1xl md:text-2xl lg:text-3xl font-bold text-brand-accent mb-6 leading-tight">
                {currentLocale === 'zh' ? '无界定义物流' : 'Boundless Defines Logistics'}
              </h2>
              <p className="text-sm md:text-xl text-white/90 leading-relaxed">
                {currentLocale === 'zh' 
                  ? 'Wintex国际重型工程物流集团，以"无界创新"理念，重构供应链逻辑，开创性实施"中国港口-菲律宾近海"全程不换载的平板驳船直达运输方案，攻克了超限件跨国、端到端运输的行业难题。'
                  : 'We have redefned supply chain logic by pioneering a "China Port to Philippines Offshore" direct fat barge transport solution, eliminating cargo reloading. This breakthrough overcomes the longstanding industry challenge of cross-border, end-to-end transportation for oversized cargo.'}
              </p>
            </div>

            {/* 第二部分：创新由此启幕 */}
            <div 
              className="max-w-4xl mx-auto text-center"
              style={{
                opacity: section2InView ? 1 : 0,
                transform: section2InView ? 'translateY(0)' : 'translateY(30px)',
                transition: 'opacity 0.8s ease-out, transform 0.8s ease-out'
              }}
            >
              <h2 className="text-1xl md:text-2xl lg:text-3xl font-bold text-brand-accent mb-6 leading-tight">
                {currentLocale === 'zh' ? '创新由此启幕' : 'Where Innovation Begins'}
              </h2>
              <p className="text-sm md:text-xl text-white/90 leading-relaxed">
                {currentLocale === 'zh' 
                  ? '我们专注于大型工程项目的出海落地，提供量身定制的海、陆、空物流解决方案，灵活应对客户的动态需求，确保您的货物安全、准时、高效送达。'
                  :"Wintex Logistics specializes in the global execution of large-scale engineering projects, delivering tailored multimodal solutions by sea, land, and air. We respond with agility to clients' evolving needs, ensuring your cargo arrives safely, on schedule, and with maximum efficiency."}
              </p>
            </div>

            {/* 第三部分：我们的愿景 */}
            <div 
              className="max-w-4xl mx-auto text-center"
              style={{
                opacity: section3InView ? 1 : 0,
                transform: section3InView ? 'translateY(0)' : 'translateY(30px)',
                transition: 'opacity 0.8s ease-out, transform 0.8s ease-out'
              }}
            >
              <h2 className="text-1xl md:text-2xl lg:text-3xl font-bold text-brand-accent mb-6 leading-tight">
                {currentLocale === 'zh' ? '我们的愿景' : 'Our Mission'}
              </h2>
              <div className="space-y-6">
                <p className="text-sm md:text-xl text-white/90 leading-relaxed">
                  {currentLocale === 'zh' 
                    ? '助力客户成功跨海越洋，将客户的重型设备、装备运往世界各个角落。'
                    : 'Wintex Logistics envisions empowering clients to conquer oceans and continents by delivering their heavy equipment and machinery to every corner of the world.'}
                </p>
                <p className="text-sm md:text-xl text-white/90 leading-relaxed">
                  {currentLocale === 'zh' 
                    ? '我们致力于卓越、可持续发展，为员工、客户和合作伙伴创造无可比拟的价值。通过坚持创新、促进协作并秉持最高标准的诚信，我们努力在物流行业树立新的标杆。'
                    : 'We are committed to excellent and sustainable development, creating unparalleled value for our employees, clients, and partners. Through relentless innovation, collaborative partnerships, and uncompromising integrity, we strive to set new benchmarks in the logistics industry.'}
                </p>
              </div>
              
              {/* 向下箭头指引 - 三个依序向下 */}
              <div 
                className="flex flex-col justify-center items-center mt-16 gap-2"
                style={{
                  opacity: section3InView ? 1 : 0,
                  transform: section3InView ? 'translateY(0)' : 'translateY(30px)',
                  transition: 'opacity 0.8s ease-out 0.6s, transform 0.8s ease-out 0.6s',
                  marginBottom: '-4rem'
                }}
              >
                {/* 第一个箭头 */}
                <svg 
                  className="w-12 h-12 md:w-24 md:h-24"
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="#F7B959" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  style={{ 
                    animation: 'blink 1.5s ease-in-out infinite',
                    animationDelay: '0s'
                  }}
                >
                  <path d="M6 9l6 6 6-6"/>
                </svg>
                {/* 第二个箭头 */}
                <svg 
                  className="w-12 h-12 md:w-24 md:h-24"
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="#F7B959" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  style={{ 
                    animation: 'blink 1.5s ease-in-out infinite',
                    animationDelay: '0.3s',
                    opacity: 0.8
                  }}
                >
                  <path d="M6 9l6 6 6-6"/>
                </svg>
                {/* 第三个箭头 */}
                <svg 
                  className="w-12 h-12 md:w-24 md:h-24"
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="#F7B959" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  style={{ 
                    animation: 'blink 1.5s ease-in-out infinite',
                    animationDelay: '0.6s',
                    opacity: 0.6
                  }}
                >
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </div>
            </div>

            {/* 网络图布局区域 - 滚动时显示 */}
            <div 
              ref={networkRef as any}
              className="relative w-full h-screen min-h-[800px] flex items-center justify-center"
              style={{
                opacity: networkInView ? 1 : 0,
                transform: networkInView ? 'scale(1)' : 'scale(0.95)',
                transition: networkInView ? 'opacity 1s ease-out, transform 1s ease-out' : 'none'
              }}
            >
              {/* SVG 连接线 */}
              <svg 
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{
                  opacity: networkInView ? 1 : 0,
                  transition: networkInView ? 'opacity 1.5s ease-out 0.5s' : 'none'
                }}
              >
                {/* 从中心到各个节点的连接线 - 水平连线 */}
                <line 
                  x1="50%" 
                  y1={isMobile ? "43%" : "40%"}
                  x2="15%" 
                  y2={isMobile ? "43%" : "40%"}
                  stroke="rgba(247, 185, 89, 0.6)" 
                  strokeWidth="2"
                  strokeDasharray={networkInView ? "0" : "10,5"}
                  style={{
                    transition: networkInView ? 'stroke-dasharray 1s ease-out 1s' : 'none'
                  }}
                />
                <line 
                  x1="50%" 
                  y1={isMobile ? "43%" : "40%"}
                  x2="85%" 
                  y2={isMobile ? "43%" : "40%"}
                  stroke="rgba(247, 185, 89, 0.6)" 
                  strokeWidth="2"
                  strokeDasharray={networkInView ? "0" : "10,5"}
                  style={{
                    transition: 'stroke-dasharray 1s ease-out 1.2s'
                  }}
                />
                <line 
                  x1="50%" 
                  y1={isMobile ? "57%" : "60%"}
                  x2="15%" 
                  y2={isMobile ? "57%" : "60%"}
                  stroke="rgba(247, 185, 89, 0.6)" 
                  strokeWidth="2"
                  strokeDasharray={networkInView ? "0" : "10,5"}
                  style={{
                    transition: 'stroke-dasharray 1s ease-out 1.4s'
                  }}
                />
                <line 
                  x1="50%" 
                  y1={isMobile ? "57%" : "60%"}
                  x2="85%" 
                  y2={isMobile ? "57%" : "60%"}
                  stroke="rgba(247, 185, 89, 0.6)" 
                  strokeWidth="2"
                  strokeDasharray={networkInView ? "0" : "10,5"}
                  style={{
                    transition: 'stroke-dasharray 1s ease-out 1.6s'
                  }}
                />
                {/* 从中心到底部长条文本框的连接线 */}
                <line 
                  x1="50%" 
                  y1="50%" 
                  x2="50%" 
                  y2={isMobile ? "72%" : "85%"}
                  stroke="rgba(247, 185, 89, 0.6)" 
                  strokeWidth="2"
                  strokeDasharray={networkInView ? "0" : "10,5"}
                  style={{
                    transition: 'stroke-dasharray 1s ease-out 2s'
                  }}
                />
                
                {/* 连接线上的金色菱形节点 */}
                {[
                  { x: 32.5, y: isMobile ? 43 : 40 }, // 左侧上连接线中点
                  { x: 67.5, y: isMobile ? 43 : 40 }, // 右侧上连接线中点
                  { x: 32.5, y: isMobile ? 57 : 60 }, // 左侧下连接线中点
                  { x: 67.5, y: isMobile ? 57 : 60 }, // 右侧下连接线中点
                  { x: 50, y: isMobile ? 61 : 67.5 }, // 中心到底部长条文本框的连接线上的节点
                ].map((point, i) => {
                  const scale = networkInView ? 1 : 0;
                  return (
                    <g 
                      key={i}
                      transform={`translate(${point.x}%, ${point.y}%) scale(${scale})`}
                    style={{
                      opacity: networkInView ? 1 : 0,
                      transition: networkInView ? `opacity 0.5s ease-out ${1.8 + i * 0.2}s, transform 0.5s ease-out ${1.8 + i * 0.2}s` : 'none'
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

              {/* 中央圆形元素 */}
              <div 
                className="relative z-20 flex items-center justify-center"
                style={{
                  opacity: networkInView ? 1 : 0,
                  transform: networkInView ? 'scale(1)' : 'scale(0)',
                  transition: networkInView ? 'opacity 0.8s ease-out 0.8s, transform 0.8s ease-out 0.8s' : 'none'
                }}
              >
                {/* 外层灰色圆形 - 无边框，直径更大 */}
                <div className="absolute w-32 h-32 md:w-80 md:h-80 rounded-full bg-gray-400"></div>
                
                {/* 内层橘黄色圆形 - 有边框 */}
                <div className="relative w-24 h-24 md:w-64 md:h-64 rounded-full bg-white border-2 border-brand-accent flex flex-col items-center justify-center overflow-hidden">
                  <img
                    src="/logo.png"
                    alt="Wintex Logo"
                    className="object-contain"
                    style={{
                      width: '60%',
                      height: '60%',
                    }}
                  />
                </div>
              </div>

              {/* 周围的矩形框节点 - 支持文字的文本框 */}
              {[
                { 
                  position: 'left-top', 
                  x: '15%', 
                  y: '40%',
                  yMobile: '43%',
                  // title: currentLocale === 'zh' ? '海运' : 'Sea Transport',
                  description: currentLocale === 'zh' 
                    ? 'Wintex国际重型工程物流集团负责阿拉巴特和塔奈风力发电项目的所有物流和清关操作'
                    : 'Wintex Logistics Corporation is responsible for all logistics and customs clearance operations for both the Alabat and Tanay wind power projects',
                  delay: 1.2
                },
                { 
                  position: 'right-top', 
                  x: '85%', 
                  y: '40%',
                  yMobile: '43%',
                  // title: currentLocale === 'zh' ? '陆运' : 'Land Transport',
                  description: currentLocale === 'zh' 
                    ? '风力发电机部件的内陆和港口装卸'
                    : 'Inland and port handling of wind turbine components',
                  delay: 1.4
                },
                { 
                  position: 'left-bottom', 
                  x: '15%', 
                  y: '60%',
                  yMobile: '57%',
                  // title: currentLocale === 'zh' ? '空运' : 'Air Transport',
                  description: currentLocale === 'zh' 
                    ? '专用码头、路线改造、大件运输所需要的各种许可和准证'
                    : 'Various permits and approvals required for dedicated jetty, route modifications, and oversized transport.',
                  delay: 1.6
                },
                { 
                  position: 'right-bottom', 
                  x: '85%', 
                  y: '60%',
                  yMobile: '57%',
                  // title: currentLocale === 'zh' ? '仓储' : 'Warehousing',
                  description: currentLocale === 'zh' 
                    ? '超大件和重型货物管理'
                    : 'Oversized and heavy-lift cargo management',
                  delay: 1.8
                },
              ].map((node, i) => (
                <div
                  key={i}
                  className="absolute rounded-2xl bg-white/10 backdrop-blur-md border-2 border-brand-accent/70 p-1.5 md:p-5 w-[110px] md:w-[280px] min-h-[50px] md:min-h-[105px] flex flex-col justify-center text-center shadow-lg"
                  style={{
                    left: node.x,
                    top: isMobile && node.yMobile ? node.yMobile : node.y,
                    opacity: networkInView ? 1 : 0,
                    transform: networkInView ? 'translate(-50%, -50%) scale(1)' : 'translate(-50%, -50%) scale(0)',
                    transition: networkInView ? `opacity 0.6s ease-out ${node.delay}s, transform 0.6s ease-out ${node.delay}s` : 'none'
                  }}
                >
                  {/* <div className="text-lg font-bold text-brand-accent mb-3">{node.title}</div> */}
                  <div className="text-[8px] md:text-xs text-white/80 leading-tight md:leading-relaxed">
                    <div className="flex items-start justify-center gap-0.5 md:gap-2">
                      <svg width="6" height="6" viewBox="0 0 12 12" className="flex-shrink-0 mt-0.5 md:mt-1" style={{ width: '6px', height: '6px' }}>
                        <polygon
                          points="6,0 12,6 6,12 0,6"
                          fill="#F7B959"
                          stroke="rgba(247, 185, 89, 0.8)"
                          strokeWidth="0.5"
                        />
                      </svg>
                      <span className="text-center">{i + 1}. {node.description}</span>
                    </div>
                  </div>
                </div>
              ))}

              {/* 第5个文本框 - 底部中央长条文本框 */}
              <div
                className="absolute rounded-xl bg-white/10 backdrop-blur-md border-2 border-brand-accent/70 p-1.5 md:p-6 w-[55%] max-w-[110px] md:w-[90%] md:max-w-[260px] text-center shadow-lg"
                style={{
                  left: '50%',
                  top: isMobile ? '72%' : '85%',
                  opacity: networkInView ? 1 : 0,
                  transform: networkInView ? 'translate(-50%, -50%) scale(1)' : 'translate(-50%, -50%) scale(0)',
                  transition: networkInView ? `opacity 0.6s ease-out 2.2s, transform 0.6s ease-out 2.2s` : 'none'
                }}
              >
                {/* <div className="text-lg md:text-xl font-bold text-brand-accent mb-3">
                  {currentLocale === 'zh' ? '综合物流解决方案' : 'Comprehensive Logistics Solutions'}
                </div> */}
                <div className="text-[8px] md:text-xs text-white/80 leading-tight md:leading-relaxed">
                  <div className="flex items-start justify-center gap-0.5 md:gap-2">
                    <svg width="6" height="6" viewBox="0 0 12 12" className="flex-shrink-0 mt-0.5 md:mt-1" style={{ width: '6px', height: '6px' }}>
                      <polygon
                        points="6,0 12,6 6,12 0,6"
                        fill="#F7B959"
                        stroke="rgba(247, 185, 89, 0.8)"
                        strokeWidth="0.5"
                      />
                    </svg>
                    <span className="text-center">5. {currentLocale === 'zh' 
                      ? '项目现场的最后一公里交付'
                      : 'Last-mile delivery to project sites'}</span>
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

