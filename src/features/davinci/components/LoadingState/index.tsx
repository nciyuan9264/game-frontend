import { AppShell, DavinciMark } from '../AppShell';
import styles from './index.module.less';

export function DavinciLoading({
  fullScreen = false,
  title = '正在校准密码牌。',
  description = '同步房间与玩家状态',
}: {
  fullScreen?: boolean;
  title?: string;
  description?: string;
}) {
  const content = <div className={`${styles.loading} ${fullScreen ? styles.fullScreen : ''}`} role="status" aria-label={description}>
    <span className={styles.mark}><DavinciMark /></span>
    <span className={styles.scan} />
    <h1>{title}</h1>
    <p>{description}</p>
  </div>;
  return fullScreen ? <AppShell title="载入中">{content}</AppShell> : content;
}
