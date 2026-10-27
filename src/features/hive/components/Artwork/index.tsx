import { Hexagon } from 'lucide-react';
import type { PieceKind, Side } from '../../model/types';
import { PIECE_INFO } from '../../model/board';

export function Bug({
  kind,
  size = 28,
  className = '',
}: {
  kind: PieceKind;
  size?: number;
  className?: string;
}) {
  const shapes = {
    queen: <><path d="M20 13 17 6M28 13l3-7M21 10l3-5 3 5" /><ellipse cx="15" cy="21" rx="7" ry="10" transform="rotate(-32 15 21)" /><ellipse cx="33" cy="21" rx="7" ry="10" transform="rotate(32 33 21)" /><path d="m19 29-6 5m16-5 6 5" /><ellipse cx="24" cy="28" rx="7" ry="12" fill="currentColor" /><path d="M18 25h12m-12 6h12" className="bug-cut" /><circle cx="24" cy="15" r="5" fill="currentColor" /></>,
    ant: <><path d="m20 10-4-6m12 6 4-6m-11 16-9-5-6 2m21 3 9-5 6 2m-22 10-10-1-5 5m22-4 10-1 5 5m-22-2-10 7-2 7m20-14 10 7 2 7" /><circle cx="24" cy="14" r="5" fill="currentColor" /><ellipse cx="24" cy="24" rx="4" ry="5" fill="currentColor" /><ellipse cx="24" cy="35" rx="7" ry="9" fill="currentColor" /></>,
    beetle: <><path d="m20 10-3-5m11 5 3-5m-12 14-9-6m19 6 9-6m-19 12-11 1m21-1 11 1m-21 6-10 7m20-7 10 7" /><ellipse cx="24" cy="28" rx="11" ry="14" fill="currentColor" /><circle cx="24" cy="13" r="6" fill="currentColor" /><path d="M24 16v23m-8-17 8 7 8-7" className="bug-cut" /></>,
    grasshopper: <><path d="m28 12 7-7m-9 7 1-9m-2 24 9-14 7 21m-20-6-5-12-12 22m22-7 10 5 6 7m-20-13-12 4-6 7" /><ellipse cx="22" cy="27" rx="7" ry="13" transform="rotate(-34 22 27)" fill="currentColor" /><circle cx="28" cy="14" r="5" fill="currentColor" /><path d="m15 20 13 18" className="bug-cut" /></>,
    spider: <><path d="m20 19-8-7 1-8m15 15 8-7-1-8m-15 20-12-6-5 2m25 4 12-6 5 2m-25 8-12 4-5 6m25-10 12 4 5 6m-24-8-8 10 2 7m12-17 8 10-2 7" /><circle cx="24" cy="18" r="5" fill="currentColor" /><ellipse cx="24" cy="29" rx="8" ry="10" fill="currentColor" /></>,
  };
  return <svg aria-hidden="true" className={`bug-icon ${className}`}
    width={size} height={size} viewBox="0 0 48 48" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
    strokeLinejoin="round">{shapes[kind]}</svg>;
}

export function Tile({
  kind = 'queen',
  side = 'white',
  layers = 1,
  ghost = false,
  selected = false,
  mark = false,
}: {
  kind?: PieceKind;
  side?: Side;
  layers?: number;
  ghost?: boolean;
  selected?: boolean;
  mark?: boolean;
}) {
  return <svg aria-hidden="true"
    className={`tile-svg side-${side} ${ghost ? 'ghost-tile' : ''} ${selected ? 'selected-tile' : ''}`}
    viewBox="-4 -4 108 115">
    <polygon className="tile-shadow" points="98,57 74,98.6 26,98.6 2,57 26,15.4 74,15.4" />
    {layers > 1 && <polygon className="tile-under" points="98,58 74,99.6 26,99.6 2,58 26,16.4 74,16.4" />}
    <polygon className="tile-edge" points="98,54 74,95.6 26,95.6 2,54 26,12.4 74,12.4" />
    <polygon className="tile-face" points="98,49 74,90.6 26,90.6 2,49 26,7.4 74,7.4" />
    <polygon className="tile-inset" points="91,49 70.5,84.5 29.5,84.5 9,49 29.5,13.5 70.5,13.5" />
    <g transform="translate(23,21) scale(1.13)"
      style={{ color: PIECE_INFO[kind].color }}>
      <Bug kind={kind} size={48} />
    </g>
    {layers > 1 && <g className="layer-label" transform="translate(75,7)">
      <circle r="12" /><text textAnchor="middle" y="4">{layers}</text>
    </g>}
    {mark && <circle className="last-mark" cx="50" cy="81" r="2.6" />}
  </svg>;
}

export function BrandMark({ size = 36 }: { size?: number }) {
  return <span className="hive-brand-mark"
    style={{ width: size, height: Math.round(size * 1.08) }}>
    <Hexagon size={size} strokeWidth={1.25} />
    <Bug kind="queen" size={Math.round(size * .56)} />
  </span>;
}

export function Brand({ small = false }: { small?: boolean }) {
  return <span className={`hive-brand ${small ? 'small' : ''}`}>
    <BrandMark size={small ? 27 : 35} />
    <span>HIVE<small>虫 棋</small></span>
  </span>;
}

export function Disc({
  side,
  className = '',
}: {
  side: Side;
  className?: string;
}) {
  return <span aria-hidden="true"
    className={`hive-side-disc ${side} ${className}`} />;
}

export function Pawn({ side }: { side: Side }) {
  return <span className={`hive-pawn ${side}`}>
    <Bug kind="queen" size={18} />
  </span>;
}

export function HiveStillLife() {
  return <svg className="hive-still-life" viewBox="0 0 620 280"
    aria-hidden="true">
    <g transform="translate(275 128) rotate(-8)">
      {[
        [-78, 2, 'white', 'ant'],
        [-18, -42, 'black', 'queen'],
        [45, -7, 'white', 'beetle'],
        [102, 42, 'black', 'grasshopper'],
        [-25, 48, 'white', 'spider'],
      ].map(([x, y, side, kind], index) =>
        <g key={index} transform={`translate(${x} ${y}) scale(.7)`}>
          <Tile side={side as Side} kind={kind as PieceKind} />
        </g>)}
    </g>
  </svg>;
}
