import type { ReactNode } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AcquireSession } from '../../hooks/useAcquireSession';
import { acquireRoomInviteURL } from '../../model/adapters';
import type { MatchSnapshot } from '../../model/session';
import { Room } from '.';

vi.mock('../../hooks/useAcquireViewport', () => ({
  useAcquireViewport: () => ({ isMobile: false }),
}));
vi.mock('./RoomDesktop', () => ({ RoomDesktop: () => null }));
vi.mock('./RoomMobile', () => ({ RoomMobile: () => null }));
vi.mock('../../components/ResponsiveDialog', () => ({
  ResponsiveDialog: ({ title, children, footer }: { title: string; children: ReactNode; footer?: ReactNode }) =>
    <section role="dialog" aria-label={title}>{children}{footer}</section>,
}));

const data: MatchSnapshot = {
  schemaVersion: 2,
  type: 'MATCH_SYNC',
  roomID: 'room 1/2',
  matchID: 'match-1',
  seq: 1,
  ownerID: 'Alice-42',
  playerID: 'Alice-42',
  visibility: 'private',
  phaseVersion: 1,
  turnNumber: 0,
  status: 'match',
  maxPlayers: 6,
  playerOrder: ['Alice-42'],
  players: {
    'Alice-42': {
      playerID: 'Alice-42',
      name: 'Alice',
      online: true,
      ai: false,
      ready: true,
    },
  },
};

const session = {
  connection: { status: 'connected' },
  pending: undefined,
  submit: vi.fn(),
} as unknown as AcquireSession;

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

describe('Acquire room invitation', () => {
  it('shows the room number and copies either invitation format', async () => {
    const inviteURL = acquireRoomInviteURL(data.roomID);
    render(<Room session={session} data={data} onLeave={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: '邀请好友' }));

    expect((screen.getByRole('textbox', { name: '分享房间号' }) as HTMLInputElement).value).toBe(data.roomID);
    fireEvent.click(screen.getByRole('button', { name: '复制房间号' }));
    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledWith(data.roomID));
    expect(screen.getByText('房间号已复制')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: '复制邀请链接' }));

    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledWith(inviteURL));
    expect(screen.getByText('邀请链接已复制')).toBeTruthy();
  });
});
