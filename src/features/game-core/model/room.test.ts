import { describe, expect, it } from 'vitest';
import {
  filterLobbyRooms,
  gameInviteURL,
  playerDisplayName,
  roomEntry,
  roomOwnerName,
  sortLobbyRooms,
  type LobbyRoomLike,
} from './room';

const room: LobbyRoomLike = {
  roomID: '1021_140000',
  ownerID: '7',
  maxPlayers: 2,
  status: 'match',
  roomPlayer: [{
    userID: '7',
    playerID: '7',
    displayName: 'Alice-Cooper-7',
    online: true,
    ai: false,
    ready: false,
  }],
};

describe('shared lobby room model', () => {
  it('resolves owner names and entry states', () => {
    expect(playerDisplayName(room.roomPlayer[0])).toBe('Alice-Cooper-7');
    expect(roomOwnerName(room)).toBe('Alice-Cooper-7');
    expect(roomEntry(room, { userID: '7' })).toEqual({ allowed: true, label: '返回房间' });
    expect(roomEntry({ ...room, status: 'playing' }, { userID: '8' })).toEqual({ allowed: false, label: '已开局' });
    expect(roomEntry({ ...room, roomPlayer: [...room.roomPlayer, {
      playerID: 'Bob-8',
      online: true,
      ai: false,
      ready: false,
    }] }, { userID: '9' })).toEqual({ allowed: false, label: '房间已满' });
  });

  it('sorts, filters, and searches without mutating the source', () => {
    const newer = { ...room, roomID: '1021_150000', status: 'playing' };
    const ended = { ...room, roomID: '1021_160000', status: 'end' };
    const source = [room, newer, ended];
    expect(sortLobbyRooms(source).map(item => item.roomID)).toEqual([
      '1021_160000',
      '1021_150000',
      '1021_140000',
    ]);
    expect(source[0]).toBe(room);
    expect(filterLobbyRooms(source, 'joinable', 'alice')).toEqual([room]);
    expect(filterLobbyRooms(source, 'playing', '')).toEqual([newer]);
    expect(filterLobbyRooms(source, 'all', '')).toEqual(source);
  });

  it('builds an encoded public invite URL', () => {
    expect(gameInviteURL('splendor', 'room / 1')).toBe(
      'https://board.gamebus.online/game/splendor/match?roomID=room%20%2F%201'
    );
  });
});
