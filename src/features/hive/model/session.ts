import type {
  HiveActionEntry,
  HiveHex,
  HiveMoveOption,
  HivePiece,
  HivePlayerState,
  HiveReplaySnapshot,
  HiveResult,
  HiveRoomData,
  HiveStack,
  RoomPlayer,
} from '@/api/generated/game-platform';
import type {
  SessionPendingCommand,
  SessionSnapshotBase,
} from '@/features/game-core/model/session';
import {
  parseRealtimeEnvelope,
  type RealtimeCommandResult,
  type RealtimeErrorMessage,
} from '@/features/game-core/model/realtime';
import { playerDisplayLabel, playerDisplayName } from '@/features/game-core/model/room';
import type {
  ActionEntry,
  ActionKind,
  GameStatus,
  Hex,
  HivePlayer,
  MoveOption,
  Piece,
  PieceKind,
  PlayerState,
  Result,
  Side,
  Stack,
  Visibility,
} from './types';

export interface MatchSnapshot extends SessionSnapshotBase {
  type: 'MATCH_SYNC';
  ownerID: string;
  status: GameStatus;
  playerID: string;
  players: Record<string, HivePlayer>;
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
    stacks: Stack[];
    currentPlayer: string;
    currentSide: Side | '';
    whitePlayerID: string;
    blackPlayerID: string;
    firstPlayerID: string;
    roundNo: number;
    gameStatus: GameStatus;
    legalActions: MoveOption[];
    moveLog: ActionEntry[];
    lastAction?: ActionEntry;
    turnDeadline?: string;
    turnTimeoutMs?: number;
    players: Record<string, HivePlayer>;
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
  | 'game_place_piece'
  | 'game_move_piece'
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

function integer(value: unknown, minimum: number, maximum: number) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= minimum && parsed <= maximum
    ? parsed
    : undefined;
}

function side(value: unknown): Side | undefined {
  return value === 'white' || value === 'black' ? value : undefined;
}

function kind(value: unknown): PieceKind | undefined {
  return [
    'queen',
    'ant',
    'beetle',
    'grasshopper',
    'spider',
  ].includes(String(value))
    ? value as PieceKind
    : undefined;
}

function gameStatus(value: unknown): GameStatus | undefined {
  return ['match', 'waiting', 'playing', 'end'].includes(String(value))
    ? value as GameStatus
    : undefined;
}

function hex(value?: HiveHex): Hex | undefined {
  if (!value) return;
  const q = integer(value.q, -1000, 1000);
  const r = integer(value.r, -1000, 1000);
  return q == null || r == null ? undefined : { q, r };
}

function path(values: HiveHex[] | undefined): Hex[] | undefined {
  const parsed = (values ?? []).map(value => hex(value));
  return parsed.some(value => !value) ? undefined : parsed as Hex[];
}

function piece(value: HivePiece): Piece | undefined {
  const owner = side(value.side);
  const pieceKind = kind(value.kind);
  const number = integer(value.number, 1, 3);
  return owner && pieceKind && number != null && value.pieceID
    ? {
        pieceID: value.pieceID,
        side: owner,
        kind: pieceKind,
        number,
      }
    : undefined;
}

function stack(value: HiveStack): Stack | undefined {
  const position = hex(value.position);
  const pieces = (value.pieces ?? []).map(item => piece(item));
  return position && pieces.length > 0 && !pieces.some(item => !item)
    ? { position, pieces: pieces as Piece[] }
    : undefined;
}

function moveOption(value: HiveMoveOption): MoveOption | undefined {
  const actionKind = value.kind === 'place' || value.kind === 'move'
    ? value.kind
    : undefined;
  const to = hex(value.to);
  const parsedPath = path(value.path);
  return actionKind && value.pieceID && to && parsedPath
    ? {
        kind: actionKind,
        pieceID: value.pieceID,
        to,
        path: parsedPath,
      }
    : undefined;
}

function action(value: HiveActionEntry): ActionEntry | undefined {
  const owner = side(value.side);
  const id = integer(value.id, 1, Number.MAX_SAFE_INTEGER);
  const actionKind = ['place', 'move', 'pass', 'resign'].includes(value.kind)
    ? value.kind as ActionKind
    : undefined;
  const from = value.from ? hex(value.from) : undefined;
  const to = value.to ? hex(value.to) : undefined;
  const parsedPath = path(value.path);
  if (
    !owner
    || id == null
    || !actionKind
    || !value.playerID
    || !parsedPath
    || (actionKind === 'place' && (!value.pieceID || !to))
    || (actionKind === 'move' && (!value.pieceID || !from || !to))
  ) {
    return;
  }
  return {
    id,
    kind: actionKind,
    playerID: value.playerID,
    side: owner,
    pieceID: value.pieceID || undefined,
    from,
    to,
    path: parsedPath,
    automatic: value.automatic === true,
  };
}

function reserveByKind(
  value: Record<string, number>,
): Record<PieceKind, number> | undefined {
  const entries = ([
    'queen',
    'ant',
    'beetle',
    'grasshopper',
    'spider',
  ] as const).map(pieceKind => [
    pieceKind,
    integer(value?.[pieceKind], 0, 3),
  ] as const);
  return entries.some(([, count]) => count == null)
    ? undefined
    : Object.fromEntries(entries) as Record<PieceKind, number>;
}

function playerState(value: HivePlayerState): PlayerState | undefined {
  const owner = side(value.side);
  const turnsTaken = integer(value.turnsTaken, 0, 1000);
  const queenPressure = integer(value.queenPressure, 0, 6);
  const reserve = reserveByKind(value.reserveByKind);
  return owner
    && turnsTaken != null
    && queenPressure != null
    && reserve
    ? {
        side: owner,
        turnsTaken,
        queenPlaced: value.queenPlaced === true,
        queenPressure,
        reserveByKind: reserve,
      }
    : undefined;
}

