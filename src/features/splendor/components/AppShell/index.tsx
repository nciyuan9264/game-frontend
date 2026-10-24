import { useState, type ReactNode } from 'react';
import {
  BookOpen, Bot, ChevronDown, LayoutGrid, Settings2, Trophy, UserRound,
} from 'lucide-react';
import type { AuthProfile } from '@/features/game-core/api/auth';
import { GameAppShell } from '@/components/GameUI/GameAppShell';
import { GameAvatar } from '@/components/GameUI/GameAvatar';
import { ClickFeedback } from '@/components/GameUI/ClickFeedback';
import { ActionButton } from '@/components/GameUI/ActionButton';
import gameRoot from '@/components/GameUI/styles/root.module.less';
import { BrandMark } from '../Artwork';
import { Dialog } from '../Dialog';
import { useSplendorPreferences } from '../../hooks/useSplendorPreferences';
import rootStyles from '../../styles/root.module.less';
import styles from './index.module.less';

type ShellProfile = Pick<AuthProfile, 'name'> & {
  avatar?: AuthProfile['avatar'];
};

const navigation = [
  { path: '/game/splendor', title: '游戏大厅', desktopLabel: '大厅', mobileLabel: '大厅', icon: <LayoutGrid size={21} strokeWidth={1.6} />, mobileIcon: <LayoutGrid size={21} /> },
  { path: '/game/splendor/rankings', title: '收藏家榜', desktopLabel: '排行', mobileLabel: '排行', icon: <Trophy size={21} strokeWidth={1.6} />, mobileIcon: <Trophy size={21} /> },
  { path: '/game/splendor/guide', title: '玩法指南', desktopLabel: '玩法', mobileLabel: '玩法', icon: <BookOpen size={21} strokeWidth={1.6} />, mobileIcon: <BookOpen size={21} /> },
  { path: '/game/splendor/me', title: '我的收藏', desktopLabel: '我的', mobileLabel: '我的', icon: <UserRound size={21} strokeWidth={1.6} />, mobileIcon: <UserRound size={21} /> },
];

export function SplendorMark() {
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
  const initials = Array.from(name.trim()).slice(0, 2).join('').toUpperCase() || 'P';
  return <GameAvatar className={styles.avatar} name={name} avatar={avatar} ai={ai} size={size}
    renderFallback={() => ai ? <Bot size={Math.round(size * .46)} /> : <b>{initials}</b>} />;
}

function Brand({ small = false }: { small?: boolean }) {
  return <span className={`${styles.brand} ${small ? styles.brandSmall : ''}`}>
    <BrandMark size={small ? 25 : 28} />
    <span><strong>SPLENDOR</strong><small>璀 璨 宝 石 · 商 会</small></span>
  </span>;
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
  const preferences = useSplendorPreferences();
  const rootClassName = [
    gameRoot.root,
    rootStyles.root,
    preferences.highContrast ? rootStyles.highContrast : '',
    preferences.reduceMotion ? rootStyles.reduceMotion : '',
  ].filter(Boolean).join(' ');

  const preferenceButton = <button type="button" aria-label="显示偏好" title="显示偏好"
    onClick={() => setPreferencesOpen(true)}><Settings2 size={19} /></button>;
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
    basePath="/game/splendor"
    navigation={navigation}
    title={title}
    profile={profile}
    inMatch={inMatch}
    hideHeader={hideHeader}
    tools={tools}
    renderMark={() => <SplendorMark />}
    renderBrand={() => <Brand />}
    renderAvatar={avatarProps => <PlayerAvatar {...avatarProps} />}
    profileAccessory={<ChevronDown size={13} />}
    railAccessory={preferenceButton}
    renderFeedback={() => <>{preferencesOpen && <Dialog title="让收藏，更顺手。" eyebrow="MAKE YOURSELF AT HOME"
      onClose={() => setPreferencesOpen(false)}
      footer={<ActionButton variant="primary" onClick={() => setPreferencesOpen(false)}>完成</ActionButton>}>
      <div className={styles.preference}>
        <div><span><b>更清晰的文字</b><small>提高辅助文字的对比度</small></span>
          <button type="button" role="switch" aria-label="更清晰的文字"
            aria-checked={preferences.highContrast} className={preferences.highContrast ? styles.switchOn : ''}
            onClick={() => preferences.setHighContrast(!preferences.highContrast)}><i /></button></div>
        <div><span><b>减少动效</b><small>关闭位移与装饰动画</small></span>
          <button type="button" role="switch" aria-label="减少动效"
            aria-checked={preferences.reduceMotion} className={preferences.reduceMotion ? styles.switchOn : ''}
            onClick={() => preferences.setReduceMotion(!preferences.reduceMotion)}><i /></button></div>
        <p>宝石始终使用颜色、形状和数量共同编码。</p>
      </div>
    </Dialog>}<ClickFeedback /></>}
    showRailInMatch={false}
    showOnlineStatus={false}
    environmentLabel="在线"
    railAvatarSize={37}
    headerAvatarSize={32}
    labels={{
      home: '璀璨宝石大厅',
      navigation: '璀璨宝石导航',
      mobileNavigation: '璀璨宝石手机导航',
      profile: '个人资料',
      currentPlayer: '当前玩家',
    }}
  >{children}</GameAppShell>;
}
