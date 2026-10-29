import { Flower2, Heart, Mail } from 'lucide-react';
import portraits from '../../assets/portraits.webp';
import { role } from '../../model/roles';
import type { LoveLetterCard } from '@/api/generated/game-platform';

export function Portrait({
  rank = 9,
  className = '',
}: {
  rank?: number;
  className?: string;
}) {
  return <span className={`ll-portrait ${className}`} aria-hidden="true">
    <span style={{
      backgroundImage: `url(${portraits})`,
      backgroundPosition: `${(rank % 5) * 25}% ${rank < 5 ? '0%' : '100%'}`,
    }} />
  </span>;
}

export function Seal({ className = '' }: { className?: string }) {
  return <span className={`ll-seal ${className}`}>
    <Flower2 size={24} strokeWidth={1.15} />
  </span>;
}

export function Hearts({
  value = 0,
  total = 4,
}: {
  value?: number;
  total?: number;
}) {
  return <span className="ll-hearts" aria-label={`${value} / ${total} 枚好感`}>
    {Array.from({ length: total }, (_, index) =>
      <Heart key={index} size={11} fill={index < value ? 'currentColor' : 'none'}
        className={index < value ? 'earned' : ''} />)}
  </span>;
}

export function CardBack({ small = false }: { small?: boolean }) {
  return <span className={`ll-card-back ${small ? 'small' : ''}`}>
    <span><Flower2 /><Mail /></span>
  </span>;
}

export function PlayingCard({
  card,
  rank,
  selected,
  disabled,
  compact,
  onClick,
  label,
}: {
  card?: LoveLetterCard;
  rank?: number;
  selected?: boolean;
  disabled?: boolean;
  compact?: boolean;
  onClick?: () => void;
  label?: string;
}) {
  const value = rank ?? card?.rank ?? 9;
  const item = role(value);
  const body = <><span className="ll-card-picture"><Portrait rank={value} /></span>
    <span className="ll-card-rank">{value}</span>
    <span className="ll-card-copy"><strong>{item.name}</strong><small>{item.en}</small>
      {!compact && <span>{item.short}</span>}</span>
    {selected && <span className="ll-chosen">已选择</span>}</>;
  const className = `ll-playing-card ${selected ? 'selected' : ''} ${compact ? 'compact' : ''}`;
  return onClick
    ? <button type="button" className={className} aria-pressed={selected}
      disabled={disabled} data-click-sound="game-select"
      onClick={onClick} aria-label={label ?? `选择${item.name}`}>
      {body}</button>
    : <div className={className} aria-label={`${value} ${item.name}`}>{body}</div>;
}
