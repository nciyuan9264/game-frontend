import type { CSSProperties } from 'react';
import type { Side } from '../../model/types';
import styles from './index.module.less';

export function BrandMark({
  size = 30,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  return <span
    className={`${styles.brandMark} ${className}`}
    style={{ '--mark-size': `${size}px` } as CSSProperties}
    aria-hidden="true"
  ><i /><i /></span>;
}

export function Brand({ small = false }: { small?: boolean }) {
  return <span className={`${styles.brand} ${small ? styles.small : ''}`}>
    <BrandMark size={small ? 24 : 29} />
    <span><strong>YINSH</strong><small>圈 套 棋</small></span>
  </span>;
}

export function RingIcon({
  side = 'white',
  filled = true,
  className = '',
}: {
  side?: Side;
  filled?: boolean;
  className?: string;
}) {
  return <span
    className={`${styles.ring} ${styles[side]} ${filled ? '' : styles.empty} ${className}`}
    aria-hidden="true"
  />;
}

export function MarkerToken({
  side,
  className = '',
}: {
  side: Side;
  className?: string;
}) {
  return <span
    className={`${styles.marker} ${styles[side]} ${className}`}
    aria-hidden="true"
  />;
}

export function RingStillLife() {
  return <svg
    viewBox="0 0 620 350"
    className={styles.stillLife}
    aria-label="黑白圆环与几何棋盘"
  >
    <defs>
      <linearGradient id="yinshWhiteSculpture" x2=".6" y2="1">
        <stop stopColor="#fffdf4" />
        <stop offset=".45" stopColor="#eee5d4" />
        <stop offset="1" stopColor="#a69884" />
      </linearGradient>
      <linearGradient id="yinshBlackSculpture" x2=".7" y2="1">
        <stop stopColor="#766961" />
        <stop offset=".4" stopColor="#42383a" />
        <stop offset="1" stopColor="#272127" />
      </linearGradient>
      <filter id="yinshSculptureShadow">
        <feDropShadow dx="0" dy="20" stdDeviation="13" floodOpacity=".14" floodColor="#573b34" />
      </filter>
    </defs>
    <g transform="translate(290,265) scale(1,.46) rotate(30)" stroke="#8f7b621d" strokeWidth="1">
      {Array.from({ length: 15 }, (_, index) => <g key={index}>
        <line x1={-340} y1={index * 38 - 260} x2={340} y2={index * 38 - 260} />
        <line x1={index * 38 - 260} y1={-300} x2={index * 38 - 260} y2={300} />
      </g>)}
    </g>
    <g filter="url(#yinshSculptureShadow)">
      <ellipse cx="275" cy="214" rx="115" ry="70" fill="none" stroke="#8f826e" strokeWidth="45" />
      <ellipse cx="275" cy="204" rx="115" ry="70" fill="none" stroke="url(#yinshWhiteSculpture)" strokeWidth="44" />
      <ellipse cx="428" cy="176" rx="94" ry="56" fill="none" stroke="#211e21" strokeWidth="37" transform="rotate(-24 428 176)" />
      <ellipse cx="428" cy="167" rx="94" ry="56" fill="none" stroke="url(#yinshBlackSculpture)" strokeWidth="37" transform="rotate(-24 428 167)" />
    </g>
    <ellipse cx="151" cy="274" rx="28" ry="17" fill="url(#yinshBlackSculpture)" />
    <ellipse cx="472" cy="273" rx="26" ry="15" fill="url(#yinshWhiteSculpture)" />
    <path d="M82 149h35m-18-18v36" stroke="#b2956f" strokeWidth="1" />
    <circle cx="548" cy="80" r="16" fill="none" stroke="#bca482" strokeDasharray="2 4" />
  </svg>;
}
