import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BookOpen,
  ChevronDown,
  Flag,
  LayoutGrid,
  Settings2,
  Swords,
} from 'lucide-react';
import type { AuthProfile } from '@/features/game-core/api/auth';
import { Brand, Crest } from '../visuals';
import '../styles/base.css';
import '../styles/mobile.css';
import '../styles/complete-base.css';
import '../styles/battle-motion.css';
import '../styles/product.css';

const navigation = [
  { path: '/game/warchest', label: '游戏大厅', short: '大厅', icon: LayoutGrid },
  { path: '/game/warchest/army', label: '兵种图鉴', short: '兵种', icon: Swords },
  { path: '/game/warchest/guide', label: '玩法指南', short: '玩法', icon: BookOpen },
  { path: '/game/warchest/me', label: '我的战绩', short: '战绩', icon: Flag },
] as const;

const isActive = (pathname: string, path: string) =>
  path === '/game/warchest'
    ? pathname === path
    : pathname.startsWith(path);

export function Shell({
  children,
  title,
  profile,
  compactMobileFooter = false,
}: {
  children: ReactNode;
  title: string;
  profile?: Pick<AuthProfile, 'name' | 'avatar'>;
  compactMobileFooter?: boolean;
}) {
  const location = useLocation();
  const initial = Array.from(profile?.name?.trim() || '将').slice(0, 1).join('');
  return <div className={`warchest-root app-shell ${compactMobileFooter ? 'compact-mobile-footer' : ''}`}>
    <aside className="sidebar">
      <Link className="side-emblem" aria-label="战争之匣首页" to="/game/warchest">
        <Crest size={43} />
      </Link>
      <nav aria-label="战争之匣导航">{navigation.map(item => {
        const Icon = item.icon;
        return <Link key={item.path} to={item.path}
          aria-current={isActive(location.pathname, item.path) ? 'page' : undefined}
          className={isActive(location.pathname, item.path) ? 'active' : ''}>
          <Icon size={21} strokeWidth={1.6} /><span>{item.short}</span>
        </Link>;
      })}</nav>
      <div className="side-tail"><span className="vertical-word">THE ART OF COMMAND</span>
        <Settings2 size={20} /><Link className="my-crest" to="/game/warchest/me">{initial}</Link>
      </div>
    </aside>
    <div className="app-top"><header className="app-header">
      <Link to="/game/warchest"><Brand /></Link><span className="header-divider" />
      <span className="breadcrumb">{title}</span><div className="header-space" />
      <span className="local-label"><i />服务端权威对局</span>
      <Link className="header-profile" to="/game/warchest/me">
        <span>{initial}</span><b>{profile?.name || '指挥官'}</b><ChevronDown size={13} />
      </Link>
    </header></div>
    {children}
    <footer className="app-footer"><span>WAR CHEST <i> / </i> 静默行军</span>
      <span>以谋略，见胜负。</span><small>双人完整基础版 · 在线权威规则</small></footer>
    <div className="mobile-bottom"><nav aria-label="战争之匣手机导航">{navigation.map(item => {
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
