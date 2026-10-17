import { describe, expect, it } from 'vitest';
import { ACQUIRE_PUBLIC_URL, acquireRoomInviteURL, playerName, roomEntry } from './adapters';
import type { AcquireRoom } from './types';

const room: AcquireRoom = {
  roomID: '1013_140000', ownerID: 'owner-1', status: 'setTile', visibility: 'private', maxPlayers: 6,
  roomPlayer: [{ playerID: 'owner-1', ai: false, ready: true, online: false }],
};
describe('room entry', () => {
  it('allows existing players to reconnect but rejects newcomers after start', () => {
    expect(roomEntry(room, 'owner-1')).toEqual({ allowed: true, label: '进入对局' });
    expect(roomEntry(room, 'new-2').allowed).toBe(false);
  });
  it('keeps reconnect available when all seats are occupied', () => {
    const full = { ...room, status: 'match', maxPlayers: 1 };
    expect(roomEntry(full, 'owner-1').allowed).toBe(true);
    expect(roomEntry(full, 'new-2')).toEqual({ allowed: false, label: '房间已满' });
  });
  it('removes only the legacy numeric user ID suffix', () => {
    expect(playerName('name-with-hyphens-12')).toBe('name-with-hyphens');
    expect(playerName('ai_001')).toBe('ai_001');
  });
  it('builds a production invite link with an encoded room ID', () => {
    expect(acquireRoomInviteURL('room 1/2')).toBe(`${ACQUIRE_PUBLIC_URL}/match?roomID=room%201%2F2`);
  });
});
