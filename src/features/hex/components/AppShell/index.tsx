import type { ReactNode } from 'react';
import {
  BookOpen, Bot, ChevronDown, LayoutGrid, Trophy, UserRound,
} from 'lucide-react';
import type { AuthProfile } from '@/features/game-core/api/auth';
import { GameAppShell } from '@/components/GameUI/GameAppShell';
import { GameAvatar } from '@/components/GameUI/GameAvatar';
import gameRoot from '@/components/GameUI/styles/root.module.less';
import { Brand, BrandMark } from '../Artwork';
import rootStyles from '../../styles/root.module.less';
import styles from './index.module.less';
import '../../styles/showcase.css';

type ShellProfile = Pick<AuthProfile, 'name'> & {
  avatar?: AuthProfile['avatar'];
};

const navigation = [
  { path: '/game/hex', title: '对局大厅', desktopLabel: '大厅', mobileLabel: '大厅', icon: <LayoutGrid size={21} />, mobileIcon: <LayoutGrid size={21} /> },
  { path: '/game/hex/rankings', title: '棋手排行', desktopLabel: '排行', mobileLabel: '排行', icon: <Trophy size={21} />, mobileIcon: <Trophy size={21} /> },
  { path: '/game/hex/guide', title: '玩法指南', desktopLabel: '玩法', mobileLabel: '玩法', icon: <BookOpen size={21} />, mobileIcon: <BookOpen size={21} /> },
  { path: '/game/hex/me', title: '我的棋谱', desktopLabel: '我的', mobileLabel: '我的', icon: <UserRound size={21} />, mobileIcon: <UserRound size={21} /> },
];

export function HexMark() {
  return <BrandMark size={30} />;
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
  const initials = Array.from(name.trim()).slice(0, 2).join('').toUpperCase() || '棋';
  return <GameAvatar
    className={styles.avatar}
    name={name}
    avatar={avatar}
    ai={ai}
    size={size}
    renderFallback={() => ai ? <Bot size={Math.round(size * .46)} /> : <b>{initials}</b>}
  />;
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
    'hex-root',
    inMatch ? 'focus-page' : '',
    inMatch && hideHeader ? 'playing-page' : '',
    gameRoot.root,
    rootStyles.root,
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
      brandLink: styles.brandLink,
      divider: styles.divider,
      breadcrumb: styles.breadcrumb,
      tools: styles.tools,
      environment: styles.environment,
      profile: styles.profile,
      content: styles.content,
      mobileNav: styles.mobileNav,
    }}
    basePath="/game/hex"
    navigation={navigation}
    title={title}
    profile={profile}
    inMatch={inMatch}
    hideHeader={hideHeader}
    compactMobileFooter={compactMobileFooter}
    tools={tools}
    renderMark={() => <HexMark />}
    renderBrand={() => <Brand />}
    renderAvatar={avatarProps => <PlayerAvatar {...avatarProps} />}
    profileAccessory={<ChevronDown size={13} />}
    showRailInMatch={false}
    showOnlineStatus={false}
    environmentLabel="在线"
    labels={{
      home: 'HEX 连边棋大厅',
      navigation: 'HEX 导航',
      mobileNavigation: 'HEX 手机导航',
      profile: '个人资料',
      currentPlayer: '当前玩家',
    }}
  >{children}</GameAppShell>;
}
