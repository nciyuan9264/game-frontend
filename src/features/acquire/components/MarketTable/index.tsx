import type { CSSProperties } from 'react';
import { ShieldCheck } from 'lucide-react';
import { money, type DisplaySnapshot } from '../../model/session';
import { CompanyGlyph } from '../CompanyGlyph';
import { companyColors, companyKeys, type Company } from '../../model/types';
import { AnimatedValue } from '../AnimatedValue';
import styles from './index.module.less';

export function MarketTable({ data, onCompany }: { data: DisplaySnapshot; onCompany?: (company: Company) => void }) {
  return <section className={styles.market}><header><div><small>THE MARKET</small><h2>公司行情</h2></div><span>7 家公司</span></header>
    <div>{companyKeys.map(key => {
      const company = data.roomData.companyInfo[key];
      const held = data.playerData.stocks[key] ?? 0;
      return <button type="button" key={key} className={`${styles.company} ${company.tiles ? styles.active : ''}`}
        style={{ '--co': companyColors[key] } as CSSProperties} onClick={() => onCompany?.(key)} aria-label={'查看 ' + key + ' 股价'}>
        <span className={styles.companyIcon}><CompanyGlyph company={key} size={24} /></span>
        <span><strong>{key}{company.tiles >= 11 && <ShieldCheck size={11} aria-label="安全公司" />}</strong>
          <small>{company.tiles ? <><AnimatedValue value={company.tiles} /> 块地 · 库存 <AnimatedValue value={company.stockTotal} /></> : '尚未成立'}</small></span>
        <span><b>{company.tiles ? <AnimatedValue value={company.stockPrice} formatter={money} /> : '—'}</b>
          <small>{held ? <>持有 <AnimatedValue value={held} /> 股</> : '未持有'}</small></span>
      </button>;
    })}</div><footer><ShieldCheck size={12} />11 块地起成为安全公司</footer>
  </section>;
}
