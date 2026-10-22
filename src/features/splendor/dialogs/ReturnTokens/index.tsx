import { Minus, Plus } from 'lucide-react';
import { ActionButton } from '@/components/GameUI/ActionButton';
import { GemIcon } from '../../components/Artwork';
import { Dialog } from '../../components/Dialog';
import { overflowCount, returnSelectionValid } from '../../model/selectors';
import { gemColors, gemMeta, type GemColor, type GemCounts } from '../../model/types';
import styles from './index.module.less';

const total = (counts: GemCounts) =>
  Object.values(counts).reduce((sum, count) => sum + (count ?? 0), 0);

export function ReturnTokensDialog({ wallet, returns, onChange, onCancel, onConfirm }: {
  wallet: Record<GemColor, number>;
  returns: GemCounts;
  onChange: (returns: GemCounts) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const required = overflowCount(wallet);
  const returned = total(returns);
  const change = (color: GemColor, delta: number) => {
    const next = Math.max(0, (returns[color] ?? 0) + delta);
    if (next > wallet[color] || returned + delta > required) return;
    onChange({ ...returns, [color]: next });
  };
  return <Dialog title={`退还 ${required} 枚筹码`} eyebrow="KEEP YOUR COLLECTION BALANCED" onClose={onCancel}
    footer={<><ActionButton onClick={onCancel}>返回选择</ActionButton>
      <ActionButton variant="primary" disabled={!returnSelectionValid(wallet, returns)} onClick={onConfirm}>
        确认退还并完成回合</ActionButton></>}>
    <p className={styles.description}>你的筹码将达到 <b>{total(wallet)}</b> 枚。回合结束最多持有 10 枚，
      包含黄金，也可以退还刚获得的筹码。</p>
    <div className={styles.progress}><b>{total(wallet) - returned} <span>/ 10 枚</span></b>
      <span>已选择退还 {returned} / {required}</span></div>
    <div className={styles.grid}>{gemColors.map(color => <div key={color}>
      <GemIcon color={color} size={34} /><strong>{gemMeta[color].label}</strong><small>持有 {wallet[color]} 枚</small>
      <div><button type="button" aria-label={`减少退还${gemMeta[color].label}`} disabled={!(returns[color] ?? 0)}
        onClick={() => change(color, -1)}><Minus size={14} /></button><b>{returns[color] ?? 0}</b>
        <button type="button" aria-label={`退还${gemMeta[color].label}`}
          disabled={(returns[color] ?? 0) >= wallet[color] || returned >= required}
          onClick={() => change(color, 1)}><Plus size={14} /></button></div>
    </div>)}</div>
    <p className={styles.helper}>筹码退还至公共宝石银行，其他玩家随后可以拿取。</p>
  </Dialog>;
}
