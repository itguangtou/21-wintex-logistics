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

export default function EquipmentPage({params:{locale}}:{params:{locale:string}}) {
  const currentLocale = (locale as Locale) ?? 'zh';
  const t = useTranslations('home');

  // 页面标题和图片网格在页面加载时立即显示动画
  const [titleInView, setTitleInView] = useState(false);
  const [imageGridInView, setImageGridInView] = useState(false);
  
  // 页面加载时立即触发标题和图片网格的动画
  useEffect(() => {
    setTitleInView(true);
    const timer = setTimeout(() => {
      setImageGridInView(true);
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  // 深蓝色背景模块的滚动检测
  const [firstModuleRef, firstModuleInView] = useInView();
  const [secondModuleRef, secondModuleInView] = useInView();

  // 装备清单
  const equipment = [
    {
      id: 1,
      image: '/images/equipment_1.jpg',
      name: currentLocale === 'zh' ? '超级版重载车头' : 'Super Heavy-Duty Prime Mover',
    },
    {
      id: 2,
      image: '/images/equipment_2.jpg',
      name: currentLocale === 'zh' ? '液压模块轴线车' : 'Hydraulic Modular Trailer',
    },
    {
      id: 3,
      image: '/images/equipment_3.jpg',
      name: currentLocale === 'zh' ? '叶片运输扬举车' : 'Blade Lifting Vehicle',
    },
    {
      id: 4,
      image: '/images/equipment_4.jpg',
      name: currentLocale === 'zh' ? '汽车起重机' : 'Truck-mounted Crane',
    },
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
              {t('equipmentListTitle')}
            </h1>
          </div>

          {/* 2x2 网格布局 */}
          <div 
            className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 max-w-6xl mx-auto mb-16"
            style={{
              opacity: imageGridInView ? 1 : 0,
              transform: imageGridInView ? 'translateY(0)' : 'translateY(20px)',
              transition: 'opacity 0.6s ease-out, transform 0.6s ease-out'
            }}
          >
            {equipment.map((item) => (
              <div
                key={item.id}
                className="group"
              >
                {/* 设备名称 - 在图片上方，无背景 */}
                <div className="mb-4 text-center">
                  <h3 className="text-xl md:text-2xl font-bold text-brand-primary">
                    {item.name}
                  </h3>
                </div>
                
                {/* 图片容器 - 带蓝色背景 */}
                <div className="relative">
                  {/* 蓝色背景 - 适配16:9比例 */}
                  <div className="aspect-video bg-equip-blue rounded-lg shadow-lg transform group-hover:scale-105 transition-transform duration-300"></div>
                  
                  {/* 图片 - 与蓝色背景有间隙，绝对定位在蓝色背景上方 */}
                  <div className="absolute inset-0 p-2 flex items-center justify-center">
                    <div className="w-full h-full relative overflow-hidden rounded-lg" style={{ backgroundColor: 'transparent' }}>
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-contain"
                        style={{ filter: 'none', backgroundColor: 'transparent' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 第一个深蓝色背景模块 - 第一行和第二行 */}
          <div 
            ref={firstModuleRef as any}
            className="bg-brand-primary rounded-lg p-8 md:p-12 max-w-6xl mx-auto mb-8"
            style={{
              opacity: firstModuleInView ? 1 : 0,
              transform: firstModuleInView ? 'translateY(0)' : 'translateY(30px)',
              transition: 'opacity 0.8s ease-out, transform 0.8s ease-out'
            }}
          >
            {/* 第一行：3个文本框 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
              {[
                {
                  titleEn: 'Super-Duty Tractor Truck',
                  titleZh: '超级版牵引车',
                  descEn: 'Equipped with an all wheel drive torque converter transmission system, it delivers exceptional off-road traction capabilities, effortlessly handling diverse and challenging terrains. Widely applicable for specialized operations such as wind turbine equipment transport and heavy-duty engineering towing.',
                  descZh: '配备全轮驱动扭矩转换器传动系统，具有卓越的越野牵引能力，轻松应对各种复杂地形。广泛适用于风力发电设备运输和重型工程拖运等专业作业。',
                },
                {
                  titleEn: 'Heavy-Duty Tractor Truck',
                  titleZh: '超强版牵引车',
                  descEn: 'The all-wheel drive tractor truck delivers outstanding off-road navigation and towing capacity, engineered for demanding transport operations across complex terrains—including wind turbine equipment logistics and engineering projects.',
                  descZh: '全轮驱动牵引车具有出色的越野导航和拖运能力，专为复杂地形的苛刻运输作业而设计，包括风力发电设备物流和工程项目。',
                },
                {
                  titleEn: 'Heavy-Duty / High-Capacity Tractor Truck',
                  titleZh: '超强、重版牵引车',
                  descEn: 'Equipped with an all-wheel-drive torque converter transmission system, it delivers exceptional off-road traction capabilities, effortlessly handling diverse and challenging terrains. Widely applicable for specialized operations such as wind turbine equipment transport and heavy-duty engineering towing.',
                  descZh: '配备全轮驱动扭矩转换器传动系统，具有卓越的越野牵引能力，轻松应对各种复杂地形。广泛适用于风力发电设备运输和重型工程拖运等专业作业。',
                },
              ].map((item, index) => (
                <div key={index} className="flex flex-col">
                  {/* 标题 - 在文本框外 */}
                  <h3 className="text-lg md:text-xl font-bold text-brand-accent mb-3">
                    {currentLocale === 'zh' ? item.titleZh : item.titleEn}
                  </h3>
                  {/* 文本框 - 带橙色边框 */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 flex flex-col border-2 border-brand-accent flex-grow">
                    <p className="text-sm md:text-base text-white/90 leading-relaxed">
                      {currentLocale === 'zh' ? item.descZh : item.descEn}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* 第二行：2个文本框 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  titleEn: 'Multi-axle Telescopic Blade Long-Distance Transporter',
                  titleZh: '多轴线伸缩式叶片长途运输车',
                  descEn: 'Specifically designed for transporting extra long wind turbine blades, it is capable of transporting blades with a support point length ≥ 55m. The vehicle body can be adjusted through axle configuration and multi-stage telescopic adjustment based on blade length and weight, designed to meet the transportation requirements of mountainous, hilly, and narrow roads.',
                  descZh: '专为运输超长风力发电叶片而设计，能够运输支撑点长度≥55米的叶片。车辆可根据叶片长度和重量通过轴配置和多级伸缩调整进行调整，满足山区、丘陵和狭窄道路的运输要求。',
                },
                {
                  titleEn: 'Multi-Axle Modular Wind Turbine Blade Lifter',
                  titleZh: '多轴线模块化叶片扬举车',
                  descEn: 'This equipment is a hydraulically controlled transport system specifically designed for mountainous transportation of ultra-long wind turbine blades. Featuring lifting, slewing, and pitch adjustment capabilities, it employs a modular design allowing flexible axle configuration according to road conditions. Capable of transporting blades with mass moments of 500-1200t-m, it enables safe passage through narrow mountain roads with dense obstacles and multiple curves.',
                  descZh: '该设备是专为超长风力发电叶片山区运输而设计的液压控制运输系统。具有升降、回转和俯仰调节功能，采用模块化设计，可根据路况灵活配置轴数。能够运输质量力矩为500-1200t-m的叶片，可在障碍物密集、弯道多的狭窄山区道路上安全通行。',
                },
              ].map((item, index) => (
                <div key={index} className="flex flex-col">
                  {/* 标题 - 在文本框外 */}
                  <h3 className="text-lg md:text-xl font-bold text-brand-accent mb-3">
                    {currentLocale === 'zh' ? item.titleZh : item.titleEn}
                  </h3>
                  {/* 文本框 - 带橙色边框 */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 flex flex-col border-2 border-brand-accent flex-grow">
                    <p className="text-sm md:text-base text-white/90 leading-loose">
                      {currentLocale === 'zh' ? item.descZh : item.descEn}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 第二个深蓝色背景模块 - 第三行和第四行 */}
          <div 
            ref={secondModuleRef as any}
            className="bg-brand-primary rounded-lg p-8 md:p-12 max-w-6xl mx-auto"
            style={{
              opacity: secondModuleInView ? 1 : 0,
              transform: secondModuleInView ? 'translateY(0)' : 'translateY(30px)',
              transition: 'opacity 0.8s ease-out, transform 0.8s ease-out'
            }}
          >
            {/* 第三行和第四行：2x2 网格布局 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
              {[
                {
                  titleEn: 'Multi-Axle Modular Nacelle Transport Trailer',
                  titleZh: '多轴线模块化机舱运输车',
                  descEn: 'Based on the weight of the cabin module and bridge weight restrictions, cabin transport vehicles can be configured with varying axle configurations. Designed specifically for large-scale engineering transport, these self-propelled vehicles feature integrated drive and lifting capabilities. They fulfill long-distance, heavy-load equipment transportation requirements and are widely used in engineering projects across mountainous terrain or complex working conditions.',
                  descZh: '根据机舱的重量和通行桥梁的限重，可组合成不同轴线数量的机舱运输车，专为大型工程运输设计。自带驱动和升降功能，满足长距离、大吨位设备运输需求，广泛应用于山区或复杂工况下的工程运输项目。',
                },
                {
                  titleEn: 'Multi-Axle Modular Hub Transport Trailer',
                  titleZh: '多轴线模块化轮毂运输车',
                  descEn: 'Based on the characteristics of the hub, multi-axle hydraulic transport vehicles can be assembled, specifically designed for transporting large wind turbine hubs. They can adjust the suspension height during loading/unloading or on sloped sections to enhance maneuverability. The multi-axle configuration ensures even axle load distribution, accommodates various hub specifications, and meets long-distance, safe transportation requirements for equipment of varying weight classes.',
                  descZh: '可根据轮毂的特点组装成多轴液压运输车，专为大型风电轮毂运输而设计。可在装卸或坡道路段调节牵引高度，提高通过性；多轴线布局确保轴荷分配均匀，适配多规格轮毂，满足不同重量等级设备的长距离、安全运输需求。',
                },
              ].map((item, index) => (
                <div key={index} className="flex flex-col">
                  {/* 标题 - 在文本框外 */}
                  <h3 className="text-lg md:text-xl font-bold text-brand-accent mb-3">
                    {currentLocale === 'zh' ? item.titleZh : item.titleEn}
                  </h3>
                  {/* 文本框 - 带橙色边框 */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 flex flex-col border-2 border-brand-accent flex-grow">
                    <p className="text-sm md:text-base text-white/90 leading-relaxed">
                      {currentLocale === 'zh' ? item.descZh : item.descEn}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* 第四行：2个文本框 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  titleEn: 'Multi-Axle Modular Tower Transport Trailer',
                  titleZh: '多轴线模块化塔筒运输车',
                  descEn: 'Through the installation of telescopic platforms/frames, these vehicles can transport overweight/oversized tower sections. Equipped with self-propelled functionality, they enhance overall climbing ability and maneuverability. The transport length is flexibly adjustable according to tower segment dimensions. Multi-axle configurations achieve an optimal balance of high payload capacity, reduced ground pressure, and superior terrain adaptability.',
                  descZh: '通过加装抽拉平台、抽拉框架，可运输超重、超高塔筒，具备主动驱动功能，提升整体爬坡能力与转弯性能，可根据塔筒长度灵活调节，多轴线组合实现整车高载重、低载荷、强适应性的完美平衡。',
                },
                {
                  titleEn: 'Low-Bed Auxiliary Transporter',
                  titleZh: '低平板辅助运输车',
                  descEn: 'Primarily used for transporting containers and accessories for wind turbine equipment, this specialized semi-trailer is engineered for heavy-duty machinery and oversized/heavy components. Featuring a low deck height, it offers enhanced ground clearance for improved passability and exceptional load stability. Commonly deployed for transporting wind turbine nacelles, transformers, tracked equipment, and other high center-of-gravity or height-restricted heavy cargo in constrained scenarios.',
                  descZh: '主要为风机设备配套的集装箱和附件的运输使用，是一种专为重型设备、超高超重大件构件运输设计的半挂车，车架离地高度较低，具有较强的通过性与装载稳定性。常用于运输风电机舱、变压器、履带式设备等高重心或限高场景下的重型货物。',
                },
              ].map((item, index) => (
                <div key={index} className="flex flex-col">
                  {/* 标题 - 在文本框外 */}
                  <h3 className="text-lg md:text-xl font-bold text-brand-accent mb-3">
                    {currentLocale === 'zh' ? item.titleZh : item.titleEn}
                  </h3>
                  {/* 文本框 - 带橙色边框 */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 flex flex-col border-2 border-brand-accent flex-grow">
                    <p className="text-sm md:text-base text-white/90 leading-relaxed">
                      {currentLocale === 'zh' ? item.descZh : item.descEn}
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

