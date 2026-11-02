import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { warmResultCardFonts } from './useResultCardShare';

export function ResultShareFontWarmup() {
  const location = useLocation();
  const probeRef = useRef<HTMLDivElement>(null);
  const matchPage = location.pathname.endsWith('/match');

  useEffect(() => {
    if (!matchPage || !probeRef.current) return;
    void warmResultCardFonts(probeRef.current).catch(() => undefined);
  }, [matchPage]);

  if (!matchPage) return null;
  return <div
    ref={probeRef}
    aria-hidden="true"
    style={{
      position: 'fixed',
      top: 0,
      left: -10000,
      width: 1,
      height: 1,
      overflow: 'hidden',
      pointerEvents: 'none',
    }}
  >
    <span style={{ fontFamily: "'DM Sans Variable'" }}>GAMEBUS FINAL RESULT</span>
    <span style={{ fontFamily: "'Noto Sans SC Variable'" }}>玩家战绩最终排名</span>
    <span style={{ fontFamily: "'Noto Serif SC Variable'" }}>荣耀胜利再来一局</span>
  </div>;
}
