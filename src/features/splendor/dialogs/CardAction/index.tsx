import { Bookmark, Check, Info, ShoppingBag } from 'lucide-react';
import { ActionButton } from '@/components/GameUI/ActionButton';
import { Artwork, GemIcon } from '../../components/Artwork';
import { Dialog } from '../../components/Dialog';
import { cardDisplay } from '../../model/catalog';
import { paymentPreview, tokenTotal } from '../../model/selectors';
import { gemMeta, type DevelopmentCard, type PlayerState } from '../../model/types';
import styles from './index.module.less';

export function CardActionDialog({ card, player, goldAvailable, fromReserve, interactive, reserveAllowed, onClose, onBuy, onReserve }: {
  card: DevelopmentCard;
  player: PlayerState;
  goldAvailable: boolean;
  fromReserve: boolean;
  interactive: boolean;
  reserveAllowed: boolean;
  onClose: () => void;
  onBuy: () => void;
  onReserve: () => void;
}) {
  const display = cardDisplay(card);
  const payment = paymentPreview(player, card);
  const canBuy = interactive && payment.missing === 0;
  const mustReturn = goldAvailable && tokenTotal(player) >= 10;
  return <Dialog title={display.name} eyebrow={`${['I', 'II', 'III'][card.level - 1]} · ${fromReserve ? '你的预留' : '发展卡'}`}
    onClose={onClose} footer={<>
      {!fromReserve && <ActionButton disabled={!interactive || !reserveAllowed} onClick={onReserve}>
        <Bookmark size={16} />{reserveAllowed ? '预留此卡' : '预留已满'}</ActionButton>}
      <ActionButton variant="primary" disabled={!canBuy} onClick={onBuy}>
        <ShoppingBag size={16} />购买发展卡</ActionButton>
    </>}>
    <div className={styles.art}><Artwork index={display.art} /><i />
      <span>{card.points}<small>声望</small></span>
      <div><GemIcon color={card.bonus} size={28} /><b>永久折扣 +1<small>{gemMeta[card.bonus].label}</small></b></div></div>
    <section className={styles.payment}><header><h3>购买费用</h3><span>永久折扣不消耗</span></header>
      <div className={styles.paymentHead}><span>宝石</span><span>原价</span><span>折扣</span><span>需付</span></div>
      {payment.lines.map(line => <div className={styles.paymentRow} key={line.color}>
        <span><GemIcon color={line.color} size={20} /><small>{gemMeta[line.color].label}<em>持有 {player.gem[line.color] ?? 0}</em></small></span>
        <span>{line.cost}</span><span>{line.discount ? `−${line.discount}` : '—'}</span><b>{line.required}</b></div>)}
      <div className={`${styles.total} ${payment.missing ? styles.shortage : ''}`}><div><strong>{payment.missing ? '所需支付' : '自动支付'}</strong>
        <small>先用同色筹码，黄金补足</small></div><div>{Object.entries(payment.payment).map(([color, count]) =>
          count ? <span key={color}><GemIcon color={color as keyof typeof gemMeta} size={20} /><b>{count}</b></span> : null)}
          {!payment.total && !payment.missing && <strong><Check size={14} />免费购入</strong>}</div></div>
      {!!payment.missing && <p><Info size={14} />还缺 {payment.missing} 枚筹码，暂不能购买。</p>}</section>
    {fromReserve ? <div className={styles.note}><Bookmark size={15} />已在你的预留中，只有你可以购买。</div>
      : <div className={styles.reserveNote}><Bookmark size={17} /><span><b>{goldAvailable ? '预留可获得 1 枚黄金' : '黄金池已空，仍可预留'}</b>
        <small>{mustReturn ? '获得黄金后需退还 1 枚筹码。' : '预留后仅你可购买，不能弃置。'}</small></span>
        {goldAvailable && <em><GemIcon color="Gold" size={23} />+1</em>}</div>}
    {!interactive && <p className={styles.readonly}><Info size={14} />当前仅可查看，请等待你的回合。</p>}
  </Dialog>;
}
