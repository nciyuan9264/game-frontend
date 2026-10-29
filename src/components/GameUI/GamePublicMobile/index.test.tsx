import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import {
  GameMobileCreateRoomDialog,
  GameMobileGuide,
  GameMobileLobby,
  GameMobileProfile,
  GameMobileRankings,
} from '.';

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute('open');
  };
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
        historyTitle="对局记录" historyItems={[]} onLogout={vi.fn()}
        onAbout={vi.fn()} />
    </MemoryRouter>);

    expect(screen.getByText('75%')).toBeTruthy();
    expect(screen.getByText('第一步')).toBeTruthy();
    expect(screen.getByText('PLAYER ID · 1')).toBeTruthy();
    expect(container.querySelector('[data-game-mobile-rank-panel]')).toBeTruthy();
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
