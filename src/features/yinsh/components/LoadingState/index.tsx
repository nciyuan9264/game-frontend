import { AppShell, YinshMark } from '../AppShell';
import styles from './index.module.less';

export function YinshLoading({
  fullScreen = false,
  title = '正在摆好圆环。',
  description = '同步棋室与棋盘状态',
}: {
  fullScreen?: boolean;
  title?: string;
  description?: string;
}) {
  const content = <div className={`${styles.loading} ${fullScreen ? styles.fullScreen : ''}`} role="status" aria-label={description}>
    <span className={styles.mark}><YinshMark /></span>
    <span className={styles.pulse}><i /><i /><i /></span>
    <h1>{title}</h1><p>{description}</p>
  </div>;
  return fullScreen ? <AppShell title="载入中">{content}</AppShell> : content;
}
