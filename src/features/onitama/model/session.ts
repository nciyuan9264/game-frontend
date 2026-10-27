import type {
  OnitamaActionEntry,
  OnitamaCell,
  OnitamaLegalMove,
  OnitamaPiece,
  OnitamaPlayerState,
  OnitamaReplaySnapshot,
  OnitamaResult,
  OnitamaRoomData,
  RoomPlayer,
} from '@/api/generated/game-platform';
import { playerDisplayName } from '@/features/game-core/model/room';
import {
  parseRealtimeEnvelope,
  type RealtimeCommandResult,
  type RealtimeErrorMessage,
} from '@/features/game-core/model/realtime';
import type {
  SessionPendingCommand,
  SessionSnapshotBase,
} from '@/features/game-core/model/session';
import { isCardID } from './cards';
import type {
  ActionEntry,
  ActionKind,
  CardID,
  Cell,
  GameStatus,
  LegalMove,
  OnitamaPlayer,
  Piece,
  PieceKind,
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
  players: Record<string, OnitamaPlayer>;
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
    pieces: Piece[];
    hands: Record<Side, CardID[]>;
    transitCardID: CardID;
    currentPlayer: string;
    currentSide: Side | '';
    bluePlayerID: string;
    redPlayerID: string;
    firstPlayerID: string;
    roundNo: number;
    gameStatus: GameStatus;
    legalMoves: LegalMove[];
    canPass: boolean;
    moveLog: ActionEntry[];
    lastAction?: ActionEntry;
    turnDeadline?: string;
    turnTimeoutMs?: number;
    players: Record<string, OnitamaPlayer>;
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
  | 'game_move_piece'
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

function side(value: unknown): Side | undefined {
  return value === 'blue' || value === 'red' ? value : undefined;
}

function pieceKind(value: unknown): PieceKind | undefined {
  return value === 'master' || value === 'student' ? value : undefined;
}

function actionKind(value: unknown): ActionKind | undefined {
  return value === 'move' || value === 'pass' || value === 'resign'
    ? value
    : undefined;
}

function integer(value: unknown, minimum: number, maximum: number) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= minimum && parsed <= maximum
    ? parsed
    : undefined;
}

function cell(value?: OnitamaCell): Cell | undefined {
  if (!value) return;
  const row = integer(value.row, 0, 4);
  const column = integer(value.column, 0, 4);
  return row == null || column == null ? undefined : { row, column };
}

function cardID(value: unknown): CardID | undefined {
  return isCardID(value) ? value : undefined;
}

function parseAll<T, U>(
  values: T[],
  parse: (value: T) => U | undefined,
): U[] | undefined {
  const result = values.map(parse);
  return result.some(value => value == null)
    ? undefined
    : result as U[];
}

function piece(value: OnitamaPiece): Piece | undefined {
  const owner = side(value.side);
  const kind = pieceKind(value.kind);
  const position = cell(value.cell);
  return (
    typeof value.id === 'string'
    && value.id.length > 0
    && owner
    && kind
    && position
  )
    ? { id: value.id, side: owner, kind, cell: position }
    : undefined;
}

function legalMove(value: OnitamaLegalMove): LegalMove | undefined {
  const card = cardID(value.cardID);
  const to = cell(value.to);
  return (
    card
    && typeof value.pieceID === 'string'
    && value.pieceID.length > 0
    && to
    && typeof value.winning === 'boolean'
    && (
      value.capturedPieceID == null
      || typeof value.capturedPieceID === 'string'
    )
  )
    ? {
        cardID: card,
        pieceID: value.pieceID,
        to,
        capturedPieceID: value.capturedPieceID || undefined,
        winning: value.winning,
      }
    : undefined;
}

function action(value: OnitamaActionEntry): ActionEntry | undefined {
  const id = integer(value.id, 1, Number.MAX_SAFE_INTEGER);
  const kind = actionKind(value.kind);
  const owner = side(value.side);
  if (
    id == null
    || !kind
    || !owner
    || typeof value.playerID !== 'string'
    || !value.playerID
    || typeof value.automatic !== 'boolean'
  ) {
    return;
  }

  const selectedCard = value.cardID ? cardID(value.cardID) : undefined;
  const receivedCard = value.receivedCardID
    ? cardID(value.receivedCardID)
    : undefined;
  const from = value.from ? cell(value.from) : undefined;
  const to = value.to ? cell(value.to) : undefined;
  const capturedKind = value.capturedKind
    ? pieceKind(value.capturedKind)
    : undefined;
  if (
    (value.cardID && !selectedCard)
    || (value.receivedCardID && !receivedCard)
    || (value.from && !from)
    || (value.to && !to)
    || (value.capturedKind && !capturedKind)
  ) {
    return;
  }
  if (
    kind === 'move'
    && (
      !selectedCard
      || typeof value.pieceID !== 'string'
      || !value.pieceID
      || !from
      || !to
    )
  ) {
    return;
  }
  if (kind === 'pass' && !selectedCard) return;

  return {
    id,
    kind,
    playerID: value.playerID,
    side: owner,
    cardID: selectedCard,
    pieceID: value.pieceID || undefined,
    from,
    to,
    capturedPieceID: value.capturedPieceID || undefined,
    capturedKind,
    receivedCardID: receivedCard,
    automatic: value.automatic,
  };
}

function playerState(value: OnitamaPlayerState): PlayerState | undefined {
  const owner = side(value.side);
  const pieceCount = integer(value.pieceCount, 0, 5);
  return owner && pieceCount != null && typeof value.masterAlive === 'boolean'
    ? { side: owner, pieceCount, masterAlive: value.masterAlive }
    : undefined;
}

