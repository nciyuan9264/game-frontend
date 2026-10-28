import type {
  RoomPlayer,
  SixNimmtActionEntry,
  SixNimmtPlayerState,
  SixNimmtPrivateData,
  SixNimmtReplaySnapshot,
  SixNimmtResult,
  SixNimmtRoomData,
  SixNimmtRoomView,
  SixNimmtRoundResult,
  SixNimmtRow,
  SixNimmtTurnResolution,
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
  GameStatus,
  SixNimmtPlayer,
  Visibility,
} from './types';

export interface MatchSnapshot extends SessionSnapshotBase {
  type: 'MATCH_SYNC';
  ownerID: string;
  status: GameStatus;
  playerID: string;
  players: Record<string, SixNimmtPlayer>;
  visibility: Visibility;
  maxPlayers: number;
  playerOrder: string[];
}

export interface GameSnapshot extends
  SessionSnapshotBase,
  Omit<SixNimmtRoomView, 'roomData'> {
  type: 'ROOM_SYNC';
  visibility: Visibility;
  roomData: Omit<
    SixNimmtRoomView['roomData'],
    'gameStatus' | 'turnTimeoutMs' | 'players'
  > & {
    gameStatus: GameStatus;
    turnTimeoutMs?: number;
    players: Record<string, SixNimmtPlayer>;
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
  | 'game_lock_card'
  | 'game_unlock_card'
  | 'game_choose_row'
  | 'game_next_round';
export type PendingCommand = SessionPendingCommand<
  Snapshot,
  CommandType,
  Record<string, unknown>
>;
export type ServerMessage =
  | Snapshot
  | RealtimeCommandResult
  | RealtimeErrorMessage;

const statuses = new Set<GameStatus>([
  'match', 'waiting', 'selecting', 'chooseRow', 'roundEnd', 'end',
]);

const arrayOrEmpty = <T>(value: T[] | null | undefined): T[] =>
  Array.isArray(value) ? value : [];

const recordOrEmpty = <T>(
  value: Record<string, T> | null | undefined,
): Record<string, T> =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const normalizePlayers = (
  players: Record<string, RoomPlayer | null> | null | undefined,
): Record<string, SixNimmtPlayer> => {
  const result: Record<string, SixNimmtPlayer> = {};
  for (const [id, player] of Object.entries(recordOrEmpty(players))) {
    if (!player) continue;
    result[id] = {
      ...player,
      displayName: player.displayName || (player.ai ? '公平 AI' : `玩家 ${id}`),
      name: player.displayName,
    };
  }
  return result;
};

const normalizePlayerData = (
  values: Record<string, SixNimmtPlayerState | null> | null | undefined,
): Record<string, SixNimmtPlayerState> => Object.fromEntries(
  Object.entries(recordOrEmpty(values)).filter((entry):
    entry is [string, SixNimmtPlayerState] => !!entry[1]),
);

const normalizePrivateData = (
  value: Partial<SixNimmtPrivateData> | null | undefined,
): SixNimmtPrivateData => ({
  hand: arrayOrEmpty(value?.hand),
  legalCards: arrayOrEmpty(value?.legalCards),
  lockedCard: value?.lockedCard == null ? undefined : value.lockedCard,
});

const normalizeRows = (rows: SixNimmtRow[] | null | undefined) =>
  arrayOrEmpty(rows).map(row => ({
    ...row,
    cards: arrayOrEmpty(row.cards),
  }));

const normalizeResolution = (
  value: SixNimmtTurnResolution | null | undefined,
): SixNimmtTurnResolution | undefined =>
  value
    ? {
      ...value,
      rowsBefore: normalizeRows(value.rowsBefore),
      selections: arrayOrEmpty(value.selections),
      placements: arrayOrEmpty(value.placements).map(placement => ({
        ...placement,
        collectedCards: arrayOrEmpty(placement.collectedCards),
      })),
      rowsAfter: normalizeRows(value.rowsAfter),
    }
    : undefined;

const normalizeRoundResult = (
  value: SixNimmtRoundResult | null | undefined,
): SixNimmtRoundResult | undefined =>
  value
    ? {
      ...value,
      roundPenalties: recordOrEmpty(value.roundPenalties),
      totalPenalties: recordOrEmpty(value.totalPenalties),
    }
    : undefined;

const normalizeResult = (
  value: SixNimmtResult | null | undefined,
): SixNimmtResult | undefined =>
  value
    ? {
      ...value,
      winnerIDs: arrayOrEmpty(value.winnerIDs),
      totalPenalties: recordOrEmpty(value.totalPenalties),
      finalRanks: recordOrEmpty(value.finalRanks),
    }
    : undefined;

const validRows = (rows: SixNimmtRow[]) => rows.length === 4
  && rows.every((row, index) =>
    row.index === index
    && row.cards.length >= 1
    && row.cards.length <= 5
    && row.cards.every(card => card >= 1 && card <= 104));

function validRoomView(view: SixNimmtRoomView) {
  const rows = normalizeRows(view.roomData.rows);
  const status = view.roomData.gameStatus as GameStatus;
  return statuses.has(status)
    && (status === 'waiting' ? rows.length === 0 || validRows(rows) : validRows(rows))
    && arrayOrEmpty(view.privateData?.hand).every(card => card >= 1 && card <= 104)
    && arrayOrEmpty(view.privateData?.legalCards).every(card => card >= 1 && card <= 104);
}

function normalizeRoomData(
  value: SixNimmtRoomData,
): GameSnapshot['roomData'] {
  const roomData = value as SixNimmtRoomData & {
    activityLog?: SixNimmtActionEntry[] | null;
    lastResolution?: SixNimmtTurnResolution | null;
    pendingChoice?: SixNimmtRoomData['pendingChoice'] | null;
    playerOrder?: string[] | null;
    players?: Record<string, RoomPlayer | null> | null;
    roundResult?: SixNimmtRoundResult | null;
    rows?: SixNimmtRow[] | null;
    turnTimeoutMs?: string | number | null;
  };
  const players = normalizePlayers(roomData.players);
  const playerOrder = arrayOrEmpty(roomData.playerOrder);
  return {
    ...roomData,
    gameStatus: roomData.gameStatus as GameStatus,
    rows: normalizeRows(roomData.rows),
    lockedPlayerIDs: arrayOrEmpty(roomData.lockedPlayerIDs),
    activityLog: arrayOrEmpty(roomData.activityLog),
    lastResolution: normalizeResolution(roomData.lastResolution),
    pendingChoice: roomData.pendingChoice ?? undefined,
    roundResult: normalizeRoundResult(roomData.roundResult),
    turnTimeoutMs: roomData.turnTimeoutMs == null
      ? undefined
      : Number(roomData.turnTimeoutMs),
    players,
    playerOrder: playerOrder.length ? playerOrder : Object.keys(players),
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
    if (!statuses.has(envelope.status as GameStatus)) return;
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
  const view = envelope.view.sixnimmt;
  if (!view || !validRoomView(view)) return;
  return {
    ...common,
    type: 'ROOM_SYNC',
    playerId: view.playerId,
    ownerID: view.ownerID,
    visibility: view.visibility as Visibility,
    playerData: normalizePlayerData(view.playerData),
    privateData: normalizePrivateData(view.privateData),
    result: normalizeResult(view.result),
    roomData: normalizeRoomData(view.roomData),
  };
}

export function parseReplaySnapshot(
  value: SixNimmtReplaySnapshot,
  viewer: string,
  roomID: string,
): GameSnapshot | undefined {
  const view: SixNimmtRoomView = {
    playerId: viewer,
    ownerID: '',
    visibility: 'private',
    playerData: value.playersData,
    privateData: value.privateData[viewer] ?? {
      hand: [],
      legalCards: [],
    },
    roomData: value.roomData,
    result: value.result,
  };
  if (!validRoomView(view)) return;
  return {
    schemaVersion: 2,
    type: 'ROOM_SYNC',
    roomID,
    matchID: '',
    seq: Number(value.seq),
    phaseVersion: Number(value.seq),
    turnNumber: Number(value.seq),
    playerId: viewer,
    ownerID: '',
    visibility: 'private',
    playerData: normalizePlayerData(view.playerData),
    privateData: normalizePrivateData(view.privateData),
    result: normalizeResult(view.result),
    roomData: normalizeRoomData(view.roomData),
  };
}

export const selfID = (snapshot: Snapshot) =>
  snapshot.type === 'MATCH_SYNC' ? snapshot.playerID : snapshot.playerId;

export const playerName = (
  id: string,
  players?: Record<string, SixNimmtPlayer>,
) => playerDisplayName(players?.[id], id);

export const phaseKey = (snapshot?: Snapshot) =>
  snapshot ? `${snapshot.roomID}:${snapshot.seq}` : '';

export const turnKey = (snapshot?: GameSnapshot) => snapshot
  ? `${snapshot.matchID}:${snapshot.roomData.roundNo}:${snapshot.roomData.turnNo}`
  : '';
