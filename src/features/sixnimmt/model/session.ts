import type {
  RoomPlayer,
  SixNimmtReplaySnapshot,
  SixNimmtRoomView,
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
  SixNimmtPlayer,
  Visibility,
} from './types';

export interface MatchSnapshot extends SessionSnapshotBase {
  type: 'MATCH_SYNC';
  ownerID: string;
  status: GameStatus;
  playerID: string;
  players: Record<string, SixNimmtPlayer>;
  visibility: Visibility;
  maxPlayers: number;
  playerOrder: string[];
}

export interface GameSnapshot extends
  SessionSnapshotBase,
  Omit<SixNimmtRoomView, 'roomData'> {
  type: 'ROOM_SYNC';
  visibility: Visibility;
  roomData: Omit<
    SixNimmtRoomView['roomData'],
    'gameStatus' | 'turnTimeoutMs' | 'players'
  > & {
    gameStatus: GameStatus;
    turnTimeoutMs?: number;
    players: Record<string, SixNimmtPlayer>;
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
  | 'game_lock_card'
  | 'game_unlock_card'
  | 'game_choose_row'
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

const statuses = new Set<GameStatus>([
  'match', 'waiting', 'selecting', 'chooseRow', 'roundEnd', 'end',
]);

const normalizePlayers = (
  players: Record<string, RoomPlayer>,
): Record<string, SixNimmtPlayer> => Object.fromEntries(
  Object.entries(players ?? {}).map(([id, player]) => [
    id,
    {
      ...player,
      displayName: player.displayName || (player.ai ? '公平 AI' : `玩家 ${id}`),
      name: player.displayName,
    },
  ]),
);

function validRoomView(view: SixNimmtRoomView) {
  return statuses.has(view.roomData.gameStatus as GameStatus)
    && view.roomData.rows.length === 4
    && view.roomData.rows.every((row, index) =>
      row.index === index
      && row.cards.length >= 1
      && row.cards.length <= 5
      && row.cards.every(card => card >= 1 && card <= 104))
    && view.privateData.hand.every(card => card >= 1 && card <= 104);
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
  const view = envelope.view.sixnimmt;
  if (!view || !validRoomView(view)) return;
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

export function parseReplaySnapshot(
  value: SixNimmtReplaySnapshot,
  viewer: string,
  roomID: string,
): GameSnapshot | undefined {
  const view: SixNimmtRoomView = {
    playerId: viewer,
    ownerID: '',
    visibility: 'private',
    playerData: value.playersData,
    privateData: value.privateData[viewer] ?? {
      hand: [],
      legalCards: [],
    },
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
  players?: Record<string, SixNimmtPlayer>,
) => playerDisplayName(players?.[id], id);

export const phaseKey = (snapshot?: Snapshot) =>
  snapshot ? `${snapshot.roomID}:${snapshot.seq}` : '';

export const turnKey = (snapshot?: GameSnapshot) => snapshot
  ? `${snapshot.matchID}:${snapshot.roomData.roundNo}:${snapshot.roomData.turnNo}`
  : '';
