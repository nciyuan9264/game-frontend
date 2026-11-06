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
import type {
  OthelloMoveEntry,
  OthelloPositionAnalysis,
  OthelloRoomData,
  OthelloHintState,
  RoomPlayer,
} from '@/api/generated/game-platform';
import type {
  Disc,
  GameStatus,
  HintState,
  LegalMove,
  MoveEntry,
  OthelloPlayer,
  PlayerState,
  PositionAnalysis,
  Result,
  Side,
  Visibility,
} from './types';

export interface MatchSnapshot extends SessionSnapshotBase {
  type: 'MATCH_SYNC';
  ownerID: string;
  status: GameStatus;
  playerID: string;
  players: Record<string, OthelloPlayer>;
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
  hint?: HintState;
  result?: Result;
  roomData: {
    board: Disc[];
    currentPlayer: string;
    currentSide: Side;
    blackPlayerID: string;
    whitePlayerID: string;
    roundNo: number;
    gameStatus: GameStatus;
    legalMoves: LegalMove[];
    moveLog: MoveEntry[];
    lastData?: MoveEntry;
    turnDeadline?: string;
    turnTimeoutMs?: number;
    players: Record<string, OthelloPlayer>;
    playerOrder: string[];
    analysis?: PositionAnalysis;
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
  | 'game_place_disc'
  | 'game_pass'
  | 'game_resign'
  | 'game_request_hint';

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
  players: Record<string, RoomPlayer>,
): Record<string, OthelloPlayer> {
  return Object.fromEntries(Object.entries(players).map(([id, player]) => [
    id,
    {
      ...player,
      name: player.displayName,
    },
  ]));
}

function side(value: string): Side {
  return value === 'white' ? 'white' : 'black';
}

function move(entry: OthelloMoveEntry): MoveEntry {
  return {
    id: entry.id,
    kind: entry.kind,
    playerID: entry.playerID,
    side: side(entry.side),
    index: entry.index,
    flips: (entry.flips ?? []).map(Number),
    automatic: entry.automatic,
  };
}

function analysis(
  value?: OthelloPositionAnalysis,
): PositionAnalysis | undefined {
  if (!value || !value.requestID) return;
  const base = {
    requestID: value.requestID,
    exact: value.exact === true,
    engineVersion: value.engineVersion,
  };
  if (value.status === 'pending' || value.status === 'unavailable') {
    return { ...base, status: value.status };
  }
  if (value.status !== 'ready') {
    return { ...base, status: 'unavailable' };
  }
  const rates = [
    value.blackWinRate,
    value.drawRate,
    value.whiteWinRate,
  ];
  if (rates.some(rate =>
    typeof rate !== 'number'
    || !Number.isFinite(rate)
    || rate < 0
    || rate > 1
  )) {
    return { ...base, status: 'unavailable' };
  }
  const total = rates.reduce<number>((sum, rate) => sum + (rate ?? 0), 0);
  if (Math.abs(total - 1) > 1e-6) {
    return { ...base, status: 'unavailable' };
  }
  const elapsedMs = value.elapsedMs == null
    ? undefined
    : Number(value.elapsedMs);
  return {
    ...base,
    status: 'ready',
    blackWinRate: rates[0],
    drawRate: rates[1],
    whiteWinRate: rates[2],
    score: value.score,
    depth: value.depth,
    elapsedMs: Number.isFinite(elapsedMs) ? elapsedMs : undefined,
  };
}

function hint(value?: OthelloHintState): HintState | undefined {
  if (!value) return;
  const remaining = Number(value.remaining);
  const index = value.index == null ? undefined : Number(value.index);
  return {
    remaining: Number.isFinite(remaining) ? Math.max(0, remaining) : 0,
    pending: value.pending === true,
    index: typeof index === 'number'
      && Number.isInteger(index)
      && index >= 0
      && index < 64
      ? index
      : undefined,
  };
}

function roomData(room: OthelloRoomData): GameSnapshot['roomData'] {
  return {
    board: (room.board ?? []).map(value =>
      value === 'black' || value === 'white' ? value : '') as Disc[],
    currentPlayer: room.currentPlayer,
    currentSide: side(room.currentSide),
    blackPlayerID: room.blackPlayerID,
    whitePlayerID: room.whitePlayerID,
    roundNo: room.roundNo,
    gameStatus: room.gameStatus as GameStatus,
    legalMoves: (room.legalMoves ?? []).map(item => ({
      index: item.index,
      flips: (item.flips ?? []).map(Number),
      lines: (item.lines ?? []).map(line => (line ?? []).map(Number)),
    })),
    moveLog: (room.moveLog ?? []).map(move),
    lastData: room.lastData ? move(room.lastData) : undefined,
    turnDeadline: room.turnDeadline,
    turnTimeoutMs: room.turnTimeoutMs == null
      ? undefined
      : Number(room.turnTimeoutMs),
    players: normalizePlayers(room.players),
    playerOrder: room.playerOrder,
    analysis: analysis(room.analysis),
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
      playerOrder: envelope.playerOrder,
    };
  }
  const view = envelope.view.othello;
  if (!view) return;
  return {
    ...common,
    type: 'ROOM_SYNC',
    ownerID: view.ownerID,
    visibility: view.visibility as Visibility,
    playerId: view.playerId,
    playerData: Object.fromEntries(
      Object.entries(view.playerData).map(([id, state]) => [
        id,
        { side: side(state.side), discCount: state.discCount },
      ]),
    ),
    hint: hint(view.hint),
    result: view.result
      ? {
          blackCount: view.result.blackCount,
          whiteCount: view.result.whiteCount,
          winnerID: view.result.winnerID,
          winnerSide: view.result.winnerSide
            ? side(view.result.winnerSide)
            : undefined,
          draw: view.result.draw,
          reason: view.result.reason,
        }
      : undefined,
    roomData: roomData(view.roomData),
  };
}

export const selfID = (snapshot: Snapshot) =>
  snapshot.type === 'MATCH_SYNC' ? snapshot.playerID : snapshot.playerId;

export const playerName = (
  id: string,
  players?: Record<string, OthelloPlayer>,
) => playerDisplayName(players?.[id], id);
export const playerLabel = (
  id: string,
  players?: Record<string, OthelloPlayer>,
) => playerDisplayLabel(players?.[id], id);
