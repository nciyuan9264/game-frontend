import type { ReactNode } from 'react';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { YinshSession } from '../../hooks/useYinshSession';
import { yinshRoomInviteURL } from '../../model/adapters';
import type { MatchSnapshot } from '../../model/session';
import { Room } from '.';

vi.mock('../../hooks/useYinshViewport', () => ({
  useYinshViewport: () => ({ isMobile: false }),
}));
vi.mock('./RoomDesktop', () => ({
  RoomDesktop: (props: {
    onAddAI: (seatIndex?: number) => void;
    onRemove: (playerID: string) => void;
    onReady: () => void;
    onStart: () => void;
  }) => <section>
    <button type="button" onClick={() => props.onAddAI(1)}>
      添加人机测试</button>
    <button type="button" onClick={() => props.onRemove('guest')}>
      移除棋手测试</button>
    <button type="button" onClick={props.onReady}>准备测试</button>
    <button type="button" onClick={props.onStart}>开局测试</button>
  </section>,
}));
vi.mock('./RoomMobile', () => ({ RoomMobile: () => null }));
vi.mock('../../components/Dialog', () => ({
  Dialog: ({
    title,
    children,
    footer,
  }: {
    title: string;
    children: ReactNode;
    footer?: ReactNode;
  }) => <section role="dialog" aria-label={title}>
    {children}{footer}
  </section>,
}));

const data = {
  schemaVersion: 2,
  type: 'MATCH_SYNC',
  roomID: 'yinsh room/1',
  matchID: 'match-1',
  seq: 1,
  ownerID: 'owner',
  playerID: 'owner',
  visibility: 'private',
  phaseVersion: 1,
  turnNumber: 0,
  status: 'match',
  maxPlayers: 2,
  playerOrder: ['owner', 'guest'],
  players: {
    owner: {
      playerID: 'owner',
      displayName: 'Alice',
      online: true,
      ai: false,
      ready: true,
      seatIndex: 0,
    },
    guest: {
      playerID: 'guest',
      displayName: 'Bob',
      online: true,
      ai: false,
      ready: false,
      seatIndex: 1,
    },
  },
} as MatchSnapshot;

const submit = vi.fn(() => true);
const session = {
  connection: { status: 'connected' },
  pending: undefined,
  submit,
} as unknown as YinshSession;

beforeEach(() => {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('YINSH room', () => {
  it('copies the room number and invitation URL', async () => {
    render(<Room session={session} data={data} onLeave={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: '邀请对手' }));

    fireEvent.click(screen.getByRole('button', { name: '复制房间号' }));
    await waitFor(() => expect(navigator.clipboard.writeText)
      .toHaveBeenCalledWith(data.roomID));

    fireEvent.click(screen.getByRole('button', { name: '复制邀请链接' }));
    await waitFor(() => expect(navigator.clipboard.writeText)
      .toHaveBeenCalledWith(yinshRoomInviteURL(data.roomID)));
  });

  it('keeps room commands in the orchestration layer', () => {
    render(<Room session={session} data={data} onLeave={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: '添加人机测试' }));
    expect(submit).toHaveBeenCalledWith('match_add_ai', { seatIndex: 1 });

    fireEvent.click(screen.getByRole('button', { name: '准备测试' }));
    expect(submit).toHaveBeenCalledWith('match_ready', { ready: false });

    fireEvent.click(screen.getByRole('button', { name: '移除棋手测试' }));
    fireEvent.click(screen.getByRole('button', { name: '确认移除' }));
    expect(submit).toHaveBeenCalledWith('match_remove_player', {
      playerID: 'guest',
    });

    fireEvent.click(screen.getByRole('button', { name: '棋室设置' }));
    fireEvent.click(screen.getByRole('button', { name: '保存设置' }));
    expect(submit).toHaveBeenCalledWith('room_update_settings', {
      visibility: 'private',
    });

    fireEvent.click(screen.getByRole('button', { name: '开局测试' }));
    fireEvent.click(screen.getByRole('button', { name: '确认开局' }));
    expect(submit).toHaveBeenCalledWith('match_begin');
  });
});
