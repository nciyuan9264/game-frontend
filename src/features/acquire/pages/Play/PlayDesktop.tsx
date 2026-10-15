import type { ReactNode } from 'react';
import { MarketTable } from '../../components/MarketTable';
import type { AcquireInteraction } from '../../hooks/useAcquireInteraction';
import type { GameSnapshot } from '../../model/session';
import type { Company } from '../../model/types';
import { Activity, Portfolio } from './parts';
import styles from './index.module.less';

export interface PlayLayoutProps {
  data: GameSnapshot; interaction: AcquireInteraction; board: ReactNode; boardTools: ReactNode;
  activity: string[]; pending: boolean; resultsAction?: ReactNode;
  onCompany: (company: Company) => void; onActivity: () => void;
}
export function PlayDesktop(props: PlayLayoutProps) {
  const { data } = props;
  return <div className={styles.desktop}><aside className={styles.marketColumn}><MarketTable data={data} onCompany={props.onCompany} /></aside>
    <section className={styles.city}><header className={styles.boardHeading}><span>THE CITY <b>城市棋盘</b></span>{props.boardTools}</header>{props.board}
      <div className={styles.legend}><span><i />空地</span><span><i />独立地块</span><span><i />可落手牌</span><small>直接点选棋盘中的高亮地块</small></div>
    </section>
    <aside className={styles.playerColumn}><div className={styles.playerColumnInner}><Portfolio data={data} /><Activity items={props.activity} /></div></aside>
  </div>;
}
