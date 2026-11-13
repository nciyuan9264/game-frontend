import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import {
  GameMobileCreateRoomDialog,
  GameMobileGuide,
  GameMobileLobby,
  GameMobileProfile,
  GameMobileRankings,
  GameMobileRoomCard,
} from '.';

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute('open');
  };
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('GamePublicMobile', () => {
  it('renders the shared lobby hierarchy and actions', () => {
    const create = vi.fn();
    const share = vi.fn();
    const { container } = render(<GameMobileLobby
      eyebrow="NEXT TABLE"
      title="开一桌"
      description="邀请朋友"
      media={<img src="/hero.webp" alt="" />}
      facts={[{ label: '玩家', value: '2–4' }, { label: '时长', value: '30 分' }, { label: '规则', value: '经典' }]}
      browserEyebrow="ROOMS"
      browserTitle="找到房间"
      roomCount="1 个房间"
      filters={[{ value: 'all', label: '全部' }]}
      filter="all"
      onFilterChange={vi.fn()}
      query=""
      onQueryChange={vi.fn()}
      rooms={[{ id: '1' }]}
      renderRoom={room => <article key={room.id}>ROOM {room.id}</article>}
      onCreate={create}
      onShare={share}
      joinCode=""
      onJoinCodeChange={vi.fn()}
      onJoin={vi.fn()}
    />);

    fireEvent.click(screen.getByRole('button', { name: /创建房间/ }));
    fireEvent.click(screen.getByRole('button', { name: /分享游戏/ }));
    expect(create).toHaveBeenCalledTimes(1);
    expect(share).toHaveBeenCalledTimes(1);
    expect(container.querySelector('[data-game-mobile-lobby-hero]')).toBeTruthy();
    expect(container.querySelector('[data-game-mobile-lobby-browser]')).toBeTruthy();
    expect(screen.getByText('ROOM 1')).toBeTruthy();
  });

  it('renders only bounded room progress and clamps its current value', () => {
    const { rerender } = render(<GameMobileRoomCard
      roomID="ROOM-1" ownerName="Alice" ownerAvatar={<span>AVATAR</span>}
      playerCount={2} maxPlayers={4} status="对局中"
      progress={{ current: 12, total: 8, label: '轮次进度', description: '8 / 8 轮' }}
      actionLabel="进入对局" onEnter={vi.fn()} />);

    const progress = screen.getByRole('progressbar', { name: '轮次进度' });
    expect(progress.getAttribute('aria-valuenow')).toBe('8');
    expect(progress.getAttribute('aria-valuemax')).toBe('8');
    expect(screen.getByText('8 / 8 轮')).toBeTruthy();

    rerender(<GameMobileRoomCard
      roomID="ROOM-1" ownerName="Alice" ownerAvatar={<span>AVATAR</span>}
      playerCount={2} maxPlayers={4} status="对局中"
      progress={{ current: 1, total: 0, label: '无界进度' }}
      actionLabel="进入对局" onEnter={vi.fn()} />);
    expect(screen.queryByRole('progressbar')).toBeNull();

    rerender(<GameMobileRoomCard
      roomID="ROOM-1" ownerName="Alice" ownerAvatar={<span>AVATAR</span>}
      playerCount={2} maxPlayers={4} status="对局中"
      progress={{ current: Number.POSITIVE_INFINITY, total: 8, label: '异常进度' }}
      actionLabel="进入对局" onEnter={vi.fn()} />);
    expect(screen.queryByRole('progressbar')).toBeNull();
  });

  it('renders ranking, guide, and profile contracts', () => {
    const { container } = render(<MemoryRouter>
      <GameMobileRankings eyebrow="RANK" title="排行榜" description="真实记录"
        modes={[{ value: 'metric', label: '战绩榜' }]} mode="metric"
        onModeChange={vi.fn()} currentUserID="1"
        entries={[{ id: '1', displayName: 'Alice', totalGames: 4, metric: '75%', metricLabel: '胜率' }]}
        renderAvatar={() => <span>AVATAR</span>} />
      <GameMobileGuide visual={<span>VISUAL</span>}
        facts={[{ label: '玩家', value: '2' }]}
        tabs={[{ value: 0, label: '01 开始' }]} index={0} onSelect={vi.fn()}
        eyebrow="GUIDE" title="第一步" description="规则"
        points={['要点']} hint="服务端校验" primaryLabel="下一步"
        onPrimary={vi.fn()} />
      <GameMobileProfile avatar={<span>AVATAR</span>} eyebrow="PLAYER"
        name="Alice" playerID="1" stats={[{ label: '对局', value: 3 }]}
        historyTitle="对局记录" historyItems={[]} onLogout={vi.fn()} />
    </MemoryRouter>);

    expect(screen.getByText('75%')).toBeTruthy();
    expect(screen.getByText('第一步')).toBeTruthy();
    expect(screen.getByText('邮箱未绑定')).toBeTruthy();
    expect(screen.getByRole('link', { name: '编辑资料' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /退出登录/ })).toBeNull();
    expect(container.querySelector('[data-game-mobile-rank-panel]')).toBeTruthy();
    expect(container.querySelector(
      '[data-game-mobile-scroll-owner="rankings"]',
    )).toBeTruthy();
    expect(container.querySelector(
      '[data-game-mobile-sticky-header="rankings"]',
    )).toBeTruthy();
    expect(container.querySelector(
      '[data-game-mobile-sticky-header="profile"]',
    )).toBeTruthy();
    expect(container.querySelector(
      '[data-game-mobile-scroll-owner="guide"]',
    )).toBeTruthy();
    expect(container.querySelector(
      '[data-game-mobile-scroll-owner="profile"]',
    )).toBeTruthy();
    expect(container.querySelector(
      '[data-game-mobile-scroll-owner="profile-history"]',
    )).toBeNull();
  });

  it('shows logout only for admins after their history', () => {
    const onLogout = vi.fn();
    render(<MemoryRouter><GameMobileProfile avatar={<span>AVATAR</span>}
      eyebrow="PLAYER" name="Admin" playerID="1" isAdmin
      stats={[{ label: '对局', value: 3 }]} historyTitle="最近对局"
      historyItems={[{ id: '1', title: 'ROOM 1', detail: '已结束' }]}
      onLogout={onLogout} /></MemoryRouter>);

    const history = screen.getByRole('heading', { name: '最近对局' })
      .closest('section')!;
    const logout = screen.getByRole('button', { name: /退出登录/ });
    expect(history.contains(logout)).toBe(true);
    fireEvent.click(logout);
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it('loads the next history page when its sentinel enters view', async () => {
    const onHistoryLoadMore = vi.fn();
    vi.stubGlobal('IntersectionObserver', vi.fn(callback => ({
      observe: (target: Element) => callback([{
        isIntersecting: true,
        target,
      }]),
      disconnect: vi.fn(),
    })));
    render(<MemoryRouter><GameMobileProfile avatar={<span>AVATAR</span>}
      eyebrow="PLAYER" name="Alice" playerID="1"
      stats={[{ label: '对局', value: 3 }]} historyTitle="最近对局"
      historyItems={[{ id: '1', title: 'ROOM 1', detail: '已结束' }]}
      historyHasMore onHistoryLoadMore={onHistoryLoadMore}
      onLogout={vi.fn()} /></MemoryRouter>);

    await waitFor(() => expect(onHistoryLoadMore).toHaveBeenCalledTimes(1));
  });

  it('submits the shared create room dialog with visibility', () => {
    const onSubmit = vi.fn();
    const onVisibilityChange = vi.fn();
    render(<GameMobileCreateRoomDialog description="选择公开范围"
      visibility="public" onVisibilityChange={onVisibilityChange}
      hint="规则固定" onClose={vi.fn()} onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole('button', { name: /私密房间/ }));
    fireEvent.click(screen.getByRole('button', { name: /创建并入座/ }));
    expect(onVisibilityChange).toHaveBeenCalledWith('private');
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
