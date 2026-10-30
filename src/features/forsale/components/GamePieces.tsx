import type { CSSProperties } from 'react';
import {
  Bot,
  Check,
  Home,
  KeyRound,
} from 'lucide-react';
import { GameAvatar } from '@/components/GameUI/GameAvatar';
import propertiesArt from '../assets/properties.webp';
import {
  chequeMoney,
  propertyName,
  propertyType,
} from '../model/types';

export const PlayerAvatar = ({
  name,
  avatar,
  ai,
  size = 36,
}: {
  name: string;
  avatar?: string;
  ai?: boolean;
  size?: number;
}) => <GameAvatar
  className="fs-avatar"
  name={name}
  avatar={avatar}
  ai={ai}
  size={size}
  renderFallback={() => ai
    ? <Bot size={Math.round(size * .45)} />
    : <KeyRound size={Math.round(size * .42)} />}
/>;

export const PropertyCard = ({
  value,
  selected,
  compact,
  disabled,
  badge,
  onClick,
}: {
  value: number;
  selected?: boolean;
  compact?: boolean;
  disabled?: boolean;
  badge?: string;
  onClick?: () => void;
}) => {
  const type = propertyType(value);
  const style = {
    backgroundImage: `url(${propertiesArt})`,
    backgroundPosition: `${(type % 3) * 50}% ${type < 3 ? 0 : 100}%`,
  } as CSSProperties;
  const body = <><span className="fs-property-top"><b>{
    String(value).padStart(2, '0')}</b><Home size={14} /></span>
    <span className="fs-property-art" style={style} />
    <span className="fs-property-copy"><b>{propertyName(value)}</b>
      <small>房产等级 · {value}</small></span>
    {selected && <i className="fs-property-selected"><Check size={13} /></i>}
    {badge && <em>{badge}</em>}</>;
  const className = `fs-property ${compact ? 'compact' : ''} ${
    selected ? 'selected' : ''}`;
  return onClick
    ? <button type="button" className={className} disabled={disabled}
      aria-pressed={selected} aria-label={`选择${value}号房产`}
      data-click-sound="false"
      onClick={onClick}>{body}</button>
    : <div className={className}>{body}</div>;
};

export const Cheque = ({
  value,
  best,
}: {
  value: number;
  best?: boolean;
}) => <div className={`fs-cheque ${best ? 'best' : ''}`}>
  <header><small>FOR SALE BANK</small><Home size={12} /></header>
  <strong>{chequeMoney(value)}</strong>
  <footer><span>{value === 0 ? '零元支票' : '银行支票'}</span><i /></footer>
</div>;
