import type { CSSProperties, ReactNode } from 'react';
import { Diamond } from 'lucide-react';
import atlas from '../../assets/art-atlas.webp';
import type { GemColor } from '../../model/types';
import styles from './index.module.less';

const gemIndex: Record<GemColor, number> = {
  White: 0, Blue: 1, Green: 2, Red: 3, Black: 4, Gold: 5,
};
const gemColors = ['#b7bdc4', '#477ca8', '#477e68', '#ad5263', '#514e60', '#bd9650'];
const gemPaths = [
  'M16 2 29 13 16 30 3 13Z',
  'M16 2 26 8 29 20 16 30 3 20 6 8Z',
  'M9 3H23L29 9V23L23 29H9L3 23V9Z',
  'M16 2 29 10 26 25 16 31 6 25 3 10Z',
  'M16 2 30 27H2Z',
  'M16 2 22 8 30 10 27 19 24 27 16 30 8 27 5 19 2 10 10 8Z',
];

export function Artwork({ index = 0, className = '', style }: {
  index?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const column = index % 4;
  const row = Math.floor(index / 4);
  return <span aria-hidden="true" className={`${styles.artwork} ${className}`} style={style}>
    <svg width="100%" height="100%" viewBox={`${column * 512} ${row * 2048 / 3} 512 ${2048 / 3}`}
      preserveAspectRatio="xMidYMid slice">
      <image href={atlas} width="2048" height="2048" />
    </svg>
  </span>;
}

export function GemIcon({ color, size = 22 }: { color: GemColor; size?: number }) {
  const index = gemIndex[color];
  return <svg aria-hidden="true" className={`${styles.gem} ${styles[`gem${color}`]}`}
    width={size} height={size} viewBox="0 0 32 32">
    <path d={gemPaths[index]} fill={gemColors[index]}
      stroke={color === 'White' ? '#8894a1' : gemColors[index]} strokeWidth="1.3" />
    <path d={color === 'Black' ? 'M16 7 24 24H8Z' : 'M11 8H21L25 14 21 24H11L7 14Z'}
      fill="white" opacity=".27" />
    <path d="M6 12 16 16 26 12M16 16V28M16 16 11 5" fill="none"
      stroke="white" strokeOpacity=".5" strokeWidth="1" />
  </svg>;
}

export function BrandMark({ size = 28 }: { size?: number }) {
  return <span className={styles.brandMark} aria-hidden="true"><Diamond size={size} /><i /></span>;
}

export function Eyebrow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <span className={`${styles.eyebrow} ${className}`}><i />{children}</span>;
}
