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
      { threshold: 0.1, ...options }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  return [ref, isInView] as const;
}

export default function MissionPage({params:{locale}}:{params:{locale:string}}) {
  const currentLocale = (locale as Locale) ?? 'zh';
  const t = useTranslations('home');

  // 页面标题在页面加载时立即显示动画
  const [titleInView, setTitleInView] = useState(false);
  
  // 页面加载时立即触发标题的动画
  useEffect(() => {
    setTitleInView(true);
  }, []);

  // 时间轴项目的滚动检测
  const [timelineRef, timelineInView] = useInView();
  
  // 新布局部分的滚动检测
  const [newSectionRef, newSectionInView] = useInView();

  // 时间轴数据
  const timelineItems = [
    {
      year: '2023',
      projectName: currentLocale === 'zh' 
        ? '良安水电站——北拉瑙省'
        : 'Liangan Hydroelectric Power Plant - Lanao Del Norte',
      description: currentLocale === 'zh'
        ? '发电机、变压器及输电线路材料的物流运输'
        : 'Logistics transport of generators, transformers, and transmission line materials',
    },
    {
      year: '2024',
      projectName: currentLocale === 'zh'
        ? '拉布拉多太阳能电站——邦阿西南省'
        : 'Labrador Solar Power Plant - Pangasinan',
      description: currentLocale === 'zh'
        ? '光伏组件及太阳能电站材料的物流运输'
        : 'Logistics transport of photovoltaic modules and solar power plant material',
    },
    {
      year: '2025',
      projects: [
        {
          projectName: currentLocale === 'zh'
            ? '塔奈风电项目——奎松省'
            : 'Tanay Wind Power Project - Quezon',
          description: currentLocale === 'zh'
            ? '风力发电机组部件的物流运输及特种货物操作'
            : "Full-process logistics for the Philippines'first 8MW wind turbine generator, transporting its oversized components along 90 km of mountainous roads with sharp turns and steady gradients",
        },
        {
          projectName: currentLocale === 'zh'
            ? '阿拉巴特风电项目——奎松省'
            : 'Alabat Wind Power Project - Quezon',
          description: currentLocale === 'zh'
            ? '风力发电机组部件的重大件、超限物流运输'
            : 'Full-process logistics transportation and special cargo operations for the components of the Philippines\' first BMW standalone wind turbine generator',
        },
      ],
    },
  ];

  return (
    <div className="relative min-h-screen bg-white" style={{ fontSize: '0.9em' }}>
      {/* 内容区域 */}
      <div className="relative z-10 pt-32 pb-32">
        <div className="container max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 lg:px-[80px]">
          {/* 页面标题 */}
          <div 
            className="text-left mb-16"
            style={{
              opacity: titleInView ? 1 : 0,
              transform: titleInView ? 'translateY(0)' : 'translateY(20px)',
              transition: 'opacity 0.6s ease-out, transform 0.6s ease-out'
            }}
          >
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-brand-primary mb-2">
              {currentLocale === 'zh' ? '全过程风电物流' : 'Full-process Wind Power Logistics'}
            </h1>
            <h2 className="text-lg md:text-xl lg:text-2xl text-gray-600">
              {currentLocale === 'zh' ? '清洁能源项目的成功实践（2023-2025）' : 'Successful Practice of Clean Energy Projects (2023-2025)'}
            </h2>
          </div>

          {/* 纵向时间轴 */}
          <div 
            ref={timelineRef as any}
            className="relative max-w-4xl mx-auto"
            style={{
              opacity: timelineInView ? 1 : 0,
              transform: timelineInView ? 'translateY(0)' : 'translateY(30px)',
              transition: 'opacity 0.8s ease-out, transform 0.8s ease-out'
            }}
          >
            {/* 时间轴竖线 */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-400"></div>

            {timelineItems.map((item, index) => (
              <div key={index} className="relative mb-12 last:mb-0">
                {/* 时间节点圆圈 */}
                <div className="absolute left-8 w-4 h-4 rounded-full bg-brand-accent transform -translate-x-1/2 z-10"></div>

                {/* 年份文本框 */}
                <div className="ml-20 mb-4">
                  <div className="bg-gray-400 rounded-lg px-6 py-3 inline-block">
                    <div className="text-2xl md:text-3xl font-bold text-brand-accent">
                      {item.year}
                    </div>
                  </div>
                </div>

                {/* 项目信息文本框 */}
                {item.projects ? (
                  // 2025年有两个项目，在同一个文本框内
                  <div
                    className="ml-20 bg-gray-400 rounded-lg p-6 space-y-6"
                    style={{
                      opacity: timelineInView ? 1 : 0,
                      transform: timelineInView ? 'translateX(0)' : 'translateX(-20px)',
                      transition: `opacity 0.6s ease-out ${0.3 + index * 0.2}s, transform 0.6s ease-out ${0.3 + index * 0.2}s`
                    }}
                  >
                    {item.projects.map((project, pIndex) => (
                      <div key={pIndex} className={pIndex > 0 ? 'pt-6' : ''}>
                        <h3 className="text-lg md:text-xl font-bold text-brand-accent mb-3">
                          {project.projectName}
                        </h3>
                        <p className="text-sm md:text-base text-white leading-relaxed">
                          {project.description}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  // 2023和2024年只有一个项目
                  <div
                    className="ml-20 bg-gray-400 rounded-lg p-6"
                    style={{
                      opacity: timelineInView ? 1 : 0,
                      transform: timelineInView ? 'translateX(0)' : 'translateX(-20px)',
                      transition: `opacity 0.6s ease-out ${0.3 + index * 0.2}s, transform 0.6s ease-out ${0.3 + index * 0.2}s`
                    }}
                  >
                    <h3 className="text-lg md:text-xl font-bold text-brand-accent mb-3">
                      {item.projectName}
                    </h3>
                    <p className="text-sm md:text-base text-white leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                )}
              </div>
            ))}

            {/* 底部聚焦文字 */}
            <div className="mt-12 text-center">
              <p className="text-lg md:text-xl text-gray-600 font-bold">
                {currentLocale === 'zh' ? '聚焦：阿拉巴特与塔奈' : 'Focus: Alabat and Tanay'}
              </p>
            </div>
          </div>

          {/* 新布局部分 */}
          <div 
            ref={newSectionRef as any}
            className="max-w-6xl mx-auto mt-20"
            style={{
              opacity: newSectionInView ? 1 : 0,
              transform: newSectionInView ? 'translateY(0)' : 'translateY(30px)',
              transition: 'opacity 0.8s ease-out, transform 0.8s ease-out'
            }}
          >
            {/* 文本框 */}
            <div className="mb-12">
              <div className="rounded-lg p-6 md:p-8">
                <p className="text-base md:text-lg text-gray-700 leading-relaxed" style={{ fontSize: '1.5em' }}>
                  {currentLocale === 'zh' 
                    ? '项目由Alternergy牵头，BOP合同方为中国能建集团的子公司GEDI，负责两个场址的设计、工程、土建和电气施工、设备运输、安装及调试工作。'
                    : 'The Alabat (Quezon) and Tanay (Quezon) Wind Power Projects are led by Alternergy and BOP contracted to GEDI, a subsidiary of China Energy Engineering Group, covering the design, engineering, civil and electrical works, equipment transport, installation, and commissioning for both sites.'}
                </p>
              </div>
            </div>

            {/* 一行两列的蓝色背景块 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 左侧：阿拉巴特项目 */}
              <div>
                <div 
                  className="rounded-lg overflow-hidden mb-4 w-full"
                  style={{ backgroundColor: '#156082' }}
                >
                  <div className="p-2">
                    <div className="flex items-center justify-center rounded-lg">
                      <img
                        src="/highresolution/WechatIMG241.jpeg"
                        alt={currentLocale === 'zh' ? '阿拉巴特风力发电项目' : 'Alabat Wind Power Project'}
                        className="max-w-full max-h-[320px] md:max-h-[400px] w-auto h-auto object-contain"
                      />
                    </div>
                  </div>
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-black mb-2 text-center">
                  {currentLocale === 'zh' ? '阿拉巴特风力发电项目8X8MW' : 'Alabat Wind Power Project 8X8MW'}
                </h3>
                <p className="text-sm md:text-base text-gray-400 leading-relaxed text-center">
                  {currentLocale === 'zh' 
                    ? '风力发电机组部件的重大件、超限物流运输，确保准时且安全交付'
                    : 'Oversized/heavy-lift logistics transport for wind turbine components, ensuring timely and secure delivery'}
                </p>
              </div>

              {/* 右侧：塔奈项目 */}
              <div>
                <div 
                  className="rounded-lg overflow-hidden mb-4 w-full"
                  style={{ backgroundColor: '#156082' }}
                >
                  <div className="p-2">
                    <div className="flex items-center justify-center rounded-lg">
                      <img
                        src="/highresolution/WechatIMG254.jpg"
                        alt={currentLocale === 'zh' ? '塔奈风力发电项目' : 'Tanay Wind Power Project'}
                        className="max-w-full max-h-[320px] md:max-h-[400px] w-auto h-auto object-contain"
                      />
                    </div>
                  </div>
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-black mb-2 text-center">
                  {currentLocale === 'zh' ? '塔奈风力发电项目16X8MW' : 'Tanay Wind Power Project 16X8MW'}
                </h3>
                <p className="text-sm md:text-base text-gray-400 leading-relaxed text-center">
                  {currentLocale === 'zh' 
                    ? '风力发电机组部件的物流运输及特种货物操作'
                    : 'Logistics transport and specialized cargo handling for wind turbine components'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

