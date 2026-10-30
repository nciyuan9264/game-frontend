import type {
  HexActionEntry,
  HexCell,
  HexPlayerState,
  HexReplaySnapshot,
  HexResult,
  HexRoomData,
  RoomPlayer,
} from '@/api/generated/game-platform';
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
import { BOARD_CELL_COUNT, BOARD_SIZE } from './board';
import type {
  ActionEntry,
  Cell,
  GameStatus,
  HexPlayer,
  PlayerState,
  Result,
  Side,
  Stone,
  Visibility,
} from './types';

export interface MatchSnapshot extends SessionSnapshotBase {
  type: 'MATCH_SYNC';
  ownerID: string;
  status: GameStatus;
  playerID: string;
  players: Record<string, HexPlayer>;
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
    boardSize: number;
    board: Stone[];
    currentPlayer: string;
    currentSide: Side | '';
    redPlayerID: string;
    tealPlayerID: string;
    firstPlayerID: string;
    roundNo: number;
    gameStatus: GameStatus;
    pieRule: boolean;
    swapAvailable: boolean;
    legalMoves: Cell[];
    winningPath: Cell[];
    moveLog: ActionEntry[];
    lastAction?: ActionEntry;
    turnDeadline?: string;
    turnTimeoutMs?: number;
    players: Record<string, HexPlayer>;
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
  | 'game_place_stone'
  | 'game_swap'
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

function side(value: unknown): Side | undefined {
  return value === 'red' || value === 'teal' ? value : undefined;
}

function integer(value: unknown, minimum: number, maximum: number) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= minimum && parsed <= maximum
    ? parsed
    : undefined;
}

function cell(value: HexCell | undefined): Cell | undefined {
  if (!value) return;
  const row = integer(value.row, 0, BOARD_SIZE - 1);
  const column = integer(value.column, 0, BOARD_SIZE - 1);
  return row == null || column == null ? undefined : { row, column };
}

function action(value: HexActionEntry): ActionEntry | undefined {
  const owner = side(value.side);
  const id = integer(value.id, 1, Number.MAX_SAFE_INTEGER);
  const kind = ['place', 'swap', 'resign'].includes(value.kind)
    ? value.kind as ActionEntry['kind']
    : undefined;
  const actionCell = value.cell ? cell(value.cell) : undefined;
  if (!owner || id == null || !kind || !value.playerID) return;
  if (kind === 'place' && !actionCell) return;
  if (kind !== 'place' && value.cell) return;
  return {
    id,
    kind,
    playerID: value.playerID,
    side: owner,
    cell: actionCell,
    automatic: value.automatic === true,
  };
}

function playerState(value: HexPlayerState): PlayerState | undefined {
  const owner = side(value.side);
  const stoneCount = integer(value.stoneCount, 0, BOARD_CELL_COUNT);
  return owner && stoneCount != null ? { side: owner, stoneCount } : undefined;
}

function normalizePlayers(
  players: Record<string, RoomPlayer>,
): Record<string, HexPlayer> {
  return Object.fromEntries(Object.entries(players ?? {}).map(([id, player]) => [
    id,
    { ...player, name: player.displayName },
  ]));
}

function parseCells(values: HexCell[]) {
  const parsed = values.map(value => cell(value));
  return parsed.some(value => !value) ? undefined : parsed as Cell[];
}

function parseActions(values: HexActionEntry[]) {
  const parsed = values.map(value => action(value));
  return parsed.some(value => !value) ? undefined : parsed as ActionEntry[];
}

