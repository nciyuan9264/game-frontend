import { useEffect, useRef, type ReactNode } from 'react';
import { LogOut, Pencil } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ActionButton } from '../ActionButton';
import type {
  GameMobileHistoryItem,
  GameMobileProfileStat,
} from './types';
import styles from './index.module.less';

export interface GameMobileProfileProps {
  avatar: ReactNode;
  eyebrow: ReactNode;
  name: ReactNode;
  playerID: ReactNode;
  email?: ReactNode;
  stats: readonly GameMobileProfileStat[];
  historyTitle: ReactNode;
  historyItems: readonly GameMobileHistoryItem[];
  emptyHistory?: ReactNode;
  historyHasMore?: boolean;
  historyLoading?: boolean;
  onHistoryLoadMore?: () => void;
  isAdmin?: boolean;
  logoutPending?: boolean;
  logoutError?: ReactNode;
  onLogout: () => void;
}

export function GameMobileProfile({
  avatar,
  eyebrow,
  name,
  playerID,
  email,
  stats,
  historyTitle,
  historyItems,
  emptyHistory,
  historyHasMore = false,
  historyLoading = false,
  onHistoryLoadMore,
  isAdmin = false,
  logoutPending,
  logoutError,
  onLogout,
}: GameMobileProfileProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const historyEndRef = useRef<HTMLDivElement>(null);
  const requestedRef = useRef(false);
  useEffect(() => {
    if (historyLoading) {
      requestedRef.current = false;
      return;
    }
    const root = rootRef.current;
    const target = historyEndRef.current;
    if (!root || !target || !historyHasMore || !onHistoryLoadMore) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || requestedRef.current) return;
      requestedRef.current = true;
      onHistoryLoadMore();
    }, {
      root,
      rootMargin: '180px 0px',
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, [
    historyHasMore,
    historyItems.length,
    historyLoading,
    onHistoryLoadMore,
  ]);

  return <div className={`${styles.mobileOnly} ${styles.profile}`}
    ref={rootRef}
    data-game-public-mobile="profile"
    data-game-mobile-scroll-owner="profile">
    <section className={styles.profileCard}>
      <div className={styles.profileIdentity}><div>
          <small className={styles.profileEyebrow}>{eyebrow}</small>
          <h1>{name}</h1>
          <span className={styles.profilePlayerID}>PLAYER ID · {playerID}</span>
          <span className={styles.profileIdentityEmail}
            data-game-profile-email>{email || '邮箱未绑定'}</span>
        </div><a className={styles.profileAvatarLink}
          href="https://auth.gamebus.online/profile" aria-label="编辑资料">
          {avatar}<span className={styles.profileAvatarEdit}>
            <Pencil size={13} /></span>
        </a></div>
      <div className={styles.profileStats}>{stats.map((stat, index) =>
        <span key={index}><b>{stat.value}</b><small>{stat.label}</small></span>)}
      </div>
    </section>
    <section className={styles.profileHistory}>
      <header className={styles.profileHistoryHeader}
        data-game-mobile-sticky-header="profile">
        <h2>{historyTitle}</h2>
      </header>
      {historyItems.length
        ? <div className={styles.historyList}>{historyItems.map(item => {
          const content = <><span><b>{item.title}</b><small>{item.detail}</small>
          </span>{item.accessory != null && <span
            className={styles.historyAccessory}>{item.accessory}</span>}</>;
          if (item.href) return <Link key={item.id} to={item.href}>{content}</Link>;
          return <button key={item.id} type="button" onClick={item.onClick}
            disabled={!item.onClick}>{content}</button>;
        })}</div>
        : emptyHistory}
      {historyHasMore && <div ref={historyEndRef}
        className={styles.historySentinel} aria-hidden="true" />}
      {isAdmin && <div className={styles.profileAdminLogout}>
        <ActionButton variant="quiet" pending={logoutPending} onClick={onLogout}>
          <LogOut size={14} />退出登录
        </ActionButton>
        {logoutError && <p role="alert" className={styles.profileError}>
          {logoutError}</p>}
      </div>}
    </section>
  </div>;
}
