import type { ReactNode } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OthelloSession } from '../../hooks/useOthelloSession';
import { othelloRoomInviteURL } from '../../model/adapters';
import type { MatchSnapshot } from '../../model/session';
import { Room } from '.';

vi.mock('../../hooks/useOthelloViewport', () => ({
  useOthelloViewport: () => ({ isMobile: false }),
}));
vi.mock('./RoomDesktop', () => ({ RoomDesktop: () => null }));
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
  }) => <section role="dialog" aria-label={title}>{children}{footer}</section>,
}));

const data = {
  schemaVersion: 2,
  type: 'MATCH_SYNC',
  roomID: 'othello room/1',
  matchID: 'match-1',
  seq: 1,
  ownerID: 'owner',
  playerID: 'owner',
  visibility: 'private',
  phaseVersion: 1,
  turnNumber: 0,
  status: 'match',
  maxPlayers: 2,
  playerOrder: ['owner'],
  players: {
    owner: {
      playerID: 'owner',
      displayName: 'Alice',
      online: true,
      ai: false,
      ready: true,
      seatIndex: 0,
    },
  },
} as MatchSnapshot;

const session = {
  connection: { status: 'connected' },
  pending: undefined,
  submit: vi.fn(),
} as unknown as OthelloSession;

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

describe('Othello room', () => {
  it('copies the room number and invitation URL', async () => {
    render(<Room session={session} data={data} onLeave={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: '邀请对手' }));

    fireEvent.click(screen.getByRole('button', { name: '复制房间号' }));
    await waitFor(() => expect(navigator.clipboard.writeText)
      .toHaveBeenCalledWith(data.roomID));

    fireEvent.click(screen.getByRole('button', { name: '复制邀请链接' }));
    await waitFor(() => expect(navigator.clipboard.writeText)
      .toHaveBeenCalledWith(othelloRoomInviteURL(data.roomID)));
  });
});
