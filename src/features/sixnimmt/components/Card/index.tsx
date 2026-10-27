import { Check } from 'lucide-react';
import { bullheads } from '../../model/cards';
import { Bull } from '../AppShell';

export function NumberCard({
  value,
  selected = false,
  disabled = false,
  compact = false,
  onClick,
}: {
  value: number;
  selected?: boolean;
  disabled?: boolean;
  compact?: boolean;
  onClick?: () => void;
}) {
  const points = bullheads(value);
  const body = <><span className="sn-card-corner">{value}</span>
    <strong className="sn-card-number">{value}</strong>
    <span className="sn-card-points"><Bull size={13} /><b>{points}</b></span>
    <span className="sn-card-pips">{Array.from({ length: points }, (_, index) =>
      <Bull key={index} size={8} />)}</span>
    {selected && <span className="sn-card-check"><Check size={11} /></span>}</>;
  const className = [
    'sn-number-card',
    `points-${points}`,
    selected ? 'selected' : '',
    compact ? 'compact' : '',
  ].filter(Boolean).join(' ');
  return onClick
    ? <button type="button" className={className}
      disabled={disabled} aria-pressed={selected}
      aria-label={`选择手牌 ${value}`} onClick={onClick}>{body}</button>
    : <span className={className}
      aria-label={`${value}，${points} 牛头`}>{body}</span>;
}

export function CardBack({ compact = false }: { compact?: boolean }) {
  return <span className={`sn-card-back ${compact ? 'compact' : ''}`}>
    <Bull size={compact ? 17 : 25} /><b>6</b>
  </span>;
}

export function BullScore({
  value,
  label,
}: {
  value: number;
  label?: string;
}) {
  return <span className="sn-bull-score"><Bull size={13} />
    <b>{value}</b>{label && <small>{label}</small>}</span>;
}