function parseRoomData(
  room: HexRoomData,
): GameSnapshot['roomData'] | undefined {
  const boardSize = integer(room.boardSize, BOARD_SIZE, BOARD_SIZE);
  const board = (room.board ?? []).map(value =>
    value === '' ? '' : side(value));
  const currentSide = room.currentSide === '' ? '' : side(room.currentSide);
  const gameStatus = ['match', 'waiting', 'playing', 'end'].includes(
    room.gameStatus,
  ) ? room.gameStatus as GameStatus : undefined;
  const legalMoves = parseCells(room.legalMoves ?? []);
  const winningPath = parseCells(room.winningPath ?? []);
  const moveLog = parseActions(room.moveLog ?? []);
  const lastAction = room.lastAction ? action(room.lastAction) : undefined;
  const roundNo = integer(room.roundNo, 1, Number.MAX_SAFE_INTEGER);
  const timeout = room.turnTimeoutMs == null
    ? undefined
    : Number(room.turnTimeoutMs);
  if (
    boardSize == null
    || board.length !== BOARD_CELL_COUNT
    || board.some(value => value == null)
    || currentSide == null
    || !gameStatus
    || !legalMoves
    || !winningPath
    || !moveLog
    || roundNo == null
    || (room.lastAction && !lastAction)
    || (timeout != null && (!Number.isSafeInteger(timeout) || timeout < 0))
  ) {
    return;
  }
  return {
    boardSize,
    board: board as Stone[],
    currentPlayer: room.currentPlayer,
    currentSide,
    redPlayerID: room.redPlayerID,
    tealPlayerID: room.tealPlayerID,
    firstPlayerID: room.firstPlayerID,
    roundNo,
    gameStatus,
    pieRule: room.pieRule === true,
    swapAvailable: room.swapAvailable === true,
    legalMoves,
    winningPath,
    moveLog,
    lastAction,
    turnDeadline: room.turnDeadline,
    turnTimeoutMs: timeout,
    players: normalizePlayers(room.players),
    playerOrder: room.playerOrder ?? [],
  };
}

function parseResult(value: HexResult | undefined): Result | undefined {
  if (!value) return;
  const winnerSide = value.winnerSide == null || value.winnerSide === ''
    ? undefined
    : side(value.winnerSide);
  const turnCount = integer(value.turnCount, 0, BOARD_CELL_COUNT + 1);
  const pathLength = integer(value.pathLength, 0, BOARD_CELL_COUNT);
  const redStoneCount = integer(value.redStoneCount, 0, BOARD_CELL_COUNT);
  const tealStoneCount = integer(value.tealStoneCount, 0, BOARD_CELL_COUNT);
  if (
    turnCount == null || pathLength == null
    || redStoneCount == null || tealStoneCount == null
    || (value.winnerSide && !winnerSide)
  ) {
    return;
  }
  return {
    winnerID: value.winnerID || undefined,
    winnerSide,
    reason: value.reason,
    turnCount,
    pathLength,
    redStoneCount,
    tealStoneCount,
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
    const status = ['match', 'waiting', 'playing', 'end'].includes(
      envelope.status,
    ) ? envelope.status as GameStatus : undefined;
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
      playerOrder: envelope.playerOrder,
    };
  }
  const view = envelope.view.hex;
  if (!view || !['public', 'private'].includes(view.visibility)) return;
  const roomData = parseRoomData(view.roomData);
  const playerEntries = Object.entries(view.playerData ?? {}).map(
    ([id, value]) => [id, playerState(value)] as const,
  );
  const result = view.result ? parseResult(view.result) : undefined;
  if (
    !roomData
    || playerEntries.some(([, value]) => !value)
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
    playerData: Object.fromEntries(playerEntries) as Record<string, PlayerState>,
    result,
    roomData,
  };
}

export function parseReplaySnapshot(
  value: Pick<
    HexReplaySnapshot,
    'seq' | 'roomData' | 'playersData' | 'result'
  >,
  viewer: string,
  roomID: string,
): GameSnapshot | undefined {
  const roomData = parseRoomData(value.roomData);
  const playerEntries = Object.entries(value.playersData ?? {}).map(
    ([id, state]) => [id, playerState(state)] as const,
  );
  const result = value.result ? parseResult(value.result) : undefined;
  if (
    !roomData
    || playerEntries.some(([, state]) => !state)
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
    phaseVersion: value.seq,
    turnNumber: value.seq,
    ownerID: '',
    visibility: 'private',
    playerId: viewer,
    playerData: Object.fromEntries(playerEntries) as Record<string, PlayerState>,
    result,
    roomData,
  };
}

export function playerName(
  id: string,
  players?: Record<string, HexPlayer>,
) {
  return playerDisplayName(players?.[id], id);
}

export function playerLabel(
  id: string,
  players?: Record<string, HexPlayer>,
) {
  return playerDisplayLabel(players?.[id], id);
}

export function selfID(snapshot: Snapshot) {
  return snapshot.type === 'MATCH_SYNC'
    ? snapshot.playerID
    : snapshot.playerId;
}
