import type {
  LoveLetterRoomView,
  RoomPlayer,
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
  LoveLetterPlayer,
  Visibility,
} from './types';

export interface MatchSnapshot extends SessionSnapshotBase {
  type: 'MATCH_SYNC';
  ownerID: string;
  status: GameStatus;
  playerID: string;
  players: Record<string, LoveLetterPlayer>;
  visibility: Visibility;
  maxPlayers: number;
  playerOrder: string[];
}

export interface GameSnapshot extends
  SessionSnapshotBase,
  Omit<LoveLetterRoomView, 'roomData'> {
  type: 'ROOM_SYNC';
  visibility: Visibility;
  roomData: Omit<
    LoveLetterRoomView['roomData'],
    'gameStatus' | 'turnTimeoutMs' | 'players'
  > & {
    gameStatus: GameStatus;
    turnTimeoutMs?: number;
    players: Record<string, LoveLetterPlayer>;
  };
}

export type Snapshot = MatchSnapshot | GameSnapshot;
export type CommandType =
  | 'match_ready'
  | 'match_begin'
  | 'match_add_ai'
  | 'match_remove_player'
  | 'room_update_settings'
  | 'game_ready'
  | 'game_draw_card'
  | 'game_play_card'
  | 'game_settle_chancellor'
  | 'game_next_round';
export type PendingCommand = SessionPendingCommand<
  Snapshot,
  CommandType,
  Record<string, unknown>
>;
export type ServerMessage =
  | Snapshot
  | RealtimeCommandResult
  | RealtimeErrorMessage;

const normalizePlayers = (
  players: Record<string, RoomPlayer>,
): Record<string, LoveLetterPlayer> => Object.fromEntries(
  Object.entries(players ?? {}).map(([id, player]) => [
    id,
    {
      ...player,
      displayName: player.displayName || (player.ai ? '公平 AI' : `玩家 ${id}`),
      name: player.displayName,
    },
  ]),
);

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
  const view = envelope.view.loveletter;
  if (!view) return;
  return {
    ...common,
    type: 'ROOM_SYNC',
    playerId: view.playerId,
    ownerID: view.ownerID,
    visibility: view.visibility as Visibility,
    playerData: view.playerData,
    privateData: view.privateData,
    result: view.result,
    roomData: {
      ...view.roomData,
      gameStatus: view.roomData.gameStatus as GameStatus,
      turnTimeoutMs: view.roomData.turnTimeoutMs == null
        ? undefined
        : Number(view.roomData.turnTimeoutMs),
      players: normalizePlayers(view.roomData.players),
    },
  };
}

export const selfID = (snapshot: Snapshot) =>
  snapshot.type === 'MATCH_SYNC' ? snapshot.playerID : snapshot.playerId;

export const playerName = (
  id: string,
  players?: Record<string, LoveLetterPlayer>,
) => playerDisplayName(players?.[id], id);

export const phaseKey = (snapshot?: Snapshot) =>
  snapshot ? `${snapshot.roomID}:${snapshot.seq}` : '';
