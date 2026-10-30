import type {
  SessionPendingCommand,
  SessionSnapshotBase,
} from '@/features/game-core/model/session';
import { playerDisplayLabel, playerDisplayName } from '@/features/game-core/model/room';
import {
  parseRealtimeEnvelope,
  type RealtimeCommandResult,
  type RealtimeErrorMessage,
} from '@/features/game-core/model/realtime';
import type { RoomPlayer } from '@/api/generated/game-platform';
import type {
  GameStatus,
  LastAction,
  MoveOption,
  PlayerState,
  Result,
  Row,
  Side,
  Visibility,
  YinshPlayer,
} from './types';

export interface MatchSnapshot extends SessionSnapshotBase {
  type: 'MATCH_SYNC';
  ownerID: string;
  status: GameStatus;
  playerID: string;
  players: Record<string, YinshPlayer>;
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
  result?: Result;
  roomData: {
    rings: Record<string, Side>;
    markers: Record<string, Side>;
    currentPlayer: string;
    moverPlayer?: string;
    resolverPlayer?: string;
    gameStatus: GameStatus;
    placedRings: Record<Side, number>;
    markerPool: number;
    legalMoves: Record<string, MoveOption[]>;
    candidateRows: Row[];
    lastAction?: LastAction;
    activity: LastAction[];
    turnDeadline?: string;
    turnTimeoutMs?: number;
    players: Record<string, YinshPlayer>;
    playerOrder: string[];
    roundNo: number;
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
  | 'game_place_ring'
  | 'game_move_ring'
  | 'game_remove_row'
  | 'game_remove_ring'
  | 'game_resign';

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
  players: Record<string, RoomPlayer> | null | undefined,
): Record<string, YinshPlayer> {
  return Object.fromEntries(Object.entries(players ?? {}).map(([id, player]) => [
    id,
    {
      ...player,
      name: player.displayName,
    },
  ]));
}

function recordValue(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

function normalizeMoves(value: unknown): Record<string, MoveOption[]> {
  return Object.fromEntries(Object.entries(recordValue(value)).map(([pointID, moves]) => [
    pointID,
    Array.isArray(moves) ? moves.flatMap(move => {
      const candidate = recordValue(move);
      return typeof candidate.to === 'string'
        ? [{ to: candidate.to, flips: stringArray(candidate.flips) }]
        : [];
    }) : [],
  ]));
}

function normalizeRows(value: unknown): Row[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap(row => {
    const candidate = recordValue(row);
    const points = stringArray(candidate.points);
    const owner = candidate.owner;
    return typeof candidate.id === 'string'
      && points.length >= 5
      && (owner === 'white' || owner === 'black')
      ? [{ id: candidate.id, points, owner }]
      : [];
  });
}

function parsePayloadJSON(value?: string): Record<string, unknown> | undefined {
  if (!value) return;
  try {
    const payload = JSON.parse(value);
    return payload && typeof payload === 'object'
      ? payload as Record<string, unknown>
      : undefined;
  } catch {
    return;
  }
}

function normalizeAction(action?: {
  action: string;
  playerID: string;
  payloadJSON?: string;
} | null): LastAction | undefined {
  if (!action) return;
  return {
    action: action.action,
    playerID: action.playerID,
    payload: parsePayloadJSON(action.payloadJSON),
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
    return {
      ...common,
      type: 'MATCH_SYNC',
      ownerID: envelope.ownerID,
      status: envelope.status as GameStatus,
      playerID: envelope.playerID,
      players: normalizePlayers(envelope.players),
      visibility: envelope.visibility as Visibility,
      maxPlayers: envelope.maxPlayers,
      playerOrder: stringArray(envelope.playerOrder),
    };
  }
  const view = envelope.view.yinsh;
  if (!view) return;
  const room = view.roomData;
  return {
    ...common,
    type: 'ROOM_SYNC',
    ownerID: view.ownerID,
    visibility: view.visibility as Visibility,
    playerId: view.playerId,
    playerData: view.playerData as Record<string, PlayerState>,
    result: view.result as Result | undefined,
    roomData: {
      rings: room.rings as Record<string, Side>,
      markers: room.markers as Record<string, Side>,
      currentPlayer: room.currentPlayer,
      moverPlayer: room.moverPlayer,
      resolverPlayer: room.resolverPlayer,
      gameStatus: room.gameStatus as GameStatus,
      placedRings: room.placedRings as Record<Side, number>,
      markerPool: room.markerPool,
      legalMoves: normalizeMoves(room.legalMoves),
      candidateRows: normalizeRows(room.candidateRows),
      lastAction: normalizeAction(room.lastAction),
      activity: (Array.isArray(room.activity) ? room.activity : []).flatMap(action => {
        const normalized = normalizeAction(action);
        return normalized ? [normalized] : [];
      }),
      turnDeadline: room.turnDeadline,
      turnTimeoutMs: room.turnTimeoutMs == null
        ? undefined
        : Number(room.turnTimeoutMs),
      players: normalizePlayers(room.players),
      playerOrder: stringArray(room.playerOrder),
      roundNo: room.roundNo,
    },
  };
}

export const selfID = (snapshot: Snapshot) =>
  snapshot.type === 'MATCH_SYNC' ? snapshot.playerID : snapshot.playerId;

export const playerName = (
  id: string,
  players?: Record<string, YinshPlayer>,
) => playerDisplayName(players?.[id], id);
export const playerLabel = (
  id: string,
  players?: Record<string, YinshPlayer>,
) => playerDisplayLabel(players?.[id], id);
