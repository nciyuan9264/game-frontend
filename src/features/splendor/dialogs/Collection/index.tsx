import { Bookmark, Eye } from 'lucide-react';
import { PlayerAvatar } from '../../components/AppShell';
import { Artwork, GemIcon } from '../../components/Artwork';
import { DevelopmentCardView, NobleTile } from '../../components/GamePieces';
import { Dialog } from '../../components/Dialog';
import { cardDisplay } from '../../model/catalog';
import { discounts, tokenTotal } from '../../model/selectors';
import { gemColors, gemMeta, type PlayerState } from '../../model/types';
import styles from './index.module.less';

export function CollectionDialog({ name, avatar, ai, player, isSelf, onClose, onCard, onNoble }: {
  name: string;
  avatar?: string;
  ai?: boolean;
  player: PlayerState;
  isSelf: boolean;
  onClose: () => void;
  onCard: (cardID: number) => void;
  onNoble: (nobleID: string) => void;
}) {
  const bonus = discounts(player);
  return <Dialog title={isSelf ? '我的收藏' : `${name} 的收藏`} eyebrow="YOUR GROWING COLLECTION"
    wide onClose={onClose}>
    <div className={styles.identity}><PlayerAvatar name={name} avatar={avatar} ai={ai} size={58} />
      <div><h3>{name}</h3><span>{player.normalCard.length} 张发展卡 · {tokenTotal(player)}/10 枚筹码</span></div>
      <b>{player.score}<small>声望</small></b></div>
    <div className={styles.wallet}><div><span>宝石</span><span>折扣</span><span>筹码</span></div>
      {gemColors.map(color => <div key={color}><GemIcon color={color} size={20} />
        <b>{color === 'Gold' ? '—' : bonus[color]}</b><span>{player.gem[color] ?? 0}</span></div>)}</div>
    <header className={styles.section}><h3>预留发展卡</h3><span>{player.reserveCard.length}/3</span></header>
    {isSelf ? <div className={styles.reserved} data-testid="own-reserved-cards">
      {player.reserveCard.map(card => <DevelopmentCardView key={card.id} card={card} density="mini"
        affordable={false} onClick={() => onCard(card.id)} />)}
      {!player.reserveCard.length && <div className={styles.empty}><Bookmark size={30} /><h3>为下一步留个机会</h3>
        <p>点击公开市场中的卡牌即可预留。</p></div>}</div>
      : <div className={styles.private} data-testid="hidden-reserved-cards"><Eye size={16} />
        该玩家的 {player.reserveCard.length} 张预留卡不展示，只公开数量。</div>}
    <header className={styles.section}><h3>已购发展卡</h3><span>{player.normalCard.length} 张 · 永久折扣已生效</span></header>
    <div className={styles.owned}>{player.normalCard.map(card => {
      const display = cardDisplay(card);
      return <button type="button" key={card.id} onClick={() => onCard(card.id)}>
        <Artwork index={display.art} /><span>{display.name}<small>{card.points} 分</small></span>
        <GemIcon color={card.bonus} size={18} /></button>;
    })}</div>
    {!player.normalCard.length && <p className={styles.helper}>购入第一张发展卡，就能开始积累永久折扣。</p>}
    <header className={styles.section}><h3>来访贵族</h3><span>{player.nobleCard.length} 位</span></header>
    {player.nobleCard.length ? <div className={styles.nobles}>{player.nobleCard.map(noble =>
      <NobleTile key={noble.id} noble={noble} progress={bonus} onClick={() => onNoble(noble.id)} />)}</div>
      : <p className={styles.helper}>还没有贵族来访，继续积累永久折扣。</p>}
    <p className={styles.srOnly}>{gemColors.map(color =>
      `${gemMeta[color].label}：${color === 'Gold' ? 0 : bonus[color]} 个折扣，${player.gem[color] ?? 0} 枚筹码`).join('；')}</p>
  </Dialog>;
}
