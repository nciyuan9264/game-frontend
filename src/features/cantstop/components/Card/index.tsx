import { Check } from 'lucide-react';
import { columnHeight } from '../../model/board';
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
  const points = columnHeight(value);
  const body = <><span className="cs-card-corner">{value}</span>
    <strong className="cs-card-number">{value}</strong>
    <span className="cs-card-points"><Bull size={13} /><b>{points}</b></span>
    <span className="cs-card-pips">{Array.from({ length: Math.min(points, 7) }, (_, index) =>
      <Bull key={index} size={8} />)}</span>
    {selected && <span className="cs-card-check"><Check size={11} /></span>}</>;
  const className = [
    'cs-number-card',
    `points-${points}`,
    selected ? 'selected' : '',
    compact ? 'compact' : '',
  ].filter(Boolean).join(' ');
  return onClick
    ? <button type="button" className={className}
      disabled={disabled} aria-pressed={selected}
      aria-label={`选择路线 ${value}`} onClick={onClick}>{body}</button>
    : <span className={className}
      aria-label={`${value} 号路线，${points} 阶`}>{body}</span>;
}

export function CardBack({ compact = false }: { compact?: boolean }) {
  return <span className={`cs-card-back ${compact ? 'compact' : ''}`}>
    <Bull size={compact ? 17 : 25} /><b>▲</b>
  </span>;
}

export function BullScore({
  value,
  label,
}: {
  value: number;
  label?: string;
}) {
  return <span className="cs-bull-score"><Bull size={13} />
    <b>{value}</b>{label && <small>{label}</small>}</span>;
}
