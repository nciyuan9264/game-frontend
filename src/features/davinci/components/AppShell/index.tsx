import type { ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { BookOpen, Bot, ChevronRight, LayoutGrid, Trophy, UserRound } from 'lucide-react';
import type { UserProfile } from '@/hooks/request/useProfile';
import { ClickFeedback } from '@/components/GameUI/ClickFeedback';
import gameRoot from '@/components/GameUI/styles/root.module.less';
import rootStyles from '../../styles/root.module.less';
import styles from './index.module.less';

const navigation = [
  { path: '/game/davinci', title: '大厅', Icon: LayoutGrid },
  { path: '/game/davinci/rankings', title: '排行', Icon: Trophy },
  { path: '/game/davinci/guide', title: '玩法', Icon: BookOpen },
  { path: '/game/davinci/me', title: '我的', Icon: UserRound },
];

export function DavinciMark() {
  return <span className={styles.mark} aria-hidden="true"><i /><i /><b>7</b></span>;
}

export function PlayerAvatar({
  name,
  avatar,
  ai,
  size = 36,
}: {
  name: string;
  avatar?: string;
  ai?: boolean;
  size?: number;
}) {
  const initials = Array.from(name.trim()).slice(0, 2).join('').toUpperCase() || 'P';
  return <span className={styles.avatar} style={{ width: size, height: size }} aria-hidden="true">
    {avatar ? <img src={avatar} alt="" referrerPolicy="no-referrer" />
      : ai ? <Bot size={Math.round(size * .48)} /> : <b>{initials}</b>}
  </span>;
}

function Brand() {
  return <><DavinciMark /><span><b>DAVINCI CODE</b><small>CIPHER TABLE</small></span></>;
}

export function AppShell({
  children,
  title,
  profile,
  inMatch = false,
  hideHeader = false,
  tools,
}: {
  children: ReactNode;
  title: string;
  profile?: Pick<UserProfile, 'name' | 'avatar'>;
  inMatch?: boolean;
  hideHeader?: boolean;
  tools?: ReactNode;
}) {
  const rootClass = `${gameRoot.root} ${rootStyles.root} ${styles.shell} ${inMatch ? styles.inMatch : ''} ${hideHeader ? styles.hideHeader : ''}`;
  return <div className={rootClass}>
    <aside className={styles.rail}>
      {inMatch ? <span className={styles.monogram}><DavinciMark /></span>
        : <Link className={styles.monogram} to="/game/davinci" aria-label="达芬奇密码大厅"><DavinciMark /></Link>}
      {!inMatch && <nav aria-label="达芬奇密码导航">{navigation.slice(0, 3).map(({ path, title: label, Icon }) =>
        <NavLink key={path} to={path} end className={({ isActive }) => isActive ? styles.active : ''}>
          <Icon size={20} /><span>{label}</span>
        </NavLink>)}</nav>}
      <div className={styles.railBottom}><span className={styles.onlineDot} />
        {inMatch ? <PlayerAvatar name={profile?.name ?? '玩家'} avatar={profile?.avatar} size={38} />
          : <Link to="/game/davinci/me" aria-label="个人资料"><PlayerAvatar name={profile?.name ?? '玩家'} avatar={profile?.avatar} size={38} /></Link>}
      </div>
    </aside>
    <div className={styles.main}>
      {!hideHeader && <header className={styles.header}>
        {inMatch ? <span className={styles.brand}><Brand /></span>
          : <Link to="/game/davinci" className={styles.brand} aria-label="达芬奇密码大厅"><Brand /></Link>}
        <span className={styles.divider} />
        <span className={styles.breadcrumb}><span>DAVINCI</span><ChevronRight size={12} /><b>{title}</b></span>
        <div className={styles.tools}><span className={styles.environment}><i />在线版本</span>{tools}
          {profile && (inMatch ? <PlayerAvatar name={profile.name} avatar={profile.avatar} />
            : <Link to="/game/davinci/me" className={styles.profile}><PlayerAvatar name={profile.name} avatar={profile.avatar} /><span>{profile.name}</span></Link>)}
        </div>
      </header>}
      <main className={styles.content}>{children}</main>
    </div>
    {!inMatch && <nav className={styles.mobileNav} aria-label="达芬奇密码手机导航">
      {navigation.map(({ path, title: label, Icon }) => <NavLink end key={path} to={path}
        className={({ isActive }) => isActive ? styles.active : ''}><Icon size={20} /><span>{label}</span></NavLink>)}
    </nav>}
    <ClickFeedback />
  </div>;
}
