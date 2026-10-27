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

type ShellProfile = Pick<AuthProfile, 'name'> & {
  avatar?: AuthProfile['avatar'];
};

const navigation = [
  { path: '/game/sixnimmt', title: '游戏大厅', desktopLabel: '大厅', mobileLabel: '大厅', icon: <LayoutGrid size={21} /> },
  { path: '/game/sixnimmt/rankings', title: '牛头排行', desktopLabel: '排行', mobileLabel: '排行', icon: <Trophy size={21} /> },
  { path: '/game/sixnimmt/guide', title: '玩法指南', desktopLabel: '玩法', mobileLabel: '玩法', icon: <BookOpen size={21} /> },
  { path: '/game/sixnimmt/me', title: '我的牌局', desktopLabel: '我的', mobileLabel: '我的', icon: <History size={21} /> },
] as const;

export function Bull({
  size = 22,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  return <svg className={className} width={size} height={size}
    viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
    <path d="M6.5 12C2 12 1 7.5 2.5 3.5 3.5 8 6.5 8.5 10 8l2-2h8l2 2c3.5.5 6.5 0 7.5-4.5C31 7.5 30 12 25.5 12l-2.2 2.5-.8 8.5c-.3 4-3 6-6.5 6s-6.2-2-6.5-6l-.8-8.5z" />
    <path d="M11 13l-5 1 3 4M21 13l5 1-3 4"
      stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    <circle cx="13" cy="20.5" r="1.15" fill="var(--sn-bull-eye,#f7f3e9)" />
    <circle cx="19" cy="20.5" r="1.15" fill="var(--sn-bull-eye,#f7f3e9)" />
  </svg>;
}

export function SixNimmtMark({ size = 36 }: { size?: number }) {
  return <span className="sn-mark" style={{ width: size, height: size }}>
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
  const initials = Array.from(name.trim()).slice(-2).join('') || '牛';
  return <GameAvatar
    className="sn-avatar"
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
  return <><SixNimmtMark /><span><b>6 nimmt<span>!</span></b>
    <small>别 做 第 六 个</small></span></>;
}

const classes = {
  shell: 'sn-shell',
  inMatch: 'sn-in-match',
  hideHeader: 'sn-hide-header',
  rail: 'sn-rail',
  monogram: 'sn-monogram',
  active: 'sn-active',
  railBottom: 'sn-rail-bottom',
  main: 'sn-main',
  header: 'sn-header',
  brand: 'sn-brand',
  brandLink: 'sn-brand-link',
  divider: 'sn-divider',
  breadcrumb: 'sn-breadcrumb',
  tools: 'sn-tools',
  environment: 'sn-environment',
  profile: 'sn-profile',
  content: 'sn-content',
  mobileNav: 'sn-mobile-nav',
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
      'sixnimmt-root',
      inMatch ? 'sixnimmt-match' : '',
      gameRoot.root,
    ].filter(Boolean).join(' ')}
    classes={classes}
    basePath="/game/sixnimmt"
    navigation={navigation}
    title={title}
    profile={profile}
    inMatch={inMatch}
    hideHeader={hideHeader}
    compactMobileFooter={compactMobileFooter}
    tools={tools}
    renderMark={() => <SixNimmtMark />}
    renderBrand={() => <Brand />}
    renderAvatar={avatarProps => <PlayerAvatar {...avatarProps} />}
    showRailInMatch={false}
    showOnlineStatus={false}
    environmentLabel="在线"
    labels={{
      home: '6 nimmt! 游戏大厅',
      navigation: '6 nimmt! 导航',
      mobileNavigation: '6 nimmt! 手机导航',
      profile: '个人资料',
      currentPlayer: '当前玩家',
    }}
  >{children}</GameAppShell>;
}
