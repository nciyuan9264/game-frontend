import type { ReactNode } from 'react';
import {
  BookOpen,
  Home,
  LayoutGrid,
  Trophy,
  UserRound,
} from 'lucide-react';
import type { AuthProfile } from '@/features/game-core/api/auth';
import { GameAppShell } from '@/components/GameUI/GameAppShell';
import gameRoot from '@/components/GameUI/styles/root.module.less';
import { PlayerAvatar } from './GamePieces';
import '../styles.css';

type ShellProfile = Pick<AuthProfile, 'name'> & {
  avatar?: AuthProfile['avatar'];
};

const navigation = [
  { path: '/game/forsale', title: '游戏大厅', desktopLabel: '大厅', mobileLabel: '大厅', icon: <LayoutGrid size={21} /> },
  { path: '/game/forsale/rankings', title: '财富排行', desktopLabel: '排行', mobileLabel: '排行', icon: <Trophy size={21} /> },
  { path: '/game/forsale/guide', title: '玩法指南', desktopLabel: '玩法', mobileLabel: '玩法', icon: <BookOpen size={21} /> },
  { path: '/game/forsale/me', title: '我的对局', desktopLabel: '我的', mobileLabel: '我的', icon: <UserRound size={21} /> },
];

export const ForSaleMark = ({ size = 34 }: { size?: number }) =>
  <span className="fs-mark" style={{ width: size, height: size }}>
    <Home size={Math.round(size * .55)} />
  </span>;

const Brand = () => <><ForSaleMark /><span><b>For Sale<em>.</em></b>
  <small>周 末 拍 卖 所</small></span></>;

export const AppShell = ({
  children,
  title,
  profile,
  inMatch = false,
  hideHeader = false,
  compactMobileFooter = false,
}: {
  children: ReactNode;
  title: string;
  profile?: ShellProfile;
  inMatch?: boolean;
  hideHeader?: boolean;
  compactMobileFooter?: boolean;
}) => <GameAppShell
  rootClassName={`forsale-root ${inMatch ? 'forsale-match' : ''} ${gameRoot.root}`}
  classes={{
    shell: 'fs-shell',
    inMatch: 'fs-in-match',
    hideHeader: 'fs-hide-header',
    rail: 'fs-rail',
    monogram: 'fs-monogram',
    active: 'fs-active',
    railBottom: 'fs-rail-bottom',
    main: 'fs-main',
    header: 'fs-header',
    brand: 'fs-brand',
    brandLink: 'fs-brand',
    divider: 'fs-divider',
    breadcrumb: 'fs-breadcrumb',
    tools: 'fs-tools',
    environment: 'fs-environment',
    profile: 'fs-profile',
    content: 'fs-content',
    mobileNav: 'fs-mobile-nav',
  }}
  basePath="/game/forsale"
  navigation={navigation}
  title={title}
  profile={profile}
  inMatch={inMatch}
  hideHeader={hideHeader}
  compactMobileFooter={compactMobileFooter}
  renderMark={() => <ForSaleMark />}
  renderBrand={() => <Brand />}
  renderAvatar={props => <PlayerAvatar {...props} />}
  showRailInMatch={false}
  showOnlineStatus={false}
  environmentLabel="在线"
  labels={{
    home: 'For Sale 游戏大厅',
    navigation: 'For Sale 导航',
    mobileNavigation: 'For Sale 手机导航',
    profile: '个人资料',
    currentPlayer: '当前玩家',
  }}
>{children}</GameAppShell>;
