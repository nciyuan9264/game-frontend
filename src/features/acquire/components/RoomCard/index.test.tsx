import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { AcquireRoom } from '../../model/types';
import { RoomCard } from '.';

afterEach(cleanup);

describe('Acquire room card', () => {
  it('marks an owner-visible private room', () => {
    const room: AcquireRoom = {
      roomID: 'private-room',
      ownerID: '42',
      ownerName: 'Alice',
      maxPlayers: 6,
      visibility: 'private',
      status: 'match',
      roomPlayer: [{ userID: '42', playerID: '42', displayName: 'Alice-42', online: true, ai: false, ready: false }],
    };

    render(<RoomCard room={room} userID="42" onEnter={() => {}} />);

    expect(screen.getByText('仅你可见')).toBeTruthy();
    expect(screen.getByRole('button', { name: '返回房间 private-room' })).toBeTruthy();
    const progress = screen.getByRole('progressbar', { name: '对局进度' });
    expect(progress.getAttribute('aria-valuenow')).toBe('0');
    expect(progress.getAttribute('aria-valuemax')).toBe('108');
  });

  it('renders acquire game progress from remaining empty tiles', () => {
    const room: AcquireRoom = {
      roomID: 'playing-room',
      ownerID: '42',
      ownerName: 'Alice',
      maxPlayers: 6,
      visibility: 'public',
      status: 'playing',
      emptyTileCount: 81,
      roomPlayer: [{ userID: '42', playerID: '42', displayName: 'Alice-42', online: true, ai: false, ready: true }],
    };

    render(<RoomCard room={room} userID="42" onEnter={() => {}} />);

    expect(screen.getByText('对局中')).toBeTruthy();
    expect(screen.queryByText('已结束')).toBeNull();
    const progress = screen.getByRole('progressbar', { name: '对局进度' });
    expect(progress.getAttribute('aria-valuenow')).toBe('27');
    expect(progress.getAttribute('aria-valuemax')).toBe('108');
  });
});
