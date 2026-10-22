import { Check, Crown } from 'lucide-react';
import { Artwork, GemIcon } from '../../components/Artwork';
import { Dialog } from '../../components/Dialog';
import { nobleDisplay } from '../../model/catalog';
import { discounts } from '../../model/selectors';
import { cardColors, gemMeta, type Noble, type PlayerState } from '../../model/types';
import styles from './index.module.less';

export function NobleDetailDialog({ noble, player, onClose }: {
  noble: Noble;
  player: PlayerState;
  onClose: () => void;
}) {
  const display = nobleDisplay(noble);
  const bonus = discounts(player);
  return <Dialog title={display.name} eyebrow="PATRONS OF THE ARTS" onClose={onClose}>
    <div className={styles.cover}><Artwork index={display.art} /><div><Crown size={30} /><b>3</b>
      <span>声望</span><p>{display.title}</p></div></div>
    <h3 className={styles.heading}>来访条件</h3>
    <p className={styles.helper}>只计算已购发展卡的永久折扣，不计算筹码。</p>
    <div className={styles.progress}>{cardColors.map(color => {
      const required = noble.cost[color] ?? 0;
      if (!required) return null;
      const current = bonus[color];
      return <div key={color}><GemIcon color={color} size={24} /><span>{gemMeta[color].label}</span>
        <i><em style={{ width: `${Math.min(100, current / required * 100)}%` }} /></i>
        <b>{current} / {required}</b>{current >= required && <Check size={15} />}</div>;
    })}</div>
    <p className={styles.notice}>在你的回合结束时自动检查条件；服务端每回合自动结算一位满足条件的贵族。</p>
  </Dialog>;
}