function normalizePlayers(
  players: Record<string, RoomPlayer> | null | undefined,
): Record<string, HivePlayer> {
  return Object.fromEntries(Object.entries(players ?? {}).map(([id, player]) => [
    id,
    { ...player, name: player.displayName },
  ]));
}

function parseRoomData(
  room: HiveRoomData,
): GameSnapshot['roomData'] | undefined {
  const parsedStacks = (room.stacks ?? []).map(value => stack(value));
  const legalActions = (room.legalActions ?? []).map(value => moveOption(value));
  const moveLog = (room.moveLog ?? []).map(value => action(value));
  const currentSide = room.currentSide === '' ? '' : side(room.currentSide);
  const status = gameStatus(room.gameStatus);
  const roundNo = integer(room.roundNo, 1, Number.MAX_SAFE_INTEGER);
  const lastAction = room.lastAction ? action(room.lastAction) : undefined;
  const timeout = room.turnTimeoutMs == null
    ? undefined
    : Number(room.turnTimeoutMs);
  if (
    parsedStacks.some(value => !value)
    || legalActions.some(value => !value)
    || moveLog.some(value => !value)
    || currentSide == null
    || !status
    || roundNo == null
    || (room.lastAction && !lastAction)
    || (timeout != null && (!Number.isSafeInteger(timeout) || timeout < 0))
  ) {
    return;
  }
  return {
    stacks: parsedStacks as Stack[],
    currentPlayer: room.currentPlayer,
    currentSide,
    whitePlayerID: room.whitePlayerID,
    blackPlayerID: room.blackPlayerID,
    firstPlayerID: room.firstPlayerID,
    roundNo,
    gameStatus: status,
    legalActions: legalActions as MoveOption[],
    moveLog: moveLog as ActionEntry[],
    lastAction,
    turnDeadline: room.turnDeadline,
    turnTimeoutMs: timeout,
    players: normalizePlayers(room.players),
    playerOrder: room.playerOrder ?? [],
  };
}

function parseResult(value?: HiveResult): Result | undefined {
  if (!value) return;
  const winnerSide = value.winnerSide == null || value.winnerSide === ''
    ? undefined
    : side(value.winnerSide);
  const turnCount = integer(value.turnCount, 0, Number.MAX_SAFE_INTEGER);
  const placedPieceCount = integer(value.placedPieceCount, 0, 22);
  const maxStackHeight = integer(value.maxStackHeight, 0, 22);
  return turnCount != null
    && placedPieceCount != null
    && maxStackHeight != null
    && (value.winnerSide == null || value.winnerSide === '' || winnerSide)
    ? {
        winnerID: value.winnerID || undefined,
        winnerSide,
        draw: value.draw === true,
        reason: value.reason,
        turnCount,
        placedPieceCount,
        maxStackHeight,
      }
    : undefined;
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
    const status = gameStatus(envelope.status);
    if (!status || !['public', 'private'].includes(envelope.visibility)) return;
    return {
      ...common,
      type: 'MATCH_SYNC',
      ownerID: envelope.ownerID,
      status,
      playerID: envelope.playerID,
      players: normalizePlayers(envelope.players),
      visibility: envelope.visibility as Visibility,
      maxPlayers: envelope.maxPlayers,
      playerOrder: envelope.playerOrder ?? [],
    };
  }
  const view = envelope.view.hive;
  if (!view || !['public', 'private'].includes(view.visibility)) return;
  const roomData = parseRoomData(view.roomData);
  const entries = Object.entries(view.playerData ?? {}).map(
    ([id, state]) => [id, playerState(state)] as const,
  );
  const result = view.result ? parseResult(view.result) : undefined;
  if (
    !roomData
    || entries.some(([, state]) => !state)
    || (view.result && !result)
  ) {
    return;
  }
  return {
    ...common,
    type: 'ROOM_SYNC',
    ownerID: view.ownerID,
    visibility: view.visibility as Visibility,
    playerId: view.playerId,
    playerData: Object.fromEntries(entries) as Record<string, PlayerState>,
    result,
    roomData,
  };
}

export function parseReplaySnapshot(
  value: Pick<
    HiveReplaySnapshot,
    'seq' | 'roomData' | 'playersData' | 'result'
  >,
  viewer: string,
  roomID: string,
): GameSnapshot | undefined {
  const roomData = parseRoomData(value.roomData);
  const entries = Object.entries(value.playersData ?? {}).map(
    ([id, state]) => [id, playerState(state)] as const,
  );
  const result = value.result ? parseResult(value.result) : undefined;
  if (
    !roomData
    || entries.some(([, state]) => !state)
    || (value.result && !result)
  ) {
    return;
  }
  return {
    schemaVersion: 2,
    type: 'ROOM_SYNC',
    roomID,
    matchID: `replay:${roomID}`,
    seq: value.seq,
    phaseVersion: value.seq + 1,
    turnNumber: value.seq + 1,
    ownerID: roomData.playerOrder[0] ?? '',
    visibility: 'public',
    playerId: viewer,
    playerData: Object.fromEntries(entries) as Record<string, PlayerState>,
    result,
    roomData,
  };
}

export const selfID = (snapshot: Snapshot) =>
  snapshot.type === 'MATCH_SYNC' ? snapshot.playerID : snapshot.playerId;

export const playerName = (
  id: string,
  players?: Record<string, HivePlayer>,
) => playerDisplayName(players?.[id], id);
export const playerLabel = (
  id: string,
  players?: Record<string, HivePlayer>,
) => playerDisplayLabel(players?.[id], id);
