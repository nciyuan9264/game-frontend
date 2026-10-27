import type { ReactNode } from 'react';
import {
  BookOpen,
  Bot,
  History,
  LayoutGrid,
  Trophy,
} from 'lucide-react';
import type { AuthProfile } from '@/features/game-core/api/auth';
import { GameAppShell } from '@/components/GameUI/GameAppShell';
import { GameAvatar } from '@/components/GameUI/GameAvatar';
import gameRoot from '@/components/GameUI/styles/root.module.less';
import '../../styles/root.css';
import '../../styles/pages.css';
import '../../styles/play.css';
import '../../styles/mobile-align.css';

type ShellProfile = Pick<AuthProfile, 'name'> & {
  avatar?: AuthProfile['avatar'];
};

const navigation = [
  { path: '/game/cantstop', title: '游戏大厅', desktopLabel: '大厅', mobileLabel: '大厅', icon: <LayoutGrid size={21} /> },
  { path: '/game/cantstop/rankings', title: '登顶排行', desktopLabel: '排行', mobileLabel: '排行', icon: <Trophy size={21} /> },
  { path: '/game/cantstop/guide', title: '玩法指南', desktopLabel: '玩法', mobileLabel: '玩法', icon: <BookOpen size={21} /> },
  { path: '/game/cantstop/me', title: '我的牌局', desktopLabel: '我的', mobileLabel: '我的', icon: <History size={21} /> },
] as const;

export function Bull({
  size = 22,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  return <svg className={className} width={size} height={size}
    viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <path d="M3 26h26L19 8l-5 8-3-5z" fill="currentColor" opacity=".92" />
    <path d="M19 8v15M19 9h7l-2 3 2 3h-7"
      stroke="var(--cs-bull-eye,#f7f3e9)" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 26l5-8 3 5 3-5 4 8"
      stroke="var(--cs-bull-eye,#f7f3e9)" strokeWidth="1.5"
      strokeLinecap="round" strokeLinejoin="round" opacity=".8" />
  </svg>;
}

export function CantStopMark({ size = 36 }: { size?: number }) {
  return <span className="cs-mark" style={{ width: size, height: size }}>
    <Bull size={Math.round(size * .57)} />
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
  const initials = Array.from(name.trim()).slice(-2).join('') || '山';
  return <GameAvatar
    className="cs-avatar"
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
  return <><CantStopMark /><span><b>CAN&apos;T STOP<span>.</span></b>
    <small>再 高 一 点</small></span></>;
}

const classes = {
  shell: 'cs-shell',
  inMatch: 'cs-in-match',
  hideHeader: 'cs-hide-header',
  rail: 'cs-rail',
  monogram: 'cs-monogram',
  active: 'cs-active',
  railBottom: 'cs-rail-bottom',
  main: 'cs-main',
  header: 'cs-header',
  brandLink: 'cs-brand-link',
  divider: 'cs-divider',
  breadcrumb: 'cs-breadcrumb',
  tools: 'cs-tools',
  environment: 'cs-environment',
  profile: 'cs-profile',
  content: 'cs-content',
  mobileNav: 'cs-mobile-nav',
};

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
    rootClassName={[
      'cantstop-root',
      inMatch ? 'cantstop-match' : '',
      gameRoot.root,
    ].filter(Boolean).join(' ')}
    classes={classes}
    basePath="/game/cantstop"
    navigation={navigation}
    title={title}
    profile={profile}
    inMatch={inMatch}
    hideHeader={hideHeader}
    compactMobileFooter={compactMobileFooter}
    tools={tools}
    renderMark={() => <CantStopMark />}
    renderBrand={() => <Brand />}
    renderAvatar={avatarProps => <PlayerAvatar {...avatarProps} />}
    showRailInMatch={false}
    showOnlineStatus={false}
    environmentLabel="在线"
    labels={{
      home: "CAN'T STOP 游戏大厅",
      navigation: "CAN'T STOP 导航",
      mobileNavigation: "CAN'T STOP 手机导航",
      profile: '个人资料',
      currentPlayer: '当前玩家',
    }}
  >{children}</GameAppShell>;
}
