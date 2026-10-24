import { describe, expect, it } from 'vitest';
import { ACQUIRE_PUBLIC_URL, acquireRoomInviteURL, roomEntry } from './adapters';
import type { AcquireRoom } from './types';

const room: AcquireRoom = {
  roomID: '1013_140000', ownerID: 'owner-1', status: 'setTile', visibility: 'private', maxPlayers: 6,
  roomPlayer: [{ userID: '1', playerID: '1', displayName: 'Owner-1', ai: false, ready: true, online: false }],
};
describe('room entry', () => {
  it('allows existing players to reconnect but rejects newcomers after start', () => {
    expect(roomEntry(room, { userID: '1' })).toEqual({ allowed: true, label: '进入对局' });
    expect(roomEntry(room, { userID: '2' }).allowed).toBe(false);
  });
  it('keeps reconnect available when all seats are occupied', () => {
    const full = { ...room, status: 'match', maxPlayers: 1 };
    expect(roomEntry(full, { userID: '1' }).allowed).toBe(true);
    expect(roomEntry(full, { userID: '2' })).toEqual({ allowed: false, label: '房间已满' });
  });
  it('builds a production invite link with an encoded room ID', () => {
    expect(acquireRoomInviteURL('room 1/2')).toBe(`${ACQUIRE_PUBLIC_URL}/match?roomID=room%201%2F2`);
  });
});
