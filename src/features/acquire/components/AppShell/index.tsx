import type { ReactNode } from 'react';
import { BookOpen, ChevronRight, LayoutGrid, Trophy, UserRound } from 'lucide-react';
import { GameAppShell } from '@/components/GameUI/GameAppShell';
import { GameAvatar } from '@/components/GameUI/GameAvatar';
import type { UserProfile } from '@/hooks/request/useProfile';
import { ClickFeedback } from '../ClickFeedback';
import rootStyles from '../../styles/root.module.less';
import styles from './index.module.less';

const navigation = [
  { path: '/game/acquire', title: '大厅', icon: <LayoutGrid size={21} />, mobileIcon: <LayoutGrid size={20} /> },
  { path: '/game/acquire/rankings', title: '排行', icon: <Trophy size={21} />, mobileIcon: <Trophy size={20} /> },
  { path: '/game/acquire/guide', title: '玩法', icon: <BookOpen size={21} />, mobileIcon: <BookOpen size={20} /> },
  { path: '/game/acquire/me', title: '我的', icon: <UserRound size={21} />, mobileIcon: <UserRound size={20} /> },
];
export function AcquireMark() {
  return <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
    <path d="m24 3 19 11v21L24 46 5 35V14L24 3Z" stroke="currentColor" strokeWidth="1.3" />
    <path d="m13 33 11-21 11 21h-6l-5-11-5 11h-6Z" fill="currentColor" />
    <path d="M19 31h10M24 4v5M24 39v6M6 15l6 3M36 30l6 4M6 34l6-4M37 18l5-3" stroke="currentColor" strokeWidth="1.2" />
  </svg>;
}
function AvatarArt({ variant, bot }: { variant: number; bot?: boolean }) {
  const colors = ['#d8a862', '#799fb5', '#90ac8d', '#c58372', '#a997bb', '#75afb0'];
  const color = colors[variant % colors.length];
  return <svg viewBox="0 0 64 64" aria-hidden="true">
    <circle cx="32" cy="32" r="31" fill="#162932" /><circle cx="32" cy="32" r="28" fill={color} opacity=".17" /><circle cx="32" cy="32" r="28" fill="none" stroke={color} opacity=".65" />
    {bot ? <g fill="none" stroke={color} strokeWidth="2"><path d="M31 20v-6m-3 0h6M17 28h-4v11h4m30-11h4v11h-4" /><rect x="18" y="22" width="28" height="24" rx="7" fill="#203941" /><rect x="23" y="29" width="18" height="8" rx="3" fill={color} /><path d="M26 42h12M28 31v3m8-3v3" /></g>
      : <g><path d="m15 16 14 9 6-1 14-8-4 27-13 10-15-12-2-25Z" fill={color} /><path d="m18 29 14 7 13-7-3 15-10 8-10-8-4-15Z" fill="#eedec1" /><path d="m15 16 3 14 8-7m23-7-3 14-8-7" fill="#526c69" /><path d="m28 38 4 5 4-5h-8Z" fill="#182730" /><circle cx="24" cy="32" r="2" fill="#182730" /><circle cx="40" cy="32" r="2" fill="#182730" /></g>}
    <circle cx="32" cy="32" r="31" fill="none" stroke={color} strokeWidth="1.5" />
  </svg>;
}
function Brand() {
  return <><AcquireMark /><span><b>ACQUIRE<sup>®</sup></b><small>MIDNIGHT BOARDROOM</small></span></>;
}
export function PlayerAvatar({ name, avatar, ai, size = 36 }: { name: string; avatar?: string; ai?: boolean; size?: number }) {
  const variant = ai ? 2 : Array.from(name).reduce((value, char) => value + (char.codePointAt(0) ?? 0), 0) % 6;
  return <GameAvatar className={styles.avatar} name={name} avatar={avatar} ai={ai} size={size}
    renderFallback={() => <AvatarArt variant={variant} bot={ai} />} />;
}
export function AppShell({ children, title, profile, inMatch = false, hideRail = false, hideHeader = false, tools }: {
  children: ReactNode; title: string; profile?: Pick<UserProfile, 'name' | 'avatar'>;
  inMatch?: boolean; hideRail?: boolean; hideHeader?: boolean; tools?: ReactNode;
}) {
  return <GameAppShell
    rootClassName={rootStyles.root}
    classes={{
      shell: styles.shell,
      inMatch: styles.inMatch,
      hideRail: styles.hideRail,
      hideHeader: styles.hideHeader,
      rail: styles.rail,
      monogram: styles.monogram,
      active: styles.active,
      railBottom: styles.railBottom,
      onlineDot: styles.onlineDot,
      main: styles.main,
      header: styles.header,
      brand: styles.brand,
      divider: styles.topDivider,
      breadcrumb: styles.breadcrumb,
      tools: styles.tools,
      environment: styles.environment,
      profile: styles.profile,
      matchProfile: styles.profile,
      profileName: styles.profileName,
      content: styles.content,
      mobileNav: styles.mobileNav,
    }}
    basePath="/game/acquire"
    navigation={navigation}
    title={title}
    profile={profile}
    inMatch={inMatch}
    hideRail={hideRail}
    hideHeader={hideHeader}
    tools={tools}
    renderMark={() => <AcquireMark />}
    renderBrand={() => <Brand />}
    renderAvatar={avatarProps => <PlayerAvatar {...avatarProps} />}
    renderBreadcrumb={currentTitle => <><span>ACQUIRE</span><ChevronRight size={12} /><b>{currentTitle}</b></>}
    renderFeedback={() => <ClickFeedback />}
    environmentLabel="在线版本"
    labels={{
      home: 'Acquire 游戏大厅',
      navigation: 'Acquire 导航',
      mobileNavigation: 'Acquire 手机导航',
      profile: '个人资料',
      currentPlayer: '当前玩家',
    }}
  >{children}</GameAppShell>;
}
