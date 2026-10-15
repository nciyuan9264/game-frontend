import { useEffect, useRef, useState } from 'react';
import styles from './index.module.less';

interface Props {
  value: number;
  duration?: number;
  formatter?: (value: number) => string;
  className?: string;
}

const easeOutCubic = (progress: number) => 1 - (1 - progress) ** 3;

export function AnimatedValue({ value, duration = 360, formatter, className = '' }: Props) {
  const [displayValue, setDisplayValue] = useState(value);
  const [direction, setDirection] = useState<'up' | 'down'>();
  const displayed = useRef(value);
  const previous = useRef(value);

  useEffect(() => {
    if (value === previous.current) return;
    const start = displayed.current;
    const change = value - start;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    previous.current = value;
    setDirection(change > 0 ? 'up' : 'down');

    if (reducedMotion) {
      displayed.current = value;
      setDisplayValue(value);
      const timer = window.setTimeout(() => setDirection(undefined), 240);
      return () => window.clearTimeout(timer);
    }

    const startedAt = performance.now();
    let frame = 0;
    const animate = (time: number) => {
      const progress = Math.min(Math.max((time - startedAt) / duration, 0), 1);
      const next = Math.round(start + change * easeOutCubic(progress));
      displayed.current = next;
      setDisplayValue(next);
      if (progress < 1) frame = requestAnimationFrame(animate);
      else frame = window.setTimeout(() => setDirection(undefined), 180);
    };
    frame = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(frame);
    };
  }, [duration, value]);

  return <span className={`${styles.value} ${direction ? styles[direction] : ''} ${className}`}>
    {formatter ? formatter(displayValue) : displayValue.toLocaleString('en-US')}
  </span>;
}
