import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

const FIT_TOLERANCE = 2;
const ESTIMATED_LEVEL_SAVINGS = [0, 32, 92, 128];

function safeRequestAnimationFrame(callback: FrameRequestCallback) {
  if (typeof window.requestAnimationFrame === 'function') return window.requestAnimationFrame(callback);
  return window.setTimeout(() => callback(performance.now()), 16);
}

function safeCancelAnimationFrame(id: number) {
  if (typeof window.cancelAnimationFrame === 'function') window.cancelAnimationFrame(id);
  else window.clearTimeout(id);
}

function fitLevelForOverflow(overflow: number) {
  if (overflow <= 0) return 0;
  if (overflow <= ESTIMATED_LEVEL_SAVINGS[1]) return 1;
  if (overflow <= ESTIMATED_LEVEL_SAVINGS[2]) return 2;
  return 3;
}

export function useMobilePlayFit(enabled: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [fitLevel, setFitLevel] = useState(0);
  const fitLevelRef = useRef(0);
  const frameRef = useRef<number>();

  const cancelMeasure = useCallback(() => {
    if (frameRef.current == null) return;
    safeCancelAnimationFrame(frameRef.current);
    frameRef.current = undefined;
  }, []);

  const measure = useCallback(() => {
    const node = containerRef.current;
    if (!enabled || !node) return;
    const { bottom } = node.getBoundingClientRect();
    const baseBottom = bottom + ESTIMATED_LEVEL_SAVINGS[fitLevelRef.current];
    const overflow = baseBottom - (window.innerHeight - FIT_TOLERANCE);
    const nextLevel = fitLevelForOverflow(overflow);
    if (nextLevel === fitLevelRef.current) return;
    fitLevelRef.current = nextLevel;
    setFitLevel(nextLevel);
  }, [enabled]);

  const scheduleMeasure = useCallback(() => {
    if (!enabled) return;
    cancelMeasure();
    frameRef.current = safeRequestAnimationFrame(() => {
      frameRef.current = undefined;
      measure();
    });
  }, [cancelMeasure, enabled, measure]);

  useLayoutEffect(() => {
    if (enabled) {
      measure();
      return;
    }
    cancelMeasure();
    fitLevelRef.current = 0;
    setFitLevel(0);
  }, [cancelMeasure, enabled, measure]);

  useEffect(() => {
    if (!enabled) return undefined;
    const handleViewportChange = () => scheduleMeasure();
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('orientationchange', handleViewportChange);
    return () => {
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('orientationchange', handleViewportChange);
    };
  }, [enabled, scheduleMeasure]);

  useEffect(() => () => cancelMeasure(), [cancelMeasure]);

  return { containerRef, fitLevel };
}
