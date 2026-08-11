'use client';

import { useEffect, useRef } from 'react';

interface StarMapProps {
  children: React.ReactNode;
}

export default function StarMap({ children }: StarMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 检测是否为移动端（屏幕宽度小于768px）
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    // 移动端减少星星数量，使用27%的密度（比之前的30%再减少10%）
    const densityMultiplier = isMobile ? 0.27 : 1;

    // 创建星星元素 - 大面积点亮多个区域
    // 包括：东南亚、中国东南沿海、北美（美国、加拿大）、南美（厄瓜多尔、秘鲁）
    const stars: HTMLDivElement[] = [];
    
    // 定义区域范围（基于世界地图的百分比坐标）
    // 使用区域范围而不是单点，让星星在整个区域内随机分布
    // 坐标已沿东北方向移动50%
    const regions = [
      { 
        name: 'SoutheastAsia', 
        // 东南亚区域：包括菲律宾、新加坡、马来西亚、印尼等
        xMin: 27.5, xMax: 42.5, // 右侧移动（东），横向范围
        yMin: 42.5, yMax: 57.5, // 上移（北），纵向范围
        count: Math.floor(50 * densityMultiplier), 
        alwaysOn: true 
      },
      { 
        name: 'ChinaCoast', 
        // 中国东南沿海区域：包括广东、福建、浙江、上海等
        xMin: 32.5, xMax: 47.5, // 右侧移动（东），横向范围
        yMin: 27.5, yMax: 42.5, // 上移（北），纵向范围
        count: Math.floor(60 * densityMultiplier), 
        alwaysOn: true 
      },
      { 
        name: 'NorthAmerica', 
        // 北美区域：包括美国、加拿大
        xMin: 65, xMax: 80, // 左侧（西半球），横向范围
        yMin: 15, yMax: 40, // 中北部，纵向范围
        count: Math.floor(50 * densityMultiplier), 
        alwaysOn: true 
      },
      { 
        name: 'SouthAmerica', 
        // 南美区域：包括厄瓜多尔、秘鲁
        xMin: 85, xMax: 90, // 左侧（西半球），横向范围
        yMin: 50, yMax: 75, // 中南部，纵向范围
        count: Math.floor(40 * densityMultiplier), 
        alwaysOn: true 
      },
    ];

    regions.forEach((region) => {
      // 创建常亮的基础星星（大面积覆盖）
      if (region.alwaysOn) {
        const alwaysOnCount = Math.floor(region.count * 0.4);
        for (let i = 0; i < alwaysOnCount; i++) {
          const star = document.createElement('div');
          star.className = 'star';
          
          // 在区域内随机分布
          const x = region.xMin + Math.random() * (region.xMax - region.xMin);
          const y = region.yMin + Math.random() * (region.yMax - region.yMin);
          
          // 移动端星星稍微小一点
          const sizeBase = isMobile ? 2 : 3;
          const size = Math.random() * 2 + sizeBase; // 移动端: 2-4px, 桌面端: 3-5px
          const glowColor = '#F7B959';
          const glowSize = size * (isMobile ? 3 : 4); // 移动端光晕也稍微小一点
          
          star.style.cssText = `
            position: absolute;
            left: ${x}%;
            top: ${y}%;
            width: ${size}px;
            height: ${size}px;
            background: ${glowColor};
            border-radius: 50%;
            opacity: 0.9;
            box-shadow: 0 0 ${glowSize}px ${glowColor}, 0 0 ${glowSize * 1.8}px ${glowColor}, 0 0 ${glowSize * 2.5}px ${glowColor}, 0 0 ${glowSize * 3.5}px rgba(247, 185, 89, 0.5);
            animation: pulse ${2 + Math.random()}s ease-in-out infinite;
            pointer-events: none;
            z-index: 10;
          `;
          
          container.appendChild(star);
          stars.push(star);
        }
      }
      
      // 创建闪烁的星星（大面积随机分布）
      for (let i = 0; i < region.count; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        
        // 在区域内完全随机分布
        const x = region.xMin + Math.random() * (region.xMax - region.xMin);
        const y = region.yMin + Math.random() * (region.yMax - region.yMin);
        
        // 随机大小（移动端稍微小一点）
        const sizeBase = isMobile ? 1.5 : 2.5;
        const size = Math.random() * 2.5 + sizeBase; // 移动端: 1.5-4px, 桌面端: 2.5-5px
        
        // 随机延迟（0-1.5秒），让闪烁更频繁
        const delay = Math.random() * 1.5;
        
        // 随机动画持续时间（1-2.5秒），更快闪烁
        const duration = Math.random() * 1.5 + 1;
        
        // 增强的黄色光晕效果
        const glowColor = '#F7B959'; // 品牌黄色
        const glowSize = size * (isMobile ? 3 : 4); // 移动端光晕稍微小一点
        
        star.style.cssText = `
          position: absolute;
          left: ${x}%;
          top: ${y}%;
          width: ${size}px;
          height: ${size}px;
          background: ${glowColor};
          border-radius: 50%;
          opacity: 0;
          box-shadow: 0 0 ${glowSize}px ${glowColor}, 0 0 ${glowSize * 1.8}px ${glowColor}, 0 0 ${glowSize * 2.5}px ${glowColor}, 0 0 ${glowSize * 3.5}px rgba(247, 185, 89, 0.6);
          animation: twinkle ${duration}s ease-in-out ${delay}s infinite;
          pointer-events: none;
          z-index: 10;
        `;
        
        container.appendChild(star);
        stars.push(star);
      }
    });

    // 添加CSS动画
    const style = document.createElement('style');
    style.textContent = `
      @keyframes twinkle {
        0%, 100% {
          opacity: 0;
          transform: scale(0.2);
        }
        50% {
          opacity: 1;
          transform: scale(1.2);
        }
      }
      @keyframes pulse {
        0%, 100% {
          opacity: 0.8;
          transform: scale(1);
        }
        50% {
          opacity: 1;
          transform: scale(1.1);
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      stars.forEach(star => star.remove());
      style.remove();
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-full">
      {children}
      {/* 星星将动态添加到这里 */}
    </div>
  );
}