function normalizePlayers(
  players: Record<string, RoomPlayer>,
): Record<string, OnitamaPlayer> {
  return Object.fromEntries(Object.entries(players ?? {}).map(([id, player]) => [
    id,
    { ...player, name: player.displayName },
  ]));
}

function parseHand(values: string[] | undefined): CardID[] | undefined {
  if (!Array.isArray(values) || values.length !== 2) return;
  return parseAll(values, cardID);
}

function validDeadline(value: string | undefined) {
  return value == null
    || (
      typeof value === 'string'
      && value.length > 0
      && Number.isFinite(Date.parse(value))
    );
}

function parseRoomData(
  room: OnitamaRoomData,
): GameSnapshot['roomData'] | undefined {
  const pieces = parseAll(room.pieces ?? [], piece);
  const blueHand = parseHand(room.hands?.blue);
  const redHand = parseHand(room.hands?.red);
  const transitCardID = cardID(room.transitCardID);
  const currentSide = room.currentSide === '' ? '' : side(room.currentSide);
  const gameStatus = ['match', 'waiting', 'playing', 'end'].includes(room.gameStatus)
    ? room.gameStatus as GameStatus
    : undefined;
  const legalMoves = parseAll(room.legalMoves ?? [], legalMove);
  const moveLog = parseAll(room.moveLog ?? [], action);
  const lastAction = room.lastAction ? action(room.lastAction) : undefined;
  const roundNo = integer(room.roundNo, 1, Number.MAX_SAFE_INTEGER);
  const timeout = room.turnTimeoutMs == null
    ? undefined
    : integer(room.turnTimeoutMs, 0, Number.MAX_SAFE_INTEGER);

  if (
    !pieces
    || !blueHand
    || !redHand
    || !transitCardID
    || currentSide == null
    || !gameStatus
    || !legalMoves
    || !moveLog
    || roundNo == null
    || typeof room.canPass !== 'boolean'
    || (room.lastAction && !lastAction)
    || (room.turnTimeoutMs != null && timeout == null)
    || !validDeadline(room.turnDeadline)
  ) {
    return;
  }

  const pieceIDs = new Set(pieces.map(value => value.id));
  const occupiedCells = new Set(
    pieces.map(value => `${value.cell.row}:${value.cell.column}`),
  );
  const dealtCards = [
    ...blueHand,
    ...redHand,
    transitCardID,
  ];
  if (
    pieces.length > 10
    || pieceIDs.size !== pieces.length
    || occupiedCells.size !== pieces.length
    || new Set(dealtCards).size !== 5
    || moveLog.some((entry, index) => entry.id !== index + 1)
    || (lastAction && moveLog.at(-1)?.id !== lastAction.id)
  ) {
    return;
  }

  const piecesByID = new Map(pieces.map(value => [value.id, value]));
  const activeHand = currentSide ? (currentSide === 'blue' ? blueHand : redHand) : [];
  if (legalMoves.some(move => {
    const actor = piecesByID.get(move.pieceID);
    const captured = move.capturedPieceID
      ? piecesByID.get(move.capturedPieceID)
      : undefined;
    return !activeHand.includes(move.cardID)
      || !actor
      || actor.side !== currentSide
      || (move.capturedPieceID && (!captured || captured.side === currentSide));
  })) {
    return;
  }

  return {
    pieces,
    hands: { blue: blueHand, red: redHand },
    transitCardID,
    currentPlayer: room.currentPlayer,
    currentSide,
    bluePlayerID: room.bluePlayerID,
    redPlayerID: room.redPlayerID,
    firstPlayerID: room.firstPlayerID,
    roundNo,
    gameStatus,
    legalMoves,
    canPass: room.canPass,
    moveLog,
    lastAction,
    turnDeadline: room.turnDeadline,
    turnTimeoutMs: timeout,
    players: normalizePlayers(room.players),
    playerOrder: room.playerOrder ?? [],
  };
}

function parseResult(value: OnitamaResult | undefined): Result | undefined {
  if (!value) return;
  const winnerSide = value.winnerSide == null || value.winnerSide === ''
    ? undefined
    : side(value.winnerSide);
  const turnCount = integer(value.turnCount, 0, Number.MAX_SAFE_INTEGER);
  const winnerPieceCount = integer(value.winnerPieceCount, 0, 5);
  if (
    turnCount == null
    || winnerPieceCount == null
    || typeof value.reason !== 'string'
    || (
      value.winnerSide != null
      && value.winnerSide !== ''
      && !winnerSide
    )
  ) {
    return;
  }
  return {
    winnerID: value.winnerID || undefined,
    winnerSide,
    reason: value.reason,
    turnCount,
    winnerPieceCount,
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

  const view = envelope.view.onitama;
  if (!view || !['public', 'private'].includes(view.visibility)) return;
  const roomData = parseRoomData(view.roomData);
  if (!roomData) return;
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
    roomData,
  };
}

export function parseReplaySnapshot(
  value: Pick<
    OnitamaReplaySnapshot,
    'seq' | 'roomData' | 'playersData' | 'result'
  >,
  viewer: string,
  roomID: string,
): GameSnapshot | undefined {
  const roomData = parseRoomData(value.roomData);
  const playerDataEntries = Object.entries(value.playersData ?? {}).map(
    ([id, state]) => [id, playerState(state)] as const,
  );
  const result = value.result ? parseResult(value.result) : undefined;
  if (
    !roomData
    || playerDataEntries.some(([, state]) => !state)
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
    playerData: Object.fromEntries(playerDataEntries) as Record<string, PlayerState>,
    result,
    roomData,
  };
}

export const selfID = (snapshot: Snapshot) =>
  snapshot.type === 'MATCH_SYNC' ? snapshot.playerID : snapshot.playerId;

export const playerName = (
  id: string,
  players?: Record<string, OnitamaPlayer>,
) => playerDisplayName(players?.[id], id);
