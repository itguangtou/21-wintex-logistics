'use client';

import { useEffect, useState } from 'react';

interface AnimatedNumberProps {
  target: number;
  duration?: number;
  className?: string;
  trigger?: string | number; // 用于触发重新动画
}

export default function AnimatedNumber({ 
  target, 
  duration = 2000,
  className = '',
  trigger 
}: AnimatedNumberProps) {
  const [current, setCurrent] = useState(0);
  const [isFlashing, setIsFlashing] = useState(false);

  useEffect(() => {
    // 重置为0以重新开始动画
    setCurrent(0);
    setIsFlashing(false);
    
    let startTime: number | null = null;
    let animationFrame: number;
    let pauseStartTime: number | null = null;
    // 动态生成突出显示点：5, 10, 15, 20, 以及25之后每5年一个点（直到目标值）
    const highlightPoints: number[] = [];
    for (let i = 5; i <= target; i += 5) {
      highlightPoints.push(i);
    }
    const pauseDuration = 250; // 停留时间（毫秒）
    let lastHighlighted = -1; // 记录上次突出的数字
    let pausedValue = 0; // 暂停时的值

    const animate = (timestamp: number) => {
      // 如果正在暂停，检查暂停时间是否结束
      if (pauseStartTime !== null) {
        if (timestamp - pauseStartTime < pauseDuration) {
          // 继续暂停，保持当前值
          animationFrame = requestAnimationFrame(animate);
          return;
        } else {
          // 暂停结束，继续动画
          pauseStartTime = null;
          setIsFlashing(false);
          // 调整开始时间，补偿暂停的时间
          if (startTime) {
            startTime = timestamp - (timestamp - startTime - pauseDuration);
          }
        }
      }

      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // 使用缓动函数，让动画更自然
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const value = Math.floor(easeOutQuart * target);
      
      // 检查是否到达需要突出的时间点
      if (highlightPoints.includes(value) && value !== lastHighlighted && pauseStartTime === null) {
        lastHighlighted = value;
        pausedValue = value;
        setIsFlashing(true);
        pauseStartTime = timestamp;
        setCurrent(value);
        animationFrame = requestAnimationFrame(animate);
        return;
      }
      
      // 如果正在暂停，使用暂停时的值
      if (pauseStartTime !== null) {
        setCurrent(pausedValue);
      } else {
        setCurrent(value);
      }

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        // 确保最终值精确为目标值
        setCurrent(target);
        setIsFlashing(false);
      }
    };

    // 延迟一小段时间再开始动画，确保重置完成
    const timeoutId = setTimeout(() => {
      animationFrame = requestAnimationFrame(animate);
    }, 50);

    return () => {
      clearTimeout(timeoutId);
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [target, duration, trigger]); // 添加 trigger 到依赖数组

  return (
    <span className={`${className} number-glow ${isFlashing ? 'number-flash' : ''}`}>
      {current}
    </span>
  );
}

