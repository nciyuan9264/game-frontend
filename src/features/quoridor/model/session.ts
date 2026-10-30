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
  QuoridorActionEntry,
  QuoridorCell,
  QuoridorPlayerState,
  QuoridorReplaySnapshot,
  QuoridorResult,
  QuoridorRoomData,
  QuoridorWall,
  QuoridorWallOption,
  QuoridorWallSpec,
  RoomPlayer,
} from '@/api/generated/game-platform';
import type {
  ActionEntry,
  Cell,
  GameStatus,
  Orientation,
  PlayerState,
  QuoridorPlayer,
  Result,
  Side,
  Visibility,
  Wall,
  WallOption,
  WallSpec,
} from './types';

export interface MatchSnapshot extends SessionSnapshotBase {
  type: 'MATCH_SYNC';
  ownerID: string;
  status: GameStatus;
  playerID: string;
  players: Record<string, QuoridorPlayer>;
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
    pawns: Record<Side, Cell>;
    walls: Wall[];
    wallStock: Record<Side, number>;
    currentPlayer: string;
    currentSide: Side | '';
    southPlayerID: string;
    northPlayerID: string;
    firstPlayerID: string;
    roundNo: number;
    gameStatus: GameStatus;
    legalMoves: Cell[];
    wallOptions: WallOption[];
    referencePaths: Record<Side, Cell[]>;
    moveLog: ActionEntry[];
    lastAction?: ActionEntry;
    turnDeadline?: string;
    turnTimeoutMs?: number;
    players: Record<string, QuoridorPlayer>;
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
  | 'game_move_pawn'
  | 'game_place_wall'
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
  return value === 'south' || value === 'north' ? value : undefined;
}

function orientation(value: unknown): Orientation | undefined {
  return value === 'h' || value === 'v' ? value : undefined;
}

function integer(value: unknown, minimum: number, maximum: number) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= minimum && parsed <= maximum
    ? parsed
    : undefined;
}

function cell(value: QuoridorCell | undefined, maximum = 8): Cell | undefined {
  if (!value) return;
  const row = integer(value.row, 0, maximum);
  const column = integer(value.column, 0, maximum);
  return row == null || column == null ? undefined : { row, column };
}

function wallSpec(value: QuoridorWallSpec | undefined): WallSpec | undefined {
  const position = cell(value, 7);
  const direction = orientation(value?.orientation);
  return position && direction
    ? { ...position, orientation: direction }
    : undefined;
}

function wall(value: QuoridorWall): Wall | undefined {
  const spec = wallSpec(value);
  const owner = side(value.side);
  return spec && owner ? { ...spec, side: owner } : undefined;
}

function wallOption(value: QuoridorWallOption): WallOption | undefined {
  const spec = wallSpec(value);
  return spec
    ? {
        ...spec,
        legal: value.legal === true,
        reasonCode: typeof value.reasonCode === 'string'
          ? value.reasonCode
          : undefined,
      }
    : undefined;
}

function action(value: QuoridorActionEntry): ActionEntry | undefined {
  const owner = side(value.side);
  const id = integer(value.id, 1, Number.MAX_SAFE_INTEGER);
  if (
    !owner
    || id == null
    || typeof value.playerID !== 'string'
    || !['move', 'wall', 'resign'].includes(value.kind)
  ) {
    return;
  }
  const from = value.from ? cell(value.from) : undefined;
  const to = value.to ? cell(value.to) : undefined;
  const placedWall = value.wall ? wallSpec(value.wall) : undefined;
  if (value.kind === 'move' && (!from || !to)) return;
  if (value.kind === 'wall' && !placedWall) return;
  return {
    id,
    kind: value.kind as ActionEntry['kind'],
    playerID: value.playerID,
    side: owner,
    from,
    to,
    wall: placedWall,
    automatic: value.automatic === true,
  };
}

function playerState(value: QuoridorPlayerState): PlayerState | undefined {
  const owner = side(value.side);
  const wallsRemaining = integer(value.wallsRemaining, 0, 10);
  const distanceToGoal = integer(value.distanceToGoal, 0, 80);
  return owner && wallsRemaining != null && distanceToGoal != null
    ? { side: owner, wallsRemaining, distanceToGoal }
    : undefined;
}

function normalizePlayers(
  players: Record<string, RoomPlayer>,
): Record<string, QuoridorPlayer> {
  return Object.fromEntries(Object.entries(players ?? {}).map(([id, player]) => [
    id,
    { ...player, name: player.displayName },
  ]));
}

function compactMap<T>(values: T[], parse: (value: T) => T | undefined) {
  const result = values.map(parse);
  return result.some(value => !value) ? undefined : result as T[];
}

