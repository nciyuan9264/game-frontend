import type {
  CantStopPlayerState,
  RoomPlayer,
  CantStopReplaySnapshot,
  CantStopRoomView,
} from '@/api/generated/game-platform';
import type {
  SessionPendingCommand,
  SessionSnapshotBase,
} from '@/features/game-core/model/session';
import { playerDisplayName } from '@/features/game-core/model/room';
import {
  parseRealtimeEnvelope,
  type RealtimeCommandResult,
  type RealtimeErrorMessage,
} from '@/features/game-core/model/realtime';
import type {
  GameStatus,
  CantStopPlayer,
  Visibility,
} from './types';

type ExtraRoomData = CantStopRoomView['roomData'] & {
  columnHeights?: Record<number, number>;
  targetColumns?: number;
  turnTransitionTimeoutMs?: string;
};

export type CantStopPublicPlayerState = CantStopPlayerState & {
  busts?: number;
};

export type CantStopGameRoomData = Omit<
  CantStopRoomView['roomData'],
  'gameStatus' | 'turnTimeoutMs' | 'players'
> & {
  gameStatus: GameStatus;
  turnTimeoutMs?: number;
  turnTransitionTimeoutMs?: number;
  columnHeights?: Record<number, number>;
  targetColumns?: number;
  players: Record<string, CantStopPlayer>;
};

export interface MatchSnapshot extends SessionSnapshotBase {
  type: 'MATCH_SYNC';
  ownerID: string;
  status: GameStatus;
  playerID: string;
  players: Record<string, CantStopPlayer>;
  visibility: Visibility;
  maxPlayers: number;
  playerOrder: string[];
}

export interface GameSnapshot extends
  SessionSnapshotBase,
  Omit<CantStopRoomView, 'roomData' | 'playerData'> {
  type: 'ROOM_SYNC';
  visibility: Visibility;
  playerData: Record<string, CantStopPublicPlayerState>;
  roomData: CantStopGameRoomData;
}

export type Snapshot = MatchSnapshot | GameSnapshot;
export type CommandType =
  | 'match_ready'
  | 'match_begin'
  | 'match_add_ai'
  | 'match_remove_player'
  | 'room_update_settings'
  | 'game_ready'
  | 'game_roll_dice'
  | 'game_advance'
  | 'game_bank'
  | 'game_next_turn';
export type PendingCommand = SessionPendingCommand<
  Snapshot,
  CommandType,
  Record<string, unknown>
>;
export type ServerMessage =
  | Snapshot
  | RealtimeCommandResult
  | RealtimeErrorMessage;

const statuses = new Set<GameStatus>([
  'match', 'waiting', 'roll', 'choose', 'decide', 'bust', 'banked', 'end',
]);

const normalizePlayers = (
  players: Record<string, RoomPlayer>,
): Record<string, CantStopPlayer> => Object.fromEntries(
  Object.entries(players ?? {}).map(([id, player]) => [
    id,
    {
      ...player,
      displayName: player.displayName || (player.ai ? '公平 AI' : `玩家 ${id}`),
      name: player.displayName,
    },
  ]),
);

function validRoomView(view: CantStopRoomView) {
  return statuses.has(view.roomData.gameStatus as GameStatus)
    && Array.isArray(view.roomData.playerOrder)
    && view.roomData.playerOrder.length >= 2
    && view.roomData.playerOrder.length <= 4
    && Array.isArray(view.roomData.dice)
    && view.roomData.dice.every(value =>
      Number.isInteger(value) && value >= 1 && value <= 6)
    && Array.isArray(view.roomData.pairingOptions);
}

function normalizeRoomData(
  value: CantStopRoomView['roomData'],
): CantStopGameRoomData {
  const roomData = value as ExtraRoomData;
  return {
    ...roomData,
    gameStatus: roomData.gameStatus as GameStatus,
    turnTimeoutMs: roomData.turnTimeoutMs == null
      ? undefined
      : Number(roomData.turnTimeoutMs),
    turnTransitionTimeoutMs: roomData.turnTransitionTimeoutMs == null
      ? undefined
      : Number(roomData.turnTransitionTimeoutMs),
    players: normalizePlayers(roomData.players),
  };
}

export function parseServerMessage(value: string): ServerMessage | undefined {
  const envelope = parseRealtimeEnvelope(value);
  if (!envelope) return;
  if (envelope.type === 'COMMAND_RESULT' || envelope.type === 'ERROR') {
    return envelope;
  }
  const common = {
    schemaVersion: envelope.schemaVersion,
    roomID: envelope.roomID,
    matchID: envelope.matchID,
    seq: envelope.seq,
    phaseVersion: envelope.seq,
    turnNumber: envelope.seq,
  };
  if (envelope.type === 'MATCH_SYNC') {
    if (!statuses.has(envelope.status as GameStatus)) return;
    return {
      ...common,
      type: 'MATCH_SYNC',
      ownerID: envelope.ownerID,
      status: envelope.status as GameStatus,
      playerID: envelope.playerID,
      players: normalizePlayers(envelope.players),
      visibility: envelope.visibility as Visibility,
      maxPlayers: envelope.maxPlayers,
      playerOrder: envelope.playerOrder,
    };
  }
  const view = envelope.view.cantstop;
  if (!view || !validRoomView(view)) return;
  return {
    ...common,
    type: 'ROOM_SYNC',
    playerId: view.playerId,
    ownerID: view.ownerID,
    visibility: view.visibility as Visibility,
    playerData: view.playerData,
    result: view.result,
    roomData: normalizeRoomData(view.roomData),
  };
}

export function parseReplaySnapshot(
  value: CantStopReplaySnapshot,
  viewer: string,
  roomID: string,
): GameSnapshot | undefined {
  const view: CantStopRoomView = {
    playerId: viewer,
    ownerID: '',
    visibility: 'private',
    playerData: value.playersData,
    roomData: value.roomData,
    result: value.result,
  };
  if (!validRoomView(view)) return;
  return {
    schemaVersion: 2,
    type: 'ROOM_SYNC',
    roomID,
    matchID: '',
    seq: Number(value.seq),
    phaseVersion: Number(value.seq),
    turnNumber: Number(value.seq),
    playerId: viewer,
    ownerID: '',
    visibility: 'private',
    playerData: view.playerData,
    result: view.result,
    roomData: normalizeRoomData(view.roomData),
  };
}

export const selfID = (snapshot: Snapshot) =>
  snapshot.type === 'MATCH_SYNC' ? snapshot.playerID : snapshot.playerId;

export const playerName = (
  id: string,
  players?: Record<string, CantStopPlayer>,
) => playerDisplayName(players?.[id], id);

export const phaseKey = (snapshot?: Snapshot) =>
  snapshot ? `${snapshot.roomID}:${snapshot.seq}` : '';

export const turnKey = (snapshot?: GameSnapshot) => snapshot
  ? `${snapshot.matchID}:${snapshot.roomData.turnNumber}:${snapshot.roomData.rollNumber}:${snapshot.roomData.gameStatus}`
  : '';
