import { Bookmark, Check, Crown, LockKeyhole } from 'lucide-react';
import { Artwork, GemIcon } from '../Artwork';
import { cardDisplay, nobleDisplay } from '../../model/catalog';
import {
  cardColors,
  gemColors,
  gemMeta,
  type CardColor,
  type DevelopmentCard,
  type GemColor,
  type GemCounts,
  type Noble,
} from '../../model/types';
import styles from './index.module.less';

export function GemToken({ color, count, selected = false, size = 29 }: {
  color: GemColor;
  count?: number;
  selected?: boolean;
  size?: number;
}) {
  return <span className={`${styles.gemToken} ${selected ? styles.gemSelected : ''}`}>
    <GemIcon color={color} size={size} />
    {count != null && <b>{count}</b>}
  </span>;
}

export function TokenControl({ color, count, selected = 0, disabled, blocked, matrix = false, onClick }: {
  color: GemColor;
  count: number;
  selected?: number;
  disabled?: boolean;
  blocked?: boolean;
  matrix?: boolean;
  onClick?: () => void;
}) {
  return <button type="button" className={`${styles.tokenControl} ${selected ? styles.tokenPicked : ''}
    ${count === 0 ? styles.tokenEmpty : ''} ${blocked ? styles.tokenBlocked : ''}
    ${matrix ? styles.tokenMatrix : ''}`}
    disabled={disabled} onClick={onClick} aria-label={`选择${gemMeta[color].label}`} aria-pressed={selected > 0}>
    <span className={styles.tokenDisc}><GemIcon color={color} size={25} /><b>{count}</b>
      {selected > 0 && <em>+{selected}</em>}</span>
    <span>{gemMeta[color].label}</span>
  </button>;
}

export function ResourceMatrix({
  bank,
  wallet,
  bonuses,
  selected,
  interactive,
  selectionLocked,
  onToggle,
}: {
  bank: GemCounts;
  wallet: GemCounts;
  bonuses: Partial<Record<CardColor, number>>;
  selected: GemCounts;
  interactive: boolean;
  selectionLocked: boolean;
  onToggle: (color: CardColor) => void;
}) {
  return <div className={styles.resourceMatrix} role="group" aria-label="宝石银行与我的资源对照">
    <span className={styles.resourceLabels} aria-hidden="true">
      <i>银行库存</i><i>我的筹码</i><i>永久折扣</i>
    </span>
    {gemColors.map(color => {
      const count = bank[color] ?? 0;
      const picked = color === 'Gold' ? 0 : selected[color] ?? 0;
      const disabled = color === 'Gold' || !interactive || !count
        || (!picked && selectionLocked);
      return <span key={color}
        className={`${styles.resourceColumn} ${color === 'Gold' ? styles.resourceGold : ''}`}>
        <span className={styles.resourceBank}>
          <TokenControl color={color} count={count} selected={picked} matrix
            disabled={disabled} blocked={!disabled && !picked && selectionLocked}
            onClick={() => color !== 'Gold' && onToggle(color)} />
        </span>
        <b className={`${styles.resourceValue} ${wallet[color] ? '' : styles.resourceZero}`}>
          {wallet[color] ?? 0}
        </b>
        <b className={`${styles.resourceDiscount} ${color === 'Gold' ? styles.resourceUnavailable : ''}
          ${color !== 'Gold' && !bonuses[color] ? styles.resourceZero : ''}`}>
          {color === 'Gold' ? '—' : bonuses[color] ?? 0}
        </b>
      </span>;
    })}
  </div>;
}

export function PlayerResourceSummary({
  wallet,
  bonuses,
}: {
  wallet: GemCounts;
  bonuses: Partial<Record<CardColor, number>>;
}) {
  return <span className={styles.playerResourceSummary}>
    <span className={styles.playerResourceRow}>
      <i>折扣</i>
      {gemColors.map(color => color === 'Gold'
        ? <span key={color} className={styles.playerResourceUnavailable}>—</span>
        : <span key={color} className={!bonuses[color] ? styles.playerResourceZero : ''}>
          <GemIcon color={color} size={10} /><b>{bonuses[color] ?? 0}</b>
        </span>)}
    </span>
    <span className={styles.playerResourceRow}>
      <i>筹码</i>
      {gemColors.map(color => <span key={color}
        className={`${!wallet[color] ? styles.playerResourceZero : ''}
          ${color === 'Gold' ? styles.playerResourceGold : ''}`}>
        <GemIcon color={color} size={10} /><b>{wallet[color] ?? 0}</b>
      </span>)}
    </span>
  </span>;
}

