import { AcquireMark } from '../AppShell';
import { Eyebrow } from '../Panel';
import rootStyles from '../../styles/root.module.less';
import styles from './index.module.less';

interface Props {
  title?: string;
  description?: string;
  status?: string;
  compact?: boolean;
  fullScreen?: boolean;
  skeletons?: number;
}

export function AcquireLoading({
  title = '下一张桌，正在就绪。',
  description = '正在同步房间与玩家状态',
  status = '正在连接在线服务',
  compact = false,
  fullScreen = false,
  skeletons = compact ? 2 : 4,
}: Props) {
  return <section className={`${rootStyles.root} ${styles.loading} ${compact ? styles.compact : ''} ${fullScreen ? styles.fullScreen : ''}`}
    role="status" aria-live="polite" aria-label={status}>
    <div className={styles.mark}><AcquireMark /></div>
    <Eyebrow>BUILDING THE NEXT CITY</Eyebrow>
    <h1>{title}</h1><p>{description}</p>
    <div className={styles.progress}><i /></div>
    {!!skeletons && <div className={styles.skeletons}>{Array.from({ length: skeletons }, (_, index) => <div key={index}><i /><span /><span /></div>)}</div>}
    <small>{status}</small>
  </section>;
}
