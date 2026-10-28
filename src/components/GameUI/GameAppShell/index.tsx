import type { ReactNode } from 'react';
import { Home } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import layoutStyles from './index.module.less';

export interface GameShellNavigationItem {
  path: string;
  title: string;
  icon: ReactNode;
  mobileIcon?: ReactNode;
  desktopLabel?: ReactNode;
  mobileLabel?: ReactNode;
}

export interface GameShellProfile {
  name: string;
  avatar?: string;
}

export interface GameAppShellClasses {
  shell?: string;
  inMatch?: string;
  hideRail?: string;
  hideHeader?: string;
  rail?: string;
  monogram?: string;
  active?: string;
  railBottom?: string;
  onlineDot?: string;
  main?: string;
  header?: string;
  brand?: string;
  brandLink?: string;
  divider?: string;
  breadcrumb?: string;
  tools?: string;
  environment?: string;
  profile?: string;
  matchProfile?: string;
  profileName?: string;
  content?: string;
  mobileNav?: string;
}

interface AvatarRenderProps extends GameShellProfile {
  size: number;
  location: 'rail' | 'header';
}

export interface GameAppShellProps {
  children: ReactNode;
  rootClassName?: string;
  classes: GameAppShellClasses;
  basePath: string;
  navigation: readonly GameShellNavigationItem[];
  title: string;
  profile?: GameShellProfile;
  inMatch?: boolean;
  hideRail?: boolean;
  hideHeader?: boolean;
  compactMobileFooter?: boolean;
  tools?: ReactNode;
  renderMark: () => ReactNode;
  renderBrand: () => ReactNode;
  renderAvatar: (props: AvatarRenderProps) => ReactNode;
  renderProfileLabel?: (profile: GameShellProfile) => ReactNode;
  profileAccessory?: ReactNode;
  renderBreadcrumb?: (title: string) => ReactNode;
  railAccessory?: ReactNode;
  renderFeedback?: () => ReactNode;
  showRailInMatch?: boolean;
  showOnlineStatus?: boolean;
  environmentLabel?: string;
  labels: {
    home: string;
    navigation: string;
    mobileNavigation: string;
    profile: string;
    currentPlayer: string;
    platformHome?: string;
  };
  railAvatarSize?: number;
  headerAvatarSize?: number;
}

export function GameAppShell({
  children,
  rootClassName,
  classes,
  basePath,
  navigation,
  title,
  profile,
  inMatch = false,
  hideRail = false,
  hideHeader = false,
  compactMobileFooter = false,
  tools,
  renderMark,
  renderBrand,
  renderAvatar,
  renderProfileLabel = currentProfile => currentProfile.name,
  profileAccessory,
  renderBreadcrumb = currentTitle => currentTitle,
  railAccessory,
  renderFeedback,
  showRailInMatch = true,
  showOnlineStatus = true,
  environmentLabel,
  labels,
  railAvatarSize = 40,
  headerAvatarSize = 36,
}: GameAppShellProps) {
  const shellClassName = [
    rootClassName,
    classes.shell,
    inMatch ? classes.inMatch : '',
    hideRail ? classes.hideRail : '',
    hideHeader ? classes.hideHeader : '',
    compactMobileFooter ? layoutStyles.compactMobileShell : '',
  ].filter(Boolean).join(' ');
  const showRail = !hideRail && (!inMatch || showRailInMatch);
  const fallbackProfile = profile ?? { name: '玩家' };

  return <div className={shellClassName}>
    {showRail && <aside className={classes.rail}>
      {inMatch
        ? <span className={classes.monogram}>{renderMark()}</span>
        : <Link className={classes.monogram} to={basePath} aria-label={labels.home}>{renderMark()}</Link>}
      {!inMatch && <nav aria-label={labels.navigation}>
        {navigation.slice(0, 3).map(item => <NavLink
          key={item.path}
          to={item.path}
          end
          title={item.title}
          className={({ isActive }) => isActive ? classes.active ?? '' : ''}
        >
          {item.icon}<span>{item.desktopLabel ?? item.title}</span>
        </NavLink>)}
      </nav>}
      <div className={classes.railBottom}>
        {railAccessory}
        {showOnlineStatus && <span className={classes.onlineDot} />}
        {inMatch
          ? <span aria-label={labels.currentPlayer}>{renderAvatar({
            ...fallbackProfile,
            size: railAvatarSize,
            location: 'rail',
          })}</span>
          : <Link to={`${basePath}/me`} aria-label={labels.profile}>{renderAvatar({
            ...fallbackProfile,
            size: railAvatarSize,
            location: 'rail',
          })}</Link>}
      </div>
    </aside>}
    <div className={[
      classes.main,
      compactMobileFooter ? layoutStyles.compactMobileShell : '',
    ].filter(Boolean).join(' ')}>
      {!hideHeader && <header className={classes.header}>
        {inMatch
          ? <span className={classes.brand}>{renderBrand()}</span>
          : <Link
            to={basePath}
            className={classes.brandLink ?? classes.brand}
            aria-label={labels.home}
          >{renderBrand()}</Link>}
        <span className={classes.divider} />
        <span className={classes.breadcrumb}>{renderBreadcrumb(title)}</span>
        <div className={classes.tools}>
          {environmentLabel && <span className={classes.environment}><i />{environmentLabel}</span>}
          {!inMatch && <Link
            to="/"
            className={layoutStyles.platformHomeLink}
            aria-label={labels.platformHome ?? '返回游戏首页'}
            title={labels.platformHome ?? '返回游戏首页'}
          >
            <Home size={18} strokeWidth={1.8} />
          </Link>}
          {tools}
          {profile && (inMatch
            ? <span className={classes.matchProfile} aria-label={labels.currentPlayer}>{renderAvatar({
              ...profile,
              size: headerAvatarSize,
              location: 'header',
            })}</span>
            : <Link to={`${basePath}/me`} className={classes.profile}>{renderAvatar({
              ...profile,
              size: headerAvatarSize,
              location: 'header',
            })}<span className={classes.profileName}>{renderProfileLabel(profile)}</span>{profileAccessory}</Link>)}
        </div>
      </header>}
      <main className={[
        classes.content,
        compactMobileFooter ? layoutStyles.compactMobileFooter : '',
      ].filter(Boolean).join(' ')}>{children}</main>
    </div>
    {!inMatch && <nav className={classes.mobileNav} aria-label={labels.mobileNavigation}>
      {navigation.map(item => <NavLink
        end
        key={item.path}
        to={item.path}
        aria-label={item.title}
        className={({ isActive }) => isActive ? classes.active ?? '' : ''}
      >
        {item.mobileIcon ?? item.icon}<span>{item.mobileLabel ?? item.desktopLabel ?? item.title}</span>
      </NavLink>)}
    </nav>}
    {renderFeedback?.()}
  </div>;
}
