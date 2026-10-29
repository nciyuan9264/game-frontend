import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BookOpen,
  ChevronDown,
  Flag,
  Home,
  LayoutGrid,
  Swords,
  Trophy,
  UserRound,
} from 'lucide-react';
import { GameAvatar } from '@/components/GameUI/GameAvatar';
import type { AuthProfile } from '@/features/game-core/api/auth';
import { Brand, Crest } from '../visuals';
import '../styles/base.css';
import '../styles/mobile.css';
import '../styles/complete-base.css';
import '../styles/battle-motion.css';
import '../styles/product.css';

const desktopNavigation = [
  { path: '/game/warchest', label: '游戏大厅', short: '大厅', icon: LayoutGrid },
  { path: '/game/warchest/army', label: '兵种图鉴', short: '兵种', icon: Swords },
  { path: '/game/warchest/guide', label: '玩法指南', short: '玩法', icon: BookOpen },
  { path: '/game/warchest/me', label: '我的战绩', short: '战绩', icon: Flag },
] as const;

const mobileNavigation = [
  { path: '/game/warchest', label: '游戏大厅', short: '大厅', icon: LayoutGrid },
  { path: '/game/warchest/rankings', label: '指挥官排行', short: '排行', icon: Trophy },
  { path: '/game/warchest/guide', label: '玩法指南', short: '玩法', icon: BookOpen },
  { path: '/game/warchest/me', label: '我的战绩', short: '我的', icon: UserRound },
] as const;

const isActive = (pathname: string, path: string) =>
  path === '/game/warchest'
    ? pathname === path
    : pathname.startsWith(path);

export function PlayerAvatar({
  name,
  avatar,
  size = 36,
  className = '',
}: {
  name: string;
  avatar?: string;
  size?: number;
  className?: string;
}) {
  const initial = Array.from(name.trim() || '将').slice(0, 1).join('');
  return <GameAvatar
    className={`crest user-avatar ${className}`.trim()}
    name={name}
    avatar={avatar}
    size={size}
    renderFallback={() => initial}
  />;
}

export function Shell({
  children,
  title,
  profile,
  inMatch = false,
  compactMobileFooter = false,
}: {
  children: ReactNode;
  title: string;
  profile?: Pick<AuthProfile, 'name' | 'avatar'>;
  inMatch?: boolean;
  compactMobileFooter?: boolean;
}) {
  const location = useLocation();
  const profileName = profile?.name || '指挥官';
  return <div className={`warchest-root app-shell ${compactMobileFooter ? 'compact-mobile-footer' : ''}`}
    data-game-shell={inMatch ? 'match' : 'app'}>
    <aside className="sidebar">
      <Link className="side-emblem" aria-label="战争之匣首页" to="/game/warchest">
        <Crest size={43} />
      </Link>
      <nav aria-label="战争之匣导航">{desktopNavigation.map(item => {
        const Icon = item.icon;
        return <Link key={item.path} to={item.path}
          aria-current={isActive(location.pathname, item.path) ? 'page' : undefined}
          className={isActive(location.pathname, item.path) ? 'active' : ''}>
          <Icon size={21} strokeWidth={1.6} /><span>{item.short}</span>
        </Link>;
      })}</nav>
      <div className="side-tail"><span className="vertical-word">THE ART OF COMMAND</span>
        <Link className="my-profile-link" to="/game/warchest/me" aria-label="我的战绩">
          <PlayerAvatar className="my-crest" name={profileName}
            avatar={profile?.avatar} size={33} />
        </Link>
      </div>
    </aside>
    <div className="app-top"><header className="app-header" data-game-shell-header>
      <Link to="/game/warchest"><Brand /></Link><span className="header-divider" />
      <span className="breadcrumb">{title}</span><div className="header-space" />
      <span className="local-label"><i />服务端权威对局</span>
      <Link className="header-home icon-button" to="/" data-game-shell-platform-home
        aria-label="返回游戏首页" title="返回游戏首页">
        <Home size={18} strokeWidth={1.8} />
      </Link>
      <Link className="header-profile" to="/game/warchest/me" data-game-shell-profile>
        <PlayerAvatar name={profileName} avatar={profile?.avatar} size={31} />
        <b>{profileName}</b><ChevronDown size={13} />
      </Link>
    </header></div>
    {children}
    <footer className="app-footer"><span>WAR CHEST <i> / </i> 静默行军</span>
      <span>以谋略，见胜负。</span><small>双人完整基础版 · 在线权威规则</small></footer>
    <div className="mobile-bottom"><nav aria-label="战争之匣手机导航">{mobileNavigation.map(item => {
      const Icon = item.icon;
      return <Link key={item.path} to={item.path}
        aria-current={isActive(location.pathname, item.path) ? 'page' : undefined}
        className={isActive(location.pathname, item.path) ? 'active' : ''}>
        <Icon size={21} /><span>{item.short}</span>
      </Link>;
    })}</nav></div>
  </div>;
}

export function Loading({ text = '正在整理战场。' }: { text?: string }) {
  return <div className="warchest-loading" role="status"><Crest size={58} />
    <span>WAR CHEST</span><h2>{text}</h2><i /></div>;
}

export function Notice({
  children,
  error = false,
}: {
  children: ReactNode;
  error?: boolean;
}) {
  return <div className={`warchest-notice ${error ? 'is-error' : ''}`}>{children}</div>;
}
