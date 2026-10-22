import { AppShell, SplendorMark } from '../AppShell';
import styles from './index.module.less';

export function SplendorLoading({
  fullScreen = false,
  title = '正在陈列珠宝。',
  description = '同步房间与收藏家状态',
}: {
  fullScreen?: boolean;
  title?: string;
  description?: string;
}) {
  const content = <div className={`${styles.loading} ${fullScreen ? styles.fullScreen : ''}`} role="status" aria-label={description}>
    <span className={styles.mark}><SplendorMark /></span><span className={styles.gems}><i /><i /><i /></span>
    <h1>{title}</h1><p>{description}</p>
  </div>;
  return fullScreen ? <AppShell title="载入中">{content}</AppShell> : content;
}
