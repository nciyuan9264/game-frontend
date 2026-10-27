import type {
  ForSalePlayerState,
  ForSaleRoomView,
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
  ForSalePlayer,
  GameStatus,
  Visibility,
} from './types';

export interface MatchSnapshot extends SessionSnapshotBase {
  type: 'MATCH_SYNC';
  ownerID: string;
  status: GameStatus;
  playerID: string;
  players: Record<string, ForSalePlayer>;
  visibility: Visibility;
  maxPlayers: number;
  playerOrder: string[];
}

type NormalizedPlayerState = Omit<
  ForSalePlayerState,
  'actionTimeoutMs'
> & {
  actionTimeoutMs?: number;
};

export interface GameSnapshot extends
  SessionSnapshotBase,
  Omit<ForSaleRoomView, 'roomData' | 'playerData'> {
  type: 'ROOM_SYNC';
  visibility: Visibility;
  playerData: Record<string, NormalizedPlayerState>;
  roomData: Omit<
    ForSaleRoomView['roomData'],
    'gameStatus' | 'transitionTimeoutMs' | 'players'
  > & {
    gameStatus: GameStatus;
    transitionTimeoutMs?: number;
    players: Record<string, ForSalePlayer>;
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
  | 'game_bid'
  | 'game_pass'
  | 'game_lock_sale'
  | 'game_reveal_sale'
  | 'game_next_round'
  | 'game_start_selling';
export type CommandPayload = Record<string, unknown>;
export type PendingCommand = SessionPendingCommand<
  Snapshot,
  CommandType,
  CommandPayload
>;
export type ServerMessage =
  | Snapshot
  | RealtimeCommandResult
  | RealtimeErrorMessage;

const normalizePlayers = (
  players: Record<string, RoomPlayer>,
): Record<string, ForSalePlayer> => Object.fromEntries(
  Object.entries(players ?? {}).map(([id, player]) => [
    id,
    {
      ...player,
      displayName: player.displayName || (player.ai ? '公平 AI' : `玩家 ${id}`),
      name: player.displayName,
    },
  ]),
);

const normalizePlayerData = (
  values: Record<string, ForSalePlayerState>,
): Record<string, NormalizedPlayerState> => Object.fromEntries(
  Object.entries(values ?? {}).map(([id, value]) => [
    id,
    {
      ...value,
      properties: value.properties ?? [],
      cheques: value.cheques ?? [],
      actionTimeoutMs: value.actionTimeoutMs == null
        ? undefined
        : Number(value.actionTimeoutMs),
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
  const view = envelope.view.forSale;
  if (!view) return;
  return {
    ...common,
    type: 'ROOM_SYNC',
    playerId: view.playerId,
    ownerID: view.ownerID,
    visibility: view.visibility as Visibility,
    playerData: normalizePlayerData(view.playerData),
    result: view.result,
    roomData: {
      ...view.roomData,
      propertyMarket: view.roomData.propertyMarket ?? [],
      chequeMarket: view.roomData.chequeMarket ?? [],
      purchases: view.roomData.purchases ?? [],
      sales: view.roomData.sales ?? [],
      actionLog: view.roomData.actionLog ?? [],
      playerOrder: view.roomData.playerOrder ?? [],
      gameStatus: view.roomData.gameStatus as GameStatus,
      transitionTimeoutMs: view.roomData.transitionTimeoutMs == null
        ? undefined
        : Number(view.roomData.transitionTimeoutMs),
      players: normalizePlayers(view.roomData.players),
    },
  };
}

export const selfID = (snapshot: Snapshot) =>
  snapshot.type === 'MATCH_SYNC' ? snapshot.playerID : snapshot.playerId;

export const playerName = (
  id: string,
  players?: Record<string, ForSalePlayer>,
) => playerDisplayName(players?.[id], id);

export const phaseKey = (snapshot?: Snapshot) =>
  snapshot ? `${snapshot.matchID}:${snapshot.seq}` : '';
