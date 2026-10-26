import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { GameAppShell, type GameAppShellProps } from '.';

const navigation = [
  { path: '/game/test', title: '大厅', icon: <i>H</i> },
  { path: '/game/test/rankings', title: '排行', icon: <i>R</i> },
  { path: '/game/test/guide', title: '玩法', icon: <i>G</i> },
  { path: '/game/test/me', title: '我的', icon: <i>M</i> },
];
const baseProps: Omit<GameAppShellProps, 'children' | 'title'> = {
  rootClassName: 'root',
  classes: {
    shell: 'shell',
    active: 'active',
    rail: 'rail',
    main: 'main',
    header: 'header',
    content: 'content',
    mobileNav: 'mobile',
  },
  basePath: '/game/test',
  navigation,
  profile: { name: 'Alice' },
  renderMark: () => <span>MARK</span>,
  renderBrand: () => <span>BRAND</span>,
  renderAvatar: ({ name, location }) => <span>{`${name}-${location}`}</span>,
  renderBreadcrumb: title => <b>{title}</b>,
  renderFeedback: () => <span>FEEDBACK</span>,
  environmentLabel: '在线',
  labels: {
    home: '测试大厅',
    navigation: '测试导航',
    mobileNavigation: '测试手机导航',
    profile: '个人资料',
    currentPlayer: '当前玩家',
  },
};

afterEach(cleanup);

describe('GameAppShell', () => {
  it('renders routes, active state, profile links, and slots', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/game/test/rankings']}>
        <GameAppShell {...baseProps} title="排行榜"><span>CONTENT</span></GameAppShell>
      </MemoryRouter>
    );
    const activeLinks = container.querySelectorAll('a.active');
    expect(activeLinks).toHaveLength(2);
    expect(screen.getByRole('navigation', { name: '测试导航' })).toBeTruthy();
    expect(screen.getByRole('navigation', { name: '测试手机导航' })).toBeTruthy();
    expect(screen.getAllByText('Alice-rail')).toHaveLength(1);
    expect(screen.getByText('Alice-header')).toBeTruthy();
    expect(screen.getByText('排行榜')).toBeTruthy();
    expect(screen.getByText('CONTENT')).toBeTruthy();
    expect(screen.getByText('FEEDBACK')).toBeTruthy();
  });

  it('supports match and hidden shell modes', () => {
    const { container } = render(
      <MemoryRouter>
        <GameAppShell {...baseProps} inMatch hideRail hideHeader title="对局">
          <span>GAME</span>
        </GameAppShell>
      </MemoryRouter>
    );
    expect(container.querySelector('aside')).toBeNull();
    expect(container.querySelector('header')).toBeNull();
    expect(screen.queryByRole('navigation', { name: '测试手机导航' })).toBeNull();
    expect(screen.getByText('GAME')).toBeTruthy();
  });

  it('adds explicit compact mobile footer classes to the shell and content area', () => {
    const { container } = render(
      <MemoryRouter>
        <GameAppShell {...baseProps} compactMobileFooter title="个人资料">
          <span>PROFILE</span>
        </GameAppShell>
      </MemoryRouter>
    );
    expect(container.firstElementChild?.className.split(' ')).toHaveLength(3);
    expect(container.querySelector('div.main')?.className.split(' ')).toHaveLength(2);
    expect(container.querySelector('main')?.className.split(' ')).toHaveLength(2);
  });
});