function parseRoomData(
  room: QuoridorRoomData,
): GameSnapshot['roomData'] | undefined {
  const southPawn = cell(room.pawns?.south);
  const northPawn = cell(room.pawns?.north);
  const currentSide = room.currentSide === '' ? '' : side(room.currentSide);
  const gameStatus = ['match', 'waiting', 'playing', 'end'].includes(room.gameStatus)
    ? room.gameStatus as GameStatus
    : undefined;
  const southStock = integer(room.wallStock?.south, 0, 10);
  const northStock = integer(room.wallStock?.north, 0, 10);
  const walls = compactMap(
    room.walls ?? [],
    value => wall(value) as QuoridorWall | undefined,
  ) as Wall[] | undefined;
  const legalMoves = compactMap(
    room.legalMoves ?? [],
    value => cell(value) as QuoridorCell | undefined,
  ) as Cell[] | undefined;
  const wallOptions = compactMap(
    room.wallOptions ?? [],
    value => wallOption(value) as QuoridorWallOption | undefined,
  ) as WallOption[] | undefined;
  const moveLog = compactMap(
    room.moveLog ?? [],
    value => action(value) as QuoridorActionEntry | undefined,
  ) as ActionEntry[] | undefined;
  const southPath = (room.referencePaths?.south ?? []).map(value => cell(value));
  const northPath = (room.referencePaths?.north ?? []).map(value => cell(value));
  const roundNo = integer(room.roundNo, 1, Number.MAX_SAFE_INTEGER);
  const lastAction = room.lastAction ? action(room.lastAction) : undefined;
  if (
    !southPawn
    || !northPawn
    || currentSide == null
    || !gameStatus
    || southStock == null
    || northStock == null
    || !walls
    || !legalMoves
    || !wallOptions
    || !moveLog
    || southPath.some(value => !value)
    || northPath.some(value => !value)
    || roundNo == null
    || (room.lastAction && !lastAction)
  ) {
    return;
  }
  const timeout = room.turnTimeoutMs == null
    ? undefined
    : Number(room.turnTimeoutMs);
  if (timeout != null && (!Number.isSafeInteger(timeout) || timeout < 0)) return;
  return {
    pawns: { south: southPawn, north: northPawn },
    walls,
    wallStock: { south: southStock, north: northStock },
    currentPlayer: room.currentPlayer,
    currentSide,
    southPlayerID: room.southPlayerID,
    northPlayerID: room.northPlayerID,
    firstPlayerID: room.firstPlayerID,
    roundNo,
    gameStatus,
    legalMoves,
    wallOptions,
    referencePaths: {
      south: southPath as Cell[],
      north: northPath as Cell[],
    },
    moveLog,
    lastAction,
    turnDeadline: room.turnDeadline,
    turnTimeoutMs: timeout,
    players: normalizePlayers(room.players),
    playerOrder: room.playerOrder ?? [],
  };
}

function parseResult(value: QuoridorResult | undefined): Result | undefined {
  if (!value) return;
  const winnerSide = value.winnerSide == null || value.winnerSide === ''
    ? undefined
    : side(value.winnerSide);
  const turnCount = integer(value.turnCount, 0, Number.MAX_SAFE_INTEGER);
  const placedWallCount = integer(value.placedWallCount, 0, 20);
  return (
    turnCount != null
    && placedWallCount != null
    && (value.winnerSide == null || value.winnerSide === '' || winnerSide)
  )
    ? {
        winnerID: value.winnerID || undefined,
        winnerSide,
        reason: value.reason,
        turnCount,
        placedWallCount,
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
    const status = ['match', 'waiting', 'playing', 'end'].includes(envelope.status)
      ? envelope.status as GameStatus
      : undefined;
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
  const view = envelope.view.quoridor;
  if (!view || !['public', 'private'].includes(view.visibility)) return;
  const parsedRoom = parseRoomData(view.roomData);
  if (!parsedRoom) return;
  const playerDataEntries = Object.entries(view.playerData ?? {}).map(
    ([id, state]) => [id, playerState(state)] as const,
  );
  if (playerDataEntries.some(([, state]) => !state)) return;
  const result = view.result ? parseResult(view.result) : undefined;
  if (view.result && !result) return;
  return {
    ...common,
    type: 'ROOM_SYNC',
    ownerID: view.ownerID,
    visibility: view.visibility as Visibility,
    playerId: view.playerId,
    playerData: Object.fromEntries(playerDataEntries) as Record<string, PlayerState>,
    result,
    roomData: parsedRoom,
  };
}

export function parseReplaySnapshot(
  value: Pick<
    QuoridorReplaySnapshot,
    'seq' | 'roomData' | 'playersData' | 'result'
  >,
  viewer: string,
  roomID: string,
): GameSnapshot | undefined {
  const roomData = parseRoomData(value.roomData);
  const playerDataEntries = Object.entries(value.playersData ?? {}).map(
    ([id, state]) => [id, playerState(state)] as const,
  );
  const result = parseResult(value.result);
  if (
    !roomData
    || playerDataEntries.some(([, state]) => !state)
    || !result
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
    playerData: Object.fromEntries(playerDataEntries) as Record<string, PlayerState>,
    result,
    roomData,
  };
}

export const selfID = (snapshot: Snapshot) =>
  snapshot.type === 'MATCH_SYNC' ? snapshot.playerID : snapshot.playerId;

export const playerName = (
  id: string,
  players?: Record<string, QuoridorPlayer>,
) => playerDisplayName(players?.[id], id);
export const playerLabel = (
  id: string,
  players?: Record<string, QuoridorPlayer>,
) => playerDisplayLabel(players?.[id], id);
