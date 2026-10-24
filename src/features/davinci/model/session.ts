import type {
  DavinciRoomData,
  DavinciRoomView,
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
  Card,
  DavinciPlayer,
  GameStatus,
} from './types';

export interface LastGuessPayload {
  targetCardID: string;
  targetPlayerID: string;
  guessNum: number;
  correct: boolean;
}

export interface LastAction {
  action: string;
  playerID: string;
  payload?: LastGuessPayload;
}

type NormalizedRoomData = Omit<
  DavinciRoomData,
  'gameStatus' | 'players' | 'lastData' | 'turnTimeoutMs'
> & {
  gameStatus: GameStatus;
  players: Record<string, DavinciPlayer>;
  lastData?: LastAction;
  turnTimeoutMs?: number;
};

export interface MatchSnapshot extends SessionSnapshotBase {
  type: 'MATCH_SYNC';
  ownerID: string;
  status: GameStatus;
  playerID: string;
  players: Record<string, DavinciPlayer>;
  maxPlayers: number;
  playerOrder: string[];
}

export type GameSnapshot = SessionSnapshotBase & Omit<
  DavinciRoomView,
  'roomData'
> & {
  type: 'ROOM_SYNC';
  roomData: NormalizedRoomData;
};

export type Snapshot = MatchSnapshot | GameSnapshot;
export type CommandType =
  | 'match_ready'
  | 'match_begin'
  | 'match_add_ai'
  | 'match_remove_player'
  | 'game_ready'
  | 'game_get_card'
  | 'game_guess_card'
  | 'game_set_card'
  | 'game_initialize_hand'
  | 'game_play_audio';
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

function normalizePlayers(
  players: Record<string, DavinciPlayer>,
): Record<string, DavinciPlayer> {
  return Object.fromEntries(Object.entries(players).map(([id, player]) => [
    id,
    {
      ...player,
      name: player.name || player.displayName,
    },
  ]));
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
    return {
      ...common,
      type: 'MATCH_SYNC',
      ownerID: envelope.ownerID,
      status: envelope.status as GameStatus,
      playerID: envelope.playerID,
      players: normalizePlayers(envelope.players),
      maxPlayers: envelope.maxPlayers,
      playerOrder: envelope.playerOrder,
    };
  }
  const view = envelope.view.davinci;
  if (!view) return;
  return {
    ...common,
    type: 'ROOM_SYNC',
    playerId: view.playerId,
    ownerID: view.ownerID,
    cardData: {
      self: view.cardData.self as Card[],
      opponents: view.cardData.opponents as Card[],
      initialHandReady: view.cardData.initialHandReady === true,
    },
    result: view.result,
    roomData: {
      ...view.roomData,
      gameStatus: view.roomData.gameStatus as GameStatus,
      players: normalizePlayers(view.roomData.players),
      lastData: view.roomData.lastData as LastAction | undefined,
      turnTimeoutMs: view.roomData.turnTimeoutMs == null
        ? undefined
        : Number(view.roomData.turnTimeoutMs),
    },
  };
}

export const selfID = (snapshot: Snapshot) =>
  snapshot.type === 'MATCH_SYNC' ? snapshot.playerID : snapshot.playerId;

export const playerName = (
  id: string,
  players: Record<string, DavinciPlayer>,
) => playerDisplayName(players[id], id);
