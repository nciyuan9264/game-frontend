import { Bot, Hexagon } from 'lucide-react';
import type { Side } from '../../model/types';

export function Stone({
  side,
  ghost = false,
  className = '',
}: {
  side: Side;
  ghost?: boolean;
  className?: string;
}) {
  return <span
    className={`stone stone-${side} ${ghost ? 'ghost' : ''} ${className}`}
    aria-hidden="true"
  ><i /></span>;
}

export const Pawn = Stone;

export function Disc({
  side,
  className = '',
}: {
  side: Side | 'black' | 'white';
  className?: string;
}) {
  return <Stone
    side={side === 'white' || side === 'teal' ? 'teal' : 'red'}
    className={className}
  />;
}

export function WallRack({
  count,
  side,
  small = false,
}: {
  count: number;
  side: Side;
  small?: boolean;
}) {
  return <span className={`stone-count ${side} ${small ? 'small' : ''}`}>
    {count}
  </span>;
}

export function BrandMark({
  size = 34,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  return <span className={`brand-hex ${className}`} style={{ width: size, height: size }}>
    <Hexagon size={size} /><i />
  </span>;
}

export function Brand({ small = false }: { small?: boolean }) {
  return <span className={`brand ${small ? 'small' : ''}`}>
    <BrandMark size={small ? 26 : 34} />
    {!small && <span className="brand-word">
      HEX<small>两 岸 之 间</small>
    </span>}
  </span>;
}

export function HexStillLife() {
  return <span className="hero-art" aria-label="陶红与湖绿连接两岸的棋盘">
    <span className="hero-orbit" />
    <span className="hex-still-board">
      {Array.from({ length: 49 }, (_, index) =>
        <i key={index} className={
          [3, 10, 17, 24, 31, 38, 45].includes(index)
            ? 'red'
            : [21, 22, 23, 25, 26, 27].includes(index)
              ? 'teal'
              : ''
        } />)}
    </span>
    <small className="hero-art-copy">A QUIET GAME.<br />AN UNBROKEN CONNECTION.</small>
    <small className="hero-edition">H / 01<br /><i />BETWEEN TWO SHORES</small>
  </span>;
}

export function AIBadge() {
  return <span aria-label="AI 棋手"><Bot size={14} /></span>;
}
