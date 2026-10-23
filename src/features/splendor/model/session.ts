import type {
  SessionPendingCommand,
  SessionSnapshotBase,
} from '@/features/game-core/model/session';
import {
  parseRealtimeEnvelope,
  type RealtimeCommandResult,
  type RealtimeErrorMessage,
} from '@/features/game-core/model/realtime';
import type {
  DevelopmentCard,
  GameStatus,
  Noble,
  PlayerState,
  SplendorPlayer,
  SplendorResult,
  Visibility,
} from './types';

export interface LastAction {
  action: string;
  playerID: string;
  payload?: unknown;
}

export interface MatchSnapshot extends SessionSnapshotBase {
  type: 'MATCH_SYNC';
  ownerID: string;
  status: GameStatus;
  playerID: string;
  players: Record<string, SplendorPlayer>;
  visibility: Visibility;
  maxPlayers: number;
  playerOrder: string[];
}

export interface GameSnapshot extends SessionSnapshotBase {
  type: 'ROOM_SYNC';
  ownerID: string;
  visibility: Visibility;
  playerId: string;
  playerData: Record<string, PlayerState>;
  result?: Record<string, SplendorResult> | null;
  roomData: {
    card: Record<string, DevelopmentCard[]>;
    deckCounts?: Partial<Record<1 | 2 | 3, number>>;
    gems: Record<string, number>;
    nobles: Noble[];
    currentPlayer: string;
    gameStatus: GameStatus;
    lastData?: LastAction;
    turnDeadline?: string;
    turnTimeoutMs?: number;
    players: Record<string, SplendorPlayer>;
    playerOrder: string[];
    phaseVersion?: number;
    turnNumber?: number;
  };
}

export type Snapshot = MatchSnapshot | GameSnapshot;
export type DisplaySnapshot = Pick<
  GameSnapshot,
  'playerId' | 'playerData' | 'roomData' | 'result'
>;
export type CommandType =
  | 'match_ready'
  | 'match_begin'
  | 'match_add_ai'
  | 'match_remove_player'
  | 'room_update_settings'
  | 'game_ready'
  | 'game_get_gem'
  | 'game_buy_card'
  | 'game_preserve_card';

export type PendingCommand = SessionPendingCommand<
  Snapshot,
  CommandType,
  unknown
>;

export type ServerMessage =
  | Snapshot
  | RealtimeCommandResult
  | RealtimeErrorMessage;

function normalizePlayers(
  players: Record<string, SplendorPlayer>,
): Record<string, SplendorPlayer> {
  return Object.fromEntries(Object.entries(players).map(([id, player]) => [
    id,
    {
      ...player,
      name: player.name || player.displayName,
    },
  ]));
}

function parsePayloadJSON(value?: string): unknown {
  if (!value) return;
  try {
    return JSON.parse(value);
  } catch {
    return;
  }
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
      visibility: envelope.visibility as Visibility,
      maxPlayers: envelope.maxPlayers,
      playerOrder: envelope.playerOrder,
    };
  }
  const view = envelope.view.splendor;
  if (!view) return;
  const lastData = view.roomData.lastData;
  return {
    ...common,
    type: 'ROOM_SYNC',
    ownerID: view.ownerID,
    visibility: view.visibility as Visibility,
    playerId: view.playerId,
    playerData: view.playerData as Record<string, PlayerState>,
    result: view.result as Record<string, SplendorResult> | undefined,
    roomData: {
      card: view.roomData.card as Record<string, DevelopmentCard[]>,
      deckCounts: view.roomData.deckCounts as Partial<Record<1 | 2 | 3, number>>,
      gems: view.roomData.gems,
      nobles: view.roomData.nobles as Noble[],
      currentPlayer: view.roomData.currentPlayer,
      gameStatus: view.roomData.gameStatus as GameStatus,
      lastData: lastData
        ? {
            action: lastData.action,
            playerID: lastData.playerID,
            payload: parsePayloadJSON(lastData.payloadJSON),
          }
        : undefined,
      turnDeadline: view.roomData.turnDeadline,
      turnTimeoutMs: view.roomData.turnTimeoutMs == null
        ? undefined
        : Number(view.roomData.turnTimeoutMs),
      players: normalizePlayers(view.roomData.players),
      playerOrder: view.roomData.playerOrder,
      phaseVersion: envelope.seq,
      turnNumber: envelope.seq,
    },
  };
}

export const selfID = (snapshot: Snapshot) =>
  snapshot.type === 'MATCH_SYNC' ? snapshot.playerID : snapshot.playerId;

export const playerName = (
  id: string,
  players?: Record<string, SplendorPlayer>,
) => players?.[id]?.name || id.replace(/-\d+$/, '');
