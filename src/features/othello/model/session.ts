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
  OthelloRoomData,
  RoomPlayer,
} from '@/api/generated/game-platform';
import type {
  Disc,
  GameStatus,
  LegalMove,
  MoveEntry,
  OthelloPlayer,
  PlayerState,
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
