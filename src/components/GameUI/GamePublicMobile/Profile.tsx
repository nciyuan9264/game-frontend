import type { ReactNode } from 'react';
import { ChevronRight, Info, LogOut, Mail, Pencil } from 'lucide-react';
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
  historyFooter?: ReactNode;
  logoutPending?: boolean;
  logoutError?: ReactNode;
  onLogout: () => void;
  onAbout: () => void;
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
  historyFooter,
  logoutPending,
  logoutError,
  onLogout,
  onAbout,
}: GameMobileProfileProps) {
  return <div className={`${styles.mobileOnly} ${styles.profile}`}
    data-game-public-mobile="profile">
    <section className={styles.profileCard}>
      <div className={styles.profileIdentity}>{avatar}<div><small>{eyebrow}</small>
        <h1>{name}</h1><span>PLAYER ID · {playerID}</span></div></div>
      <div className={styles.profileEmail}><Mail size={14} />
        {email || '邮箱未绑定'}</div>
      <div className={styles.profileStats}>{stats.map((stat, index) =>
        <span key={index}><b>{stat.value}</b><small>{stat.label}</small></span>)}
      </div>
      <div className={styles.profileManage}>
        <a href="https://auth.gamebus.online/profile"><Pencil size={14} />编辑资料</a>
        <ActionButton variant="quiet" pending={logoutPending} onClick={onLogout}>
          <LogOut size={14} />退出登录
        </ActionButton>
      </div>
      {logoutError && <p role="alert" className={styles.profileError}>
        {logoutError}</p>}
    </section>
    <section className={styles.profileHistory}>
      <h2>{historyTitle}</h2>
      {historyItems.length
        ? <div>{historyItems.map(item => {
          const content = <><span><b>{item.title}</b><small>{item.detail}</small>
          </span>{item.accessory}</>;
          if (item.href) return <Link key={item.id} to={item.href}>{content}</Link>;
          return <button key={item.id} type="button" onClick={item.onClick}
            disabled={!item.onClick}>{content}</button>;
        })}</div>
        : emptyHistory}
      {historyFooter}
    </section>
    <button type="button" className={styles.aboutEntry}
      data-game-mobile-about-entry onClick={onAbout}>
      <span><Info size={17} /></span><span><b>关于与联系</b>
        <small>项目作者、源码与联系方式</small></span>
      <ChevronRight size={17} />
    </button>
  </div>;
}
