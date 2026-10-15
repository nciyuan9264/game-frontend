import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { AcquireRoom } from '../../model/types';
import { RoomCard } from '.';

afterEach(cleanup);

describe('Acquire room card', () => {
  it('marks an owner-visible private room', () => {
    const room: AcquireRoom = {
      roomID: 'private-room',
      ownerID: 'Alice-42',
      ownerName: 'Alice',
      maxPlayers: 6,
      visibility: 'private',
      status: 'match',
      roomPlayer: [{ playerID: 'Alice-42', online: true, ai: false, ready: false }],
    };

    render(<RoomCard room={room} playerID="Alice-42" onEnter={() => {}} />);

    expect(screen.getByText('仅你可见')).toBeTruthy();
    expect(screen.getByRole('button', { name: '返回房间 private-room' })).toBeTruthy();
  });
});
