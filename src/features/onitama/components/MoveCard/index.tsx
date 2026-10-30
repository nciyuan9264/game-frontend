import {
  ArrowDown,
  ArrowUp,
  Check,
} from 'lucide-react';
import {
  CARDS,
} from '../../model/cards';
import type {
  CardID,
  Side,
} from '../../model/types';

export function MiniGrid({
  id,
  flipped = false,
  side = 'blue',
  className = '',
}: {
  id: CardID;
  flipped?: boolean;
  side?: Side;
  className?: string;
}) {
  const moves = CARDS[id].moves;
  return <span
    className={`mini-grid ${side} ${className}`}
    aria-label={`${CARDS[id].name}走法图`}
  >
    {Array.from({ length: 25 }, (_, index) => {
      const row = Math.floor(index / 5);
      const column = index % 5;
      const sign = flipped ? -1 : 1;
      const active = moves.some(move =>
        2 + move.x * sign === column
        && 2 + move.y * sign === row);
      return <i
        key={index}
        className={index === 12 ? 'origin' : active ? 'can-move' : ''}
      />;
    })}
  </span>;
}

export function CardArtwork({
  id,
  className = '',
}: {
  id: CardID;
  className?: string;
}) {
  const card = CARDS[id];
  return <span
    className={`card-animal-art ${id} ${className}`}
    role="img"
    aria-label={`${card.name}水墨图形`}
  >
    <i className="ink-wash one" />
    <i className="ink-wash two" />
    <b>{card.glyph}</b>
  </span>;
}

export function MoveCard({
  id,
  side = 'blue',
  flipped = false,
  selected = false,
  compact = false,
  mini = false,
  disabled = false,
  shortcut,
  label,
  onClick,
}: {
  id: CardID;
  side?: Side;
  flipped?: boolean;
  selected?: boolean;
  compact?: boolean;
  mini?: boolean;
  disabled?: boolean;
  shortcut?: string;
  label?: string;
  onClick?: () => void;
}) {
  const card = CARDS[id];
  return <button
    type="button"
    className={[
      'move-card',
      side,
      selected ? 'selected' : '',
      compact ? 'compact' : '',
      mini ? 'mini' : '',
    ].filter(Boolean).join(' ')}
    aria-label={label ?? `查看${card.name}详解`}
    aria-pressed={onClick && !mini ? selected : undefined}
    disabled={disabled}
    data-click-sound={onClick ? 'false' : undefined}
    onClick={onClick}
  >
    <span className="card-heading">
      <span className="card-name">{card.name}<small>{card.englishName}</small></span>
      <span className="card-direction">
        {selected
          ? <Check size={14} />
          : flipped
            ? <ArrowDown size={13} />
            : <ArrowUp size={13} />}
        <span>{selected ? '已选' : flipped ? '向下' : '向上'}</span>
      </span>
    </span>
    <span className="card-visual">
      <CardArtwork id={id} />
      <MiniGrid id={id} flipped={flipped} side={side} />
    </span>
    {!mini && <span className="card-foot">
      <span>{compact ? '点击查看走法' : card.summary}</span>
      <span className={`stamp ${card.mark}`}>{shortcut ?? '印'}</span>
    </span>}
  </button>;
}
