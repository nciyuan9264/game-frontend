import { Bot } from 'lucide-react';
import type {
  Piece,
  PieceKind,
  Side,
} from '../../model/types';

export function Torii({ size = 30 }: { size?: number }) {
  return <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M3 6c7 2 19 2 26 0M6 11h20M9 8v21M23 8v21M6 17h20M14 10v7M18 10v7"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="square"
    />
    <path d="M6 28h6M20 28h6" stroke="currentColor" strokeWidth="1.8" />
  </svg>;
}

export function Pawn({
  piece,
  side,
  kind = 'student',
  ghost = false,
  className = '',
}: {
  piece?: Pick<Piece, 'side' | 'kind'>;
  side?: Side;
  kind?: PieceKind;
  ghost?: boolean;
  className?: string;
}) {
  const owner = piece?.side ?? side ?? 'blue';
  const pieceKind = piece?.kind ?? kind;
  return <span
    className={[
      'pawn',
      owner,
      pieceKind === 'master' ? 'master' : '',
      ghost ? 'ghost' : '',
      className,
    ].filter(Boolean).join(' ')}
    aria-hidden="true"
  >
    <i className="pawn-shadow" />
    <i className="pawn-body" />
    <i className="pawn-head" />
    <i className="pawn-base" />
    {pieceKind === 'master' && <b>宗</b>}
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
    side={side === 'white' || side === 'red' ? 'red' : 'blue'}
    className={className}
  />;
}

export function BrandMark({
  size = 34,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  return <span
    className={`brand-seal ${className}`}
    style={{ width: size, height: Math.round(size * 1.12) }}
    aria-hidden="true"
  >御</span>;
}

export function Brand({ small = false }: { small?: boolean }) {
  return <span className={`brand ${small ? 'small' : ''}`}>
    <BrandMark size={small ? 27 : 34} />
    {!small && <span className="brand-word">
      ONITAMA<small>御 神 乐 棋</small>
    </span>}
  </span>;
}

export function OnitamaStillLife() {
  return <span className="hero-art" aria-label="山门、棋子与五式流转">
    <span className="hero-sun" />
    <span className="hero-mountain far" />
    <span className="hero-mountain near" />
    <span className="hero-torii"><Torii size={86} /></span>
    <span className="hero-spirit tiger">虎</span>
    <span className="hero-spirit crane">鹤</span>
    <span className="hero-five-cards">
      {['虎', '鹤', '龙', '象', '蟹'].map(value => <i key={value}>{value}</i>)}
    </span>
    <small className="hero-art-copy">FIVE MOVES.<br />INFINITE POSSIBILITIES.</small>
  </span>;
}

export function AIBadge() {
  return <span aria-label="AI 棋手"><Bot size={14} /></span>;
}
