import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { ActionButton } from '@/components/GameUI/ActionButton';
import { ResponsiveDialog } from '../../components/ResponsiveDialog';
import { money, type DisplaySnapshot } from '../../model/session';
import { companyKeys, companyPriceTiers } from '../../model/types';
import styles from './index.module.less';

// Mirrors acquire/utils/stock.go, including the non-linear prices above 20 tiles.
const tiers = [
  { label: '经济档', companies: 'Sackson · Tower', offset: 0 },
  { label: '标准档', companies: 'American · Festival · Worldwide', offset: 100 },
  { label: '豪华档', companies: 'Continental · Imperial', offset: 200 },
];
const rows = [
  ['2', 200, 2000], ['3', 300, 3000], ['4', 400, 4000], ['5', 500, 5000],
  ['6–10', 600, 6000], ['11–20', 700, 7000], ['21–30', 1200, 8000],
  ['31–40', 1500, 9000], ['41+', 1800, 10000],
] as const;

function bandFor(tiles: number) {
  if (tiles <= 2) return 0;
  if (tiles <= 5) return tiles - 2;
  if (tiles <= 10) return 4;
  if (tiles <= 20) return 5;
  if (tiles <= 30) return 6;
  if (tiles <= 40) return 7;
  return 8;
}

export function StockPrices({ data, onClose, initialTier = 0 }: {
  data?: DisplaySnapshot;
  onClose: () => void;
  initialTier?: number;
}) {
  const [tier, setTier] = useState(initialTier);
  const current = tiers[tier];
  const established = companyKeys.filter(company =>
    companyPriceTiers[company] === tier && (data?.roomData.companyInfo[company].tiles ?? 0) > 0);
  const currentBands = new Set(established.map(company =>
    bandFor(data?.roomData.companyInfo[company].tiles ?? 0)));
  return <ResponsiveDialog wide title="每一块地，都能改变价格。" eyebrow="STOCK PRICE & SHAREHOLDER BONUS" onClose={onClose}
    footer={<><span className={styles.footerNote}>奖金在合并 / 终局时结算</span><ActionButton onClick={onClose}>知道了</ActionButton></>}>
    <div className={styles.tabs} role="group" aria-label="公司档位">{tiers.map((item, index) =>
      <button type="button" key={item.label} data-click-sound="tab" className={tier === index ? styles.active : ''} aria-pressed={tier === index} onClick={() => setTier(index)}><b>{item.label}</b><small>{item.companies}</small></button>)}</div>
    <table className={styles.table}><thead><tr><th>公司规模</th><th>每股价格</th><th>多数股东奖励</th><th>少数股东奖励</th></tr></thead>
      <tbody>{rows.map(([range, price, bonus], index) => <tr key={range} className={currentBands.has(index) ? styles.isCurrent : undefined}><th>{range}</th><td>{money(price + current.offset)}</td><td>{money(bonus + current.offset * 10)}</td><td>{money((bonus + current.offset * 10) / 2)}</td></tr>)}</tbody></table>
    <p className={styles.current}>{data ? `当前规模：${established.length ? established.map(company => `${company} ${data.roomData.companyInfo[company].tiles} 块`).join(' / ') : '本档公司尚未成立'}` : `当前档位：${current.companies}`}</p>
    <div className={styles.hint}><ShieldCheck size={16} /><span>奖励在公司被合并或终局时结算；并列分红及实际数值以游戏服务为准。</span></div>
  </ResponsiveDialog>;
}
