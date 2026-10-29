import type { ReactNode } from 'react';
import { BookOpen, Bot, ChevronRight, LayoutGrid, Trophy, UserRound } from 'lucide-react';
import type { AuthProfile } from '@/features/game-core/api/auth';
import { GameAppShell } from '@/components/GameUI/GameAppShell';
import { GameAvatar } from '@/components/GameUI/GameAvatar';
import { ClickFeedback } from '@/components/GameUI/ClickFeedback';
import gameRoot from '@/components/GameUI/styles/root.module.less';
import rootStyles from '../../styles/root.module.less';
import styles from './index.module.less';

type ShellProfile = Pick<AuthProfile, 'name'> & {
  avatar?: AuthProfile['avatar'];
};

const navigation = [
  { path: '/game/davinci', title: '大厅', icon: <LayoutGrid size={20} /> },
  { path: '/game/davinci/rankings', title: '排行', icon: <Trophy size={20} /> },
  { path: '/game/davinci/guide', title: '玩法', icon: <BookOpen size={20} /> },
  { path: '/game/davinci/me', title: '我的', icon: <UserRound size={20} /> },
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
  return <GameAvatar className={styles.avatar} name={name} avatar={avatar} ai={ai} size={size}
    renderFallback={() => ai ? <Bot size={Math.round(size * .48)} /> : <b>{initials}</b>} />;
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
  return <GameAppShell
    rootClassName={`${gameRoot.root} ${rootStyles.root}`}
    classes={{
      shell: styles.shell,
      inMatch: styles.inMatch,
      hideHeader: styles.hideHeader,
      rail: styles.rail,
      monogram: styles.monogram,
      active: styles.active,
      railBottom: styles.railBottom,
      onlineDot: styles.onlineDot,
      main: styles.main,
      header: styles.header,
      brand: styles.brand,
      divider: styles.divider,
      breadcrumb: styles.breadcrumb,
      tools: styles.tools,
      environment: styles.environment,
      profile: styles.profile,
      content: styles.content,
      mobileNav: styles.mobileNav,
    }}
    basePath="/game/davinci"
    navigation={navigation}
    title={title}
    profile={profile}
    inMatch={inMatch}
    hideHeader={hideHeader}
    compactMobileFooter={compactMobileFooter}
    tools={tools}
    renderMark={() => <DavinciMark />}
    renderBrand={() => <Brand />}
    renderAvatar={avatarProps => <PlayerAvatar {...avatarProps} />}
    renderBreadcrumb={currentTitle => <><span>DAVINCI</span><ChevronRight size={12} /><b>{currentTitle}</b></>}
    renderFeedback={() => <ClickFeedback playSound={false} />}
    environmentLabel="在线版本"
    railAvatarSize={38}
    labels={{
      home: '达芬奇密码大厅',
      navigation: '达芬奇密码导航',
      mobileNavigation: '达芬奇密码手机导航',
      profile: '个人资料',
      currentPlayer: '当前玩家',
    }}
  >{children}</GameAppShell>;
}
