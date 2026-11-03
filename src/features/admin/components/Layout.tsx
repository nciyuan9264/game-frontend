import type { ReactNode } from 'react';
import {
  Activity,
  BarChart3,
  Gamepad2,
  History,
  LayoutDashboard,
  LogOut,
  UserRound,
  Users,
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import type { AuthProfile } from '@/features/game-core/api/auth';
import styles from '../index.module.less';

const navigation = [
  { to: '/admin', label: '总览', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: '用户', icon: Users },
  { to: '/admin/games', label: '游戏', icon: BarChart3 },
  { to: '/admin/matches', label: '对局', icon: History },
  { to: '/admin/live', label: '实时', icon: Activity },
] as const;

const titles: Record<string, string> = {
  '/admin': '数据总览',
  '/admin/users': '用户活跃',
  '/admin/games': '游戏分析',
  '/admin/matches': '对局记录',
  '/admin/live': '实时概况',
};

export function AdminLayout({ profile, children }: { profile: AuthProfile; children: ReactNode }) {
  const location = useLocation();
  const title = location.pathname.startsWith('/admin/users/')
    ? '用户详情'
    : titles[location.pathname] ?? '运营后台';
  const profileURL = `https://auth.gamebus.online/profile?redirect=${encodeURIComponent(window.location.href)}`;

  return (
    <div className={styles.adminRoot}>
      <aside className={styles.sidebar}>
        <NavLink className={styles.brand} to="/admin">
          <Gamepad2 size={24} />
          <span><strong>GameBus</strong><small>运营后台</small></span>
        </NavLink>
        <nav aria-label="后台导航">
          {navigation.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={'end' in item ? item.end : false}
                className={({ isActive }) => isActive ? styles.activeNav : undefined}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
        <div className={styles.sidebarFooter}>
          <a href={profileURL}>
            <UserRound size={18} />
            <span>{profile.displayName || profile.email}</span>
          </a>
          <a href="/">
            <LogOut size={18} />
            <span>返回游戏</span>
          </a>
        </div>
      </aside>
      <div className={styles.workspace}>
        <header className={styles.topbar}>
          <div>
            <small>ADMIN CONSOLE</small>
            <h1>{title}</h1>
          </div>
          <span className={styles.readonlyBadge}>只读</span>
        </header>
        <main className={styles.adminMain}>{children}</main>
      </div>
    </div>
  );
}
