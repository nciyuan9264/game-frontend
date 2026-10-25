import { useState, type ReactNode } from 'react';
import {
  BookOpen, Bot, ChevronDown, LayoutGrid, Settings2, Trophy, UserRound,
} from 'lucide-react';
import type { AuthProfile } from '@/features/game-core/api/auth';
import { GameAppShell } from '@/components/GameUI/GameAppShell';
import { GameAvatar } from '@/components/GameUI/GameAvatar';
import { ActionButton } from '@/components/GameUI/ActionButton';
import gameRoot from '@/components/GameUI/styles/root.module.less';
import { Brand, BrandMark } from '../Artwork';
import { Dialog } from '../Dialog';
import { useYinshPreferences } from '../../hooks/useYinshPreferences';
import rootStyles from '../../styles/root.module.less';
import styles from './index.module.less';

type ShellProfile = Pick<AuthProfile, 'name'> & {
  avatar?: AuthProfile['avatar'];
};

const navigation = [
  { path: '/game/yinsh', title: '对局大厅', desktopLabel: '大厅', mobileLabel: '大厅', icon: <LayoutGrid size={21} />, mobileIcon: <LayoutGrid size={21} /> },
  { path: '/game/yinsh/rankings', title: '棋手排行', desktopLabel: '排行', mobileLabel: '排行', icon: <Trophy size={21} />, mobileIcon: <Trophy size={21} /> },
  { path: '/game/yinsh/guide', title: '玩法指南', desktopLabel: '玩法', mobileLabel: '玩法', icon: <BookOpen size={21} />, mobileIcon: <BookOpen size={21} /> },
  { path: '/game/yinsh/me', title: '我的棋谱', desktopLabel: '我的', mobileLabel: '我的', icon: <UserRound size={21} />, mobileIcon: <UserRound size={21} /> },
];

export function YinshMark() {
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
  tools,
}: {
  children: ReactNode;
  title: string;
  profile?: ShellProfile;
  inMatch?: boolean;
  hideHeader?: boolean;
  tools?: ReactNode;
}) {
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const preferences = useYinshPreferences();
  const rootClassName = [
    gameRoot.root,
    rootStyles.root,
    preferences.reduceMotion ? rootStyles.reduceMotion : '',
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
    basePath="/game/yinsh"
    navigation={navigation}
    title={title}
    profile={profile}
    inMatch={inMatch}
    hideHeader={hideHeader}
    tools={tools}
    renderMark={() => <YinshMark />}
    renderBrand={() => <Brand />}
    renderAvatar={avatarProps => <PlayerAvatar {...avatarProps} />}
    profileAccessory={<ChevronDown size={13} />}
    railAccessory={<button type="button" aria-label="显示偏好" title="显示偏好"
      onClick={() => setPreferencesOpen(true)}><Settings2 size={19} /></button>}
    showRailInMatch={false}
    showOnlineStatus={false}
    environmentLabel="在线"
    labels={{
      home: 'YINSH 圈套棋大厅',
      navigation: 'YINSH 导航',
      mobileNavigation: 'YINSH 手机导航',
      profile: '个人资料',
      currentPlayer: '当前玩家',
    }}
    renderFeedback={() => preferencesOpen ? <Dialog
      title="专注于你的下一步。"
      eyebrow="PLAYING PREFERENCES"
      onClose={() => setPreferencesOpen(false)}
      footer={<ActionButton variant="primary" onClick={() => setPreferencesOpen(false)}>完成</ActionButton>}
    >
      <div className={styles.preferences}>
        {[
          ['显示棋盘坐标', preferences.coordinates, preferences.setCoordinates],
          ['显示合法落点', preferences.hints, preferences.setHints],
          ['落子前确认', preferences.confirmMoves, preferences.setConfirmMoves],
          ['减少动态效果', preferences.reduceMotion, preferences.setReduceMotion],
        ].map(([label, value, setter]) => <div key={String(label)}>
          <span><b>{String(label)}</b><small>偏好只影响当前设备的显示与操作方式</small></span>
          <button type="button" role="switch" aria-label={String(label)}
            aria-checked={Boolean(value)} className={value ? styles.switchOn : ''}
            onClick={() => (setter as (next: boolean) => void)(!value)}><i /></button>
        </div>)}
      </div>
    </Dialog> : null}
  >{children}</GameAppShell>;
}
