import { useEffect, useRef, useState } from 'react';
import styles from './index.module.less';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  bigChangeRatio?: number;   // 比例阈值
  minBase?: number;          // 最小基数保护
  enableFlashOnZero?: boolean;
  enableImpact?: boolean;
  enableColorChange?: boolean;
  formatter?: (n: number) => string;
}

const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  duration = 300,
  enableFlashOnZero = true,
  enableImpact = true,
  enableColorChange = true,
  formatter,
}) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [flash, setFlash] = useState(false);
  const [impact, setImpact] = useState(false);

  // 🔹 逻辑判断用
  const prevValueRef = useRef(value);

  // 🔹 动画起点用
  const animationStartRef = useRef(value);

  const frameRef = useRef<number>();
  const flashTimeoutRef = useRef<NodeJS.Timeout>();
  const impactTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const prev = prevValueRef.current;
    // const diff = value - prev;

    // const changeRatio =
    //   prev === 0 ? 1 : Math.abs(diff) / Math.abs(prev);

    // 🔥 清零闪烁
    if (enableFlashOnZero && value === 0 && prev > 0) {
      setFlash(true);
      clearTimeout(flashTimeoutRef.current);
      flashTimeoutRef.current = setTimeout(() => {
        setFlash(false);
      }, 300);
    }

    // 🔥 比例 impact 动画
    if (
      enableImpact
    ) {
      setImpact(true);
      clearTimeout(impactTimeoutRef.current);
      impactTimeoutRef.current = setTimeout(() => {
        setImpact(false);
      }, 250);
    }

    // 🔥 数值过渡动画
    const start = animationStartRef.current;
    const totalDiff = value - start;
    const startTime = performance.now();

    cancelAnimationFrame(frameRef.current!);

    const animate = (time: number) => {
      const progress = Math.min((time - startTime) / duration, 1);
      const eased = easeOutCubic(progress);

      const next = Math.floor(start + totalDiff * eased);
      setDisplayValue(next);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        animationStartRef.current = value;
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    // 🔹 更新逻辑 prev
    prevValueRef.current = value;

    return () => {
      cancelAnimationFrame(frameRef.current!);
      clearTimeout(flashTimeoutRef.current);
      clearTimeout(impactTimeoutRef.current);
    };
  }, [value, duration]);

  const isUp = value > prevValueRef.current;
  const isDown = value < prevValueRef.current;

  const formatted = formatter
    ? formatter(displayValue)
    : displayValue.toLocaleString();

  return (
    <span
      className={`
        ${flash ? styles['number-flash'] : ''}
      `}
      style={{
        color: enableColorChange ? (isUp ? '#52c41a' : isDown ? '#ff4d4f' : 'inherit') : 'inherit',
        transform: impact ? 'scale(1.15)' : 'scale(1)',
        transition: 'color 0.2s, transform 0.2s',
        display: 'inline-block',
      }}
    >
      {formatted}
    </span>
  );
};

export default AnimatedNumber;

// 🔹 平滑函数
function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}