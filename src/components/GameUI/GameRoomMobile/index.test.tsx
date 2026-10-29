import { fireEvent, render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import {
  GameMobileRoom,
  GameMobileRoomInviteDialog,
  type GameMobileRoomPlayer,
} from '.';

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute('open');
  };
});

const owner: GameMobileRoomPlayer = {
  id: 'owner',
  name: 'Alice',
  ai: false,
  online: true,
  ready: true,
  owner: true,
  self: true,
};

describe('GameRoomMobile', () => {
  it('renders seats, owner controls, extension, and the fixed action', () => {
    const addAI = vi.fn();
    const start = vi.fn();
    const { container } = render(<GameMobileRoom roomID="room-1"
      kicker="CLASSIC TABLE" visibility="public" gameLabel="经典对局"
      players={[owner]} seats={[owner, undefined]}
      facts={[{ label: '回合', value: '60 秒' }]}
      summary={[{ label: '玩法', value: '经典' }]}
      summaryTitle="人齐了，就开场。" authorityHint="服务端校验"
      readinessTitle="再来一位" readinessDescription="你是房主"
      owner enabled pending={false} canStart={false}
      extension={<div>ROLE PICKER</div>}
      renderAvatar={() => <span>AVATAR</span>}
      onLeave={vi.fn()} onSettings={vi.fn()} onInvite={vi.fn()}
      onAddAI={addAI} onRemove={vi.fn()} onReady={vi.fn()} onStart={start} />);

    expect(container.querySelectorAll('[data-game-mobile-room-seat]')).toHaveLength(2);
    expect(screen.getByText('ROLE PICKER')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '在席位 2 添加人机' }));
    expect(addAI).toHaveBeenCalledWith(1);
    expect(screen.getByRole('button', { name: /开始对局/ })
      .hasAttribute('disabled')).toBe(true);
  });

  it('renders the shared room invitation actions', () => {
    const copyRoom = vi.fn();
    const copyInvite = vi.fn();
    render(<GameMobileRoomInviteDialog roomID="room-1" playerCount={1}
      maxPlayers={2} visibility="private" players={[owner]}
      renderAvatar={() => <span>AVATAR</span>} onCopyRoomID={copyRoom}
      onCopyInviteURL={copyInvite} onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /复制房间号/ }));
    fireEvent.click(screen.getByRole('button', { name: /复制邀请链接/ }));
    expect(copyRoom).toHaveBeenCalledTimes(1);
    expect(copyInvite).toHaveBeenCalledTimes(1);
    expect(screen.getByDisplayValue('room-1')).toBeTruthy();
  });
});
