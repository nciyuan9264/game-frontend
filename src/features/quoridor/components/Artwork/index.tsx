import { Bot } from 'lucide-react';
import type { Side } from '../../model/types';

export function Pawn({
  side,
  ghost = false,
  className = '',
}: {
  side: Side;
  ghost?: boolean;
  className?: string;
}) {
  return <span
    className={`pawn ${side} ${ghost ? 'ghost' : ''} ${className}`}
    aria-hidden="true"
  >
    <i className="pawn-shadow" />
    <i className="pawn-foot" />
    <i className="pawn-body" />
    <i className="pawn-head" />
  </span>;
}

export function Disc({
  side,
  className = '',
}: {
  side: Side | 'black' | 'white';
  className?: string;
}) {
  return <Pawn
    side={side === 'white' || side === 'north' ? 'north' : 'south'}
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
  return <span
    className={`wall-rack ${side} ${small ? 'small' : ''}`}
    aria-label={`剩余 ${count} 道围墙`}
  >
    {Array.from({ length: 10 }, (_, index) =>
      <i key={index} className={index < count ? 'filled' : 'used'} />)}
  </span>;
}

export function BrandMark({
  size = 34,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  return <span
    className={`brand-maze ${className}`}
    style={{ width: size, height: size }}
    aria-hidden="true"
  ><i /><i /><i /><b /></span>;
}

export function Brand({ small = false }: { small?: boolean }) {
  return <span className={`brand ${small ? 'small' : ''}`}>
    <BrandMark size={small ? 26 : 34} />
    {!small && <span className="brand-word">
      QUORIDOR<small>步 步 为 营</small>
    </span>}
  </span>;
}

export function QuoridorStillLife() {
  return <span className="hero-art" aria-label="经典步步为营开局">
    <span className="hero-orbit" />
    <span className="hero-board-art">
      <span className="hero-grid">
        {Array.from({ length: 81 }, (_, index) => <i key={index} />)}
      </span>
      <span className="hero-south"><Pawn side="south" /></span>
      <span className="hero-north"><Pawn side="north" /></span>
    </span>
    <span className="hero-loose-wall one" />
    <span className="hero-loose-wall two" />
    <span className="hero-pawn"><Pawn side="south" /></span>
    <small className="hero-art-copy">EVERY WALL.<br />A NEW WAY.</small>
    <small className="hero-edition">Q / 03<br /><i />THE ART OF FINDING A WAY</small>
  </span>;
}

export function AIBadge() {
  return <span aria-label="AI 棋手"><Bot size={14} /></span>;
}
