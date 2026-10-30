import type {
  CantStopActionEntry,
  CantStopPairingOption,
  CantStopPlayerState,
  RoomPlayer,
  CantStopReplaySnapshot,
  CantStopRoomView,
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
import type {
  GameStatus,
  CantStopPlayer,
  Visibility,
} from './types';

type ExtraRoomData = CantStopRoomView['roomData'] & {
  activityLog?: CantStopActionEntry[] | null;
  columnHeights?: Record<number, number>;
  claimedBy?: Record<number, string> | null;
  dice?: number[] | null;
  pairingOptions?: CantStopPairingOption[] | null;
  playerOrder?: string[] | null;
  players?: Record<string, RoomPlayer | null> | null;
  runners?: Record<number, number> | null;
  targetColumns?: number;
  turnTimeoutMs?: string | null;
  turnTransitionTimeoutMs?: string | null;
};

type NullablePlayerState = Partial<CantStopPlayerState> & {
  savedProgress?: Record<number, number> | null;
  claimedColumns?: number[] | null;
  busts?: number;
};

export type CantStopPublicPlayerState = CantStopPlayerState & {
  busts?: number;
};

export type CantStopGameRoomData = Omit<
  CantStopRoomView['roomData'],
  'gameStatus' | 'turnTimeoutMs' | 'players'
> & {
  gameStatus: GameStatus;
  turnTimeoutMs?: number;
  turnTransitionTimeoutMs?: number;
  columnHeights?: Record<number, number>;
  targetColumns?: number;
  players: Record<string, CantStopPlayer>;
};

export interface MatchSnapshot extends SessionSnapshotBase {
  type: 'MATCH_SYNC';
  ownerID: string;
  status: GameStatus;
  playerID: string;
  players: Record<string, CantStopPlayer>;
  visibility: Visibility;
  maxPlayers: number;
  playerOrder: string[];
}

export interface GameSnapshot extends
  SessionSnapshotBase,
  Omit<CantStopRoomView, 'roomData' | 'playerData'> {
  type: 'ROOM_SYNC';
  visibility: Visibility;
  playerData: Record<string, CantStopPublicPlayerState>;
  roomData: CantStopGameRoomData;
}

export type Snapshot = MatchSnapshot | GameSnapshot;
export type CommandType =
  | 'match_ready'
  | 'match_begin'
  | 'match_add_ai'
  | 'match_remove_player'
  | 'room_update_settings'
  | 'game_ready'
  | 'game_roll_dice'
  | 'game_advance'
  | 'game_bank'
  | 'game_next_turn';
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
  'match', 'waiting', 'roll', 'choose', 'decide', 'bust', 'banked', 'end',
]);

const arrayOrEmpty = <T>(value: T[] | null | undefined): T[] =>
  Array.isArray(value) ? value : [];

const recordOrEmpty = <T>(
  value: Record<string, T> | null | undefined,
): Record<string, T> =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const normalizePlayers = (
  players: Record<string, RoomPlayer | null> | null | undefined,
): Record<string, CantStopPlayer> => {
  const result: Record<string, CantStopPlayer> = {};
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
  values: Record<string, NullablePlayerState | null> | null | undefined,
): Record<string, CantStopPublicPlayerState> => {
  const result: Record<string, CantStopPublicPlayerState> = {};
  for (const [id, player] of Object.entries(recordOrEmpty(values))) {
    if (!player) continue;
    result[id] = {
      ...player,
      savedProgress: recordOrEmpty(player.savedProgress),
      claimedColumns: arrayOrEmpty(player.claimedColumns),
      savedStepCount: Number(player.savedStepCount ?? 0),
    };
  }
  return result;
};

const normalizePairingOptions = (
  values: CantStopPairingOption[] | null | undefined,
): CantStopPairingOption[] => arrayOrEmpty(values).map(option => ({
  ...option,
  sums: arrayOrEmpty(option.sums),
  diceIndexes: arrayOrEmpty(option.diceIndexes),
  advances: recordOrEmpty(option.advances),
  runnerPositions: recordOrEmpty(option.runnerPositions),
}));

