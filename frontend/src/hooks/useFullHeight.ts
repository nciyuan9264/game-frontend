// hooks/useFullHeight.ts
import { useEffect } from 'react';

export function useFullHeight(className: string) {
  useEffect(() => {
    const resize = () => {
      const element = document.querySelector<HTMLElement>(`.${className}`);
      if (element) {
        element.style.height = `${window.innerHeight}px`;
        element.style.maxHeight = `${window.innerHeight}px`;
      }
    };

    resize(); // 初始设置
    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
    };
  }, [className]); // 当 className 改变时重新执行
}
