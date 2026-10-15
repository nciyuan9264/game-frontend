import { MobileMarket, PhaseAction } from './parts';
import type { PlayLayoutProps } from './PlayDesktop';
import styles from './index.module.less';

export function PlayMobile(props: PlayLayoutProps) {
  const { data, interaction } = props;
  return <div className={styles.mobile}>
    {data.roomData.gameStatus === 'end' && props.resultsAction && <div className={styles.mobileResultsAction}>{props.resultsAction}</div>}
    <MobileMarket data={data} onCompany={props.onCompany} onActivity={props.onActivity} />
    <section className={styles.city}><header className={styles.boardHeading}><span>城市棋盘 <b>12 × 9</b></span>{props.boardTools}</header>{props.board}
      <div className={styles.legend}><span><i />空地</span><span><i />独立地块</span><span><i />可落手牌</span><small>点高亮地块选择</small></div>
      {data.roomData.gameStatus !== 'end' && <div className={styles.mobileBoardAction}>
        <PhaseAction data={data} interaction={interaction} pending={props.pending} buttonOnly />
      </div>}
    </section>
  </div>;
}
