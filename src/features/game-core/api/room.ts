import {
  CreateRoom,
  GetRoom,
  ListRooms,
  StartNextMatch,
  type RoomInfo,
} from '@/api/generated/game-platform';
import type { GameType } from '@/hooks/useGameType';
import {
  toLobbyRoom,
  type LobbyRoomLike,
} from '../model/room';
import { APIRequestError } from '@/api/request';

export interface RoomListResponse<TRoom> {
  rooms: TRoom[];
  onlinePlayer?: number;
}

export interface GameRoomRequestOptions {
  signal?: AbortSignal;
  authFailure?: 'throw' | 'redirect';
}

export class GameRoomRequestError extends Error {
  constructor(
    message: string,
    public status = 0,
    public code?: string,
  ) {
    super(message);
    this.name = 'GameRoomRequestError';
  }
}

const requestOptions = (options: GameRoomRequestOptions) => ({
  signal: options.signal,
});

function mapRoom<TRoom>(room: RoomInfo): TRoom {
  return toLobbyRoom(room) as TRoom;
}

export async function listGameRooms<
  TRoom = LobbyRoomLike,
  TResponse extends RoomListResponse<TRoom> = RoomListResponse<TRoom>,
>(
  gameType: GameType,
  options: GameRoomRequestOptions = {},
): Promise<TResponse> {
  try {
    const response = await ListRooms(
      { game_type: gameType },
      requestOptions(options),
    );
    return {
      rooms: response.data.rooms.map(mapRoom<TRoom>),
    } as TResponse;
  } catch (reason) {
    throw mapError(reason, options);
  }
}

export async function createGameRoom(
  gameType: GameType,
  data: {
    visibility?: string;
    maxPlayers?: number;
    turnTimeoutSeconds?: number;
  },
  options: GameRoomRequestOptions = {},
): Promise<{ roomID: string; room: LobbyRoomLike }> {
  try {
    const response = await CreateRoom({
      game_type: gameType,
      visibility: data.visibility,
      max_players: data.maxPlayers,
      turn_timeout_seconds: data.turnTimeoutSeconds,
      request_id: crypto.randomUUID(),
    }, requestOptions(options));
    return {
      roomID: response.data.roomID,
      room: toLobbyRoom(response.data),
    };
  } catch (reason) {
    throw mapError(reason, options);
  }
}

export async function lookupGameRoom<TRoom = LobbyRoomLike>(
  gameType: GameType,
  roomID: string,
  options: GameRoomRequestOptions = {},
): Promise<TRoom> {
  try {
    const response = await GetRoom({
      game_type: gameType,
      room_id: roomID,
    }, requestOptions(options));
    return mapRoom<TRoom>(response.data);
  } catch (reason) {
    throw mapError(reason, options);
  }
}

export async function startNextGameMatch(
  gameType: GameType,
  roomID: string,
  options: GameRoomRequestOptions = {},
): Promise<{ matchID: string; roundNo: number }> {
  try {
    const response = await StartNextMatch({
      game_type: gameType,
      room_id: roomID,
      request_id: crypto.randomUUID(),
    }, requestOptions(options));
    return {
      matchID: response.data.matchID,
      roundNo: response.data.roundNo,
    };
  } catch (reason) {
    throw mapError(reason, options);
  }
}

function mapError(
  reason: unknown,
  options: GameRoomRequestOptions,
): GameRoomRequestError {
  const error = reason instanceof Error ? reason : new Error('请求失败，请重试');
  if (options.authFailure === 'redirect' && /登录|unauthorized/i.test(error.message)) {
    window.location.href = 'https://auth.gamebus.online/login?redirect='
      + encodeURIComponent(window.location.href);
  }
  return new GameRoomRequestError(
    error.message,
    error instanceof APIRequestError ? error.status : 0,
    error instanceof APIRequestError ? error.code : undefined,
  );
}
