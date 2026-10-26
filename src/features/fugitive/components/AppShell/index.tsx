import { useState, type ReactNode } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronDown,
  LayoutGrid,
  Route,
  Settings2,
  Trophy,
  UserRound,
} from 'lucide-react';
import type { AuthProfile } from '@/features/game-core/api/auth';
import { useFugitivePreferences } from '../../hooks/useFugitivePreferences';
import { Brand, Modal } from '../Visual';
import styles from '../../styles.module.less';

const navigation = [
  {
    path: '/game/fugitive',
    title: '游戏大厅',
    short: '大厅',
    icon: LayoutGrid,
  },
  {
    path: '/game/fugitive/rankings',
    title: '排行榜',
    short: '排行',
    icon: Trophy,
  },
  {
    path: '/game/fugitive/guide',
    title: '玩法指南',
    short: '玩法',
    icon: BookOpen,
  },
  {
    path: '/game/fugitive/me',
    title: '我的档案',
    short: '我的',
    icon: UserRound,
  },
] as const;

export function FugitiveRoot({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`${styles.fugitiveRoot} ${className}`}>
    {children}
  </div>;
}

export function ProfileMonogram({
  profile,
  className = '',
}: {
  profile?: Pick<AuthProfile, 'name'> & { avatar?: AuthProfile['avatar'] };
  className?: string;
}) {
  const value = Array.from(profile?.name.trim() || '追').slice(0, 1).join('');
  return <span className={`${className} profile-monogram`} aria-hidden="true">
    {profile?.avatar
      ? <img src={profile.avatar} alt="" referrerPolicy="no-referrer" />
      : value}
  </span>;
}

export function AppShell({
  children,
  title,
  profile,
  room = false,
  compactMobileFooter = false,
}: {
  children: ReactNode;
  title: string;
  profile?: AuthProfile;
  room?: boolean;
  compactMobileFooter?: boolean;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const preferences = useFugitivePreferences();

  return <FugitiveRoot className={preferences.className}>
    <div className={`app ${room ? 'waiting-app' : ''}`}>
      <div className={`app-underlay ${compactMobileFooter ? 'compact-mobile-footer' : ''}`}
        aria-hidden={preferencesOpen}>
        {!room && <aside className="side-nav">
          <NavLink className="rail-logo" to="/game/fugitive" aria-label="Fugitive 大厅">
            <Route size={27} />
          </NavLink>
          <nav aria-label="Fugitive 导航">{navigation.map(item => {
            const active = item.path === '/game/fugitive'
              ? location.pathname === item.path
              : location.pathname.startsWith(item.path);
            return <button key={item.path} type="button"
              aria-label={item.title} aria-current={active ? 'page' : undefined}
              className={active ? 'active' : ''}
              onClick={() => navigate(item.path)}>
              <item.icon size={20} /><span>{item.short}</span>
            </button>;
          })}</nav>
          <div className="rail-bottom">
            <button className="icon-button" type="button" aria-label="显示偏好"
              onClick={() => setPreferencesOpen(true)}><Settings2 size={19} /></button>
            <NavLink className="rail-avatar" to="/game/fugitive/me"
              aria-label="我的追逃档案"><ProfileMonogram profile={profile} /></NavLink>
          </div>
        </aside>}
        <div className="topbar">
          <header className="app-header">
            {room && <button className="icon-button" type="button" aria-label="返回大厅"
              onClick={() => navigate('/game/fugitive')}><ArrowLeft size={20} /></button>}
            <Brand /><span className="header-line" /><span className="breadcrumb">{title}</span>
            <span className="spacer" /><span className="local-label"><i />在线</span>
            <button className="header-person" type="button" aria-label="打开追逃档案"
              onClick={() => navigate('/game/fugitive/me')}>
              <ProfileMonogram profile={profile} />
              <b>{profile?.name || '城市追踪者'}</b><ChevronDown size={14} />
            </button>
          </header>
        </div>
        {children}
        {!room && <><footer className="app-footer">
          <span><Route size={13} />FUGITIVE — THE MIDNIGHT RUN</span>
          <span>二版基础规则 · 服务端权威对局</span>
        </footer>
        <div className="mobile-nav-wrap"><nav aria-label="Fugitive 手机导航">
          {navigation.map(item => {
            const active = item.path === '/game/fugitive'
              ? location.pathname === item.path
              : location.pathname.startsWith(item.path);
            return <button key={item.path} type="button"
              aria-label={item.title} aria-current={active ? 'page' : undefined}
              className={active ? 'active' : ''}
              onClick={() => navigate(item.path)}>
              <item.icon size={21} /><span>{item.short}</span>
            </button>;
          })}
        </nav></div></>}
      </div>
      {preferencesOpen && <Modal title="让行动更顺手。" kicker="DISPLAY PREFERENCES"
        onClose={() => setPreferencesOpen(false)}
        footer={<button className="button primary full" type="button"
          onClick={() => setPreferencesOpen(false)}>完成<Check size={16} /></button>}>
        <div className="preference-row"><div><h3>更清晰的文字</h3>
          <p>提高辅助文字对比度，牌桌同步生效。</p></div>
          <button type="button" role="switch" aria-label="更清晰的文字"
            aria-checked={preferences.contrast}
            className={`switch ${preferences.contrast ? 'on' : ''}`}
            onClick={() => preferences.setContrast(!preferences.contrast)}><span /></button>
        </div>
        <div className="preference-row"><div><h3>减少动效</h3>
          <p>关闭卡牌位移和装饰动画。</p></div>
          <button type="button" role="switch" aria-label="减少动效"
            aria-checked={preferences.reduced}
            className={`switch ${preferences.reduced ? 'on' : ''}`}
            onClick={() => preferences.setReduced(!preferences.reduced)}><span /></button>
        </div>
        <p className="notice">偏好只保存在当前浏览器。手牌、暗置路线和抽牌信息始终由服务端按身份隔离。</p>
      </Modal>}
    </div>
  </FugitiveRoot>;
}