export function DevelopmentCardView({
  card,
  selected = false,
  disabled = false,
  affordable = false,
  density = 'board',
  onClick,
}: {
  card: DevelopmentCard;
  selected?: boolean;
  disabled?: boolean;
  affordable?: boolean;
  density?: 'board' | 'dialog' | 'mini';
  onClick?: () => void;
}) {
  const display = cardDisplay(card);
  const className = `${styles.card} ${styles[`card${density}`]} ${affordable ? styles.affordable : ''}
    ${selected ? styles.cardSelected : ''}`;
  const content = <><span className={styles.cardImage}><Artwork index={display.art} />
    <i className={styles.cardShade} /><span className={styles.cardPoints}>
      {card.points > 0 ? card.points : '—'}</span>
    <span className={styles.cardBonus}><GemIcon color={card.bonus} size={26} /></span>
    <span className={styles.cardName}>{display.name}</span>
    {affordable && <span className={styles.canBuy}><Check size={11} /><i>可购</i></span>}</span>
    <span className={styles.cardCosts}>{cardColors.map(color => {
      const cost = card.cost[color] ?? 0;
      return cost > 0 ? <span key={color} title={`${gemMeta[color].label} ${cost}`}>
        <GemIcon color={color} size={15} /><b>{cost}</b>
      </span> : null;
    })}</span></>;
  return onClick
    ? <button type="button" className={className} disabled={disabled} aria-pressed={selected}
      aria-label={`查看${display.name}`} onClick={onClick}>{content}</button>
    : <span className={className}>{content}</span>;
}

export function NobleTile({ noble, progress, compact = false, onClick }: {
  noble: Noble;
  progress?: Partial<Record<CardColor, number>>;
  compact?: boolean;
  onClick?: () => void;
}) {
  const display = nobleDisplay(noble);
  const missing = cardColors.reduce((total, color) =>
    total + Math.max(0, (noble.cost[color] ?? 0) - (progress?.[color] ?? 0)), 0);
  const content = <><Artwork index={display.art} className={styles.noblePortrait} />
    <span className={styles.nobleInfo}><span className={styles.nobleTop}><b>{display.name}</b><strong>3 <Crown size={11} /></strong></span>
      <span className={styles.nobleRequirements}>{cardColors.map(color => {
        const count = noble.cost[color] ?? 0;
        return count > 0 ? <i key={color} className={(progress?.[color] ?? 0) >= count ? styles.requirementMet : ''}>
          <GemIcon color={color} size={13} />{count}</i> : null;
      })}</span>
      {!compact && <small>{progress ? missing ? `还差 ${missing} 张折扣卡` : '满足来访条件' : display.title}</small>}
    </span></>;
  const className = `${styles.noble} ${compact ? styles.nobleCompact : ''} ${progress && !missing ? styles.nobleEligible : ''}`;
  return onClick
    ? <button type="button" className={className} aria-label={`查看贵族${display.name}`} onClick={onClick}>{content}</button>
    : <span className={className}>{content}</span>;
}

export function DeckBack({ level, count }: { level: 1 | 2 | 3; count: number }) {
  const color: CardColor = level === 3 ? 'Red' : level === 2 ? 'Blue' : 'Green';
  return <span className={`${styles.deck} ${styles[`deck${level}`]}`} aria-label={`${level} 阶牌堆，剩余 ${count} 张`}>
    <strong>{['Ⅰ', 'Ⅱ', 'Ⅲ'][level - 1]}</strong><GemIcon color={color} size={25} /><small>{count}</small>
  </span>;
}

export function ReservedCardBack({ compact = false }: { compact?: boolean }) {
  return <span className={`${styles.reserved} ${compact ? styles.reservedCompact : ''}`}>
    <LockKeyhole size={14} /><small>预留</small>
  </span>;
}

export function EmptyReserve() {
  return <span className={styles.emptyReserve}><Bookmark size={16} />尚未预留</span>;
}
