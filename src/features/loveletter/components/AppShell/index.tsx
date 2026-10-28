import type { ReactNode } from 'react';
import {
  BookOpen, Bot, LayoutGrid, Mail, Trophy, UserRound,
} from 'lucide-react';
import type { AuthProfile } from '@/features/game-core/api/auth';
import { GameAppShell } from '@/components/GameUI/GameAppShell';
import { GameAvatar } from '@/components/GameUI/GameAvatar';
import gameRoot from '@/components/GameUI/styles/root.module.less';
import styles from './index.module.less';
import '../../styles/root.css';
import '../../styles/pages.css';
import '../../styles/play.css';

type ShellProfile = Pick<AuthProfile, 'name'> & {
  avatar?: AuthProfile['avatar'];
};

const navigation = [
  { path: '/game/loveletter', title: '游戏大厅', desktopLabel: '大厅', mobileLabel: '大厅', icon: <LayoutGrid size={21} />, mobileIcon: <LayoutGrid size={20} /> },
  { path: '/game/loveletter/rankings', title: '心意排行', desktopLabel: '排行', mobileLabel: '排行', icon: <Trophy size={21} />, mobileIcon: <Trophy size={20} /> },
  { path: '/game/loveletter/guide', title: '玩法指南', desktopLabel: '玩法', mobileLabel: '玩法', icon: <BookOpen size={21} />, mobileIcon: <BookOpen size={20} /> },
  { path: '/game/loveletter/me', title: '我的信件', desktopLabel: '我的', mobileLabel: '我的', icon: <UserRound size={21} />, mobileIcon: <UserRound size={20} /> },
];

export function LoveLetterMark({ size = 30 }: { size?: number }) {
  return <span className={styles.mark} style={{ width: size, height: size }}>
    <Mail size={Math.round(size * .52)} />
  </span>;
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
  const initials = Array.from(name.trim()).slice(0, 2).join('') || '信';
  return <GameAvatar
    className={styles.avatar}
    name={name}
    avatar={avatar}
    ai={ai}
    size={size}
    renderFallback={() => ai
      ? <Bot size={Math.round(size * .46)} />
      : <b>{initials}</b>}
  />;
}

function Brand() {
  return <><LoveLetterMark size={36} /><span className={styles.brandText}><b>掌心密信</b>
    <small>PALM LETTER · THE QUIET COURT</small></span></>;
}

export function AppShell({
  children,
  title,
  profile,
  inMatch = false,
  hideHeader = false,
  compactMobileFooter = false,
  tools,
}: {
  children: ReactNode;
  title: string;
  profile?: ShellProfile;
  inMatch?: boolean;
  hideHeader?: boolean;
  compactMobileFooter?: boolean;
  tools?: ReactNode;
}) {
  const rootClassName = [
    'loveletter-root',
    inMatch ? 'loveletter-match' : '',
    gameRoot.root,
  ].filter(Boolean).join(' ');
  return <GameAppShell
    rootClassName={rootClassName}
    classes={{
      shell: styles.shell,
      inMatch: styles.inMatch,
      hideHeader: styles.hideHeader,
      rail: styles.rail,
      monogram: styles.monogram,
      active: styles.active,
      railBottom: styles.railBottom,
      main: styles.main,
      header: styles.header,
      brand: styles.brandLink,
      brandLink: styles.brandLink,
      divider: styles.divider,
      breadcrumb: styles.breadcrumb,
      tools: styles.tools,
      environment: styles.environment,
      profile: styles.profile,
      content: styles.content,
      mobileNav: styles.mobileNav,
    }}
    basePath="/game/loveletter"
    navigation={navigation}
    title={title}
    profile={profile}
    inMatch={inMatch}
    hideHeader={hideHeader}
    compactMobileFooter={compactMobileFooter}
    tools={tools}
    renderMark={() => <LoveLetterMark />}
    renderBrand={() => <Brand />}
    renderAvatar={avatarProps => <PlayerAvatar {...avatarProps} />}
    showRailInMatch={false}
    showOnlineStatus={false}
    environmentLabel="在线"
    labels={{
      home: '掌心密信游戏大厅',
      navigation: '掌心密信导航',
      mobileNavigation: '掌心密信手机导航',
      profile: '个人资料',
      currentPlayer: '当前玩家',
    }}
  >{children}</GameAppShell>;
}