const normalizeActions = (
  values: CantStopActionEntry[] | null | undefined,
): CantStopActionEntry[] => arrayOrEmpty(values).map(action => ({
  ...action,
  dice: action.dice == null ? undefined : arrayOrEmpty(action.dice),
  columns: arrayOrEmpty(action.columns),
}));

function validRoomView(view: CantStopRoomView) {
  const roomData = view.roomData as ExtraRoomData;
  const playerOrder = arrayOrEmpty(roomData.playerOrder);
  const playerCount = playerOrder.length || Object.keys(recordOrEmpty(
    roomData.players,
  )).length;
  const dice = arrayOrEmpty(roomData.dice);
  return statuses.has(roomData.gameStatus as GameStatus)
    && playerCount >= 2
    && playerCount <= 4
    && dice.every(value =>
      Number.isInteger(value) && value >= 1 && value <= 6)
    && arrayOrEmpty(roomData.pairingOptions).every(option =>
      arrayOrEmpty(option.sums).every(sum =>
        Number.isInteger(sum) && sum >= 2 && sum <= 12));
}

function normalizeRoomData(
  value: CantStopRoomView['roomData'],
): CantStopGameRoomData {
  const roomData = value as ExtraRoomData;
  const players = normalizePlayers(roomData.players);
  const playerOrder = arrayOrEmpty(roomData.playerOrder);
  return {
    ...roomData,
    gameStatus: roomData.gameStatus as GameStatus,
    dice: arrayOrEmpty(roomData.dice),
    pairingOptions: normalizePairingOptions(roomData.pairingOptions),
    runners: recordOrEmpty(roomData.runners),
    claimedBy: recordOrEmpty(roomData.claimedBy),
    activityLog: normalizeActions(roomData.activityLog),
    turnTimeoutMs: roomData.turnTimeoutMs == null
      ? undefined
      : Number(roomData.turnTimeoutMs),
    turnTransitionTimeoutMs: roomData.turnTransitionTimeoutMs == null
      ? undefined
      : Number(roomData.turnTransitionTimeoutMs),
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
  const view = envelope.view.cantstop;
  if (!view || !validRoomView(view)) return;
  return {
    ...common,
    type: 'ROOM_SYNC',
    playerId: view.playerId,
    ownerID: view.ownerID,
    visibility: view.visibility as Visibility,
    playerData: normalizePlayerData(view.playerData),
    result: view.result ?? undefined,
    roomData: normalizeRoomData(view.roomData),
  };
}

export function parseReplaySnapshot(
  value: CantStopReplaySnapshot,
  viewer: string,
  roomID: string,
): GameSnapshot | undefined {
  const view: CantStopRoomView = {
    playerId: viewer,
    ownerID: '',
    visibility: 'private',
    playerData: value.playersData,
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
    result: view.result ?? undefined,
    roomData: normalizeRoomData(view.roomData),
  };
}

export const selfID = (snapshot: Snapshot) =>
  snapshot.type === 'MATCH_SYNC' ? snapshot.playerID : snapshot.playerId;

export const playerName = (
  id: string,
  players?: Record<string, CantStopPlayer>,
) => playerDisplayName(players?.[id], id);
export const playerLabel = (
  id: string,
  players?: Record<string, CantStopPlayer>,
) => playerDisplayLabel(players?.[id], id);

export const phaseKey = (snapshot?: Snapshot) =>
  snapshot ? `${snapshot.roomID}:${snapshot.seq}` : '';

export const turnKey = (snapshot?: GameSnapshot) => snapshot
  ? `${snapshot.matchID}:${snapshot.roomData.turnNumber}:${snapshot.roomData.rollNumber}:${snapshot.roomData.gameStatus}`
  : '';
