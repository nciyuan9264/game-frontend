import type {
  LoveLetterPrivateData,
  LoveLetterResult,
  LoveLetterRoundResult,
  LoveLetterRoomView,
  LoveLetterPlayerState,
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
import type {
  GameStatus,
  LoveLetterPlayer,
  Visibility,
} from './types';

export interface MatchSnapshot extends SessionSnapshotBase {
  type: 'MATCH_SYNC';
  ownerID: string;
  status: GameStatus;
  playerID: string;
  players: Record<string, LoveLetterPlayer>;
  visibility: Visibility;
  maxPlayers: number;
  playerOrder: string[];
}

export interface GameSnapshot extends
  SessionSnapshotBase,
  Omit<LoveLetterRoomView, 'roomData'> {
  type: 'ROOM_SYNC';
  visibility: Visibility;
  roomData: Omit<
    LoveLetterRoomView['roomData'],
    'gameStatus' | 'turnTimeoutMs' | 'players'
  > & {
    gameStatus: GameStatus;
    turnTimeoutMs?: number;
    players: Record<string, LoveLetterPlayer>;
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
  | 'game_draw_card'
  | 'game_play_card'
  | 'game_settle_chancellor'
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

const arrayOrEmpty = <T>(value: T[] | null | undefined): T[] =>
  Array.isArray(value) ? value : [];

const recordOrEmpty = <T>(
  value: Record<string, T> | null | undefined,
): Record<string, T> =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const normalizePlayers = (
  players: Record<string, RoomPlayer | null> | null | undefined,
): Record<string, LoveLetterPlayer> => {
  const result: Record<string, LoveLetterPlayer> = {};
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
  playerData: Record<string, LoveLetterPlayerState | null> | null | undefined,
): Record<string, LoveLetterPlayerState> => {
  const result: Record<string, LoveLetterPlayerState> = {};
  for (const [id, player] of Object.entries(recordOrEmpty(playerData))) {
    if (!player) continue;
    result[id] = {
      ...player,
      discards: arrayOrEmpty(player.discards),
    };
  }
  return result;
};

const normalizeLegalTargets = (
  legalTargets: Record<string, string[] | null | undefined> | null | undefined,
): Record<string, string[]> => Object.fromEntries(
  Object.entries(recordOrEmpty(legalTargets)).map(([cardID, targets]) => [
    cardID,
    arrayOrEmpty(targets),
  ]),
);

const normalizePrivateData = (
  privateData: LoveLetterPrivateData | null | undefined,
): LoveLetterPrivateData => ({
  hand: arrayOrEmpty(privateData?.hand),
  legalCardIDs: arrayOrEmpty(privateData?.legalCardIDs),
  legalTargets: normalizeLegalTargets(privateData?.legalTargets),
  guardGuessRanks: arrayOrEmpty(privateData?.guardGuessRanks),
  effect: privateData?.effect ?? undefined,
});

const normalizeRoundResult = (
  roundResult: LoveLetterRoundResult | null | undefined,
): LoveLetterRoundResult | undefined =>
  roundResult
    ? {
      ...roundResult,
      winnerIDs: arrayOrEmpty(roundResult.winnerIDs),
      favorsBefore: recordOrEmpty(roundResult.favorsBefore),
      favorsAfter: recordOrEmpty(roundResult.favorsAfter),
      revealedHands: recordOrEmpty(roundResult.revealedHands),
      matchWinnerIDs: arrayOrEmpty(roundResult.matchWinnerIDs),
    }
    : undefined;

const normalizeResult = (
  result: LoveLetterResult | null | undefined,
): LoveLetterResult | undefined =>
  result
    ? {
      ...result,
      winnerIDs: arrayOrEmpty(result.winnerIDs),
      favors: recordOrEmpty(result.favors),
      finalRanks: recordOrEmpty(result.finalRanks),
    }
    : undefined;

const normalizeRoomData = (
  roomData: LoveLetterRoomView['roomData'],
  players: Record<string, LoveLetterPlayer>,
): GameSnapshot['roomData'] => {
  const timeoutMs = roomData.turnTimeoutMs == null
    ? undefined
    : Number(roomData.turnTimeoutMs);
  const playerOrder = arrayOrEmpty(roomData.playerOrder);
  return {
    ...roomData,
    gameStatus: roomData.gameStatus as GameStatus,
    burnCards: arrayOrEmpty(roomData.burnCards),
    activityLog: arrayOrEmpty(roomData.activityLog),
    lastData: roomData.lastData ?? undefined,
    roundResult: normalizeRoundResult(roomData.roundResult),
    turnTimeoutMs: Number.isFinite(timeoutMs) ? timeoutMs : undefined,
    players,
    playerOrder: playerOrder.length ? playerOrder : Object.keys(players),
  };
};

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
    const players = normalizePlayers(envelope.players);
    const playerOrder = arrayOrEmpty(envelope.playerOrder);
    return {
      ...common,
      type: 'MATCH_SYNC',
      ownerID: envelope.ownerID,
      status: envelope.status as GameStatus,
      playerID: envelope.playerID,
      players,
      visibility: envelope.visibility as Visibility,
      maxPlayers: envelope.maxPlayers,
      playerOrder: playerOrder.length ? playerOrder : Object.keys(players),
    };
  }
  const view = envelope.view.loveletter;
  if (!view?.roomData) return;
  const players = normalizePlayers(view.roomData.players);
  return {
    ...common,
    type: 'ROOM_SYNC',
    playerId: view.playerId,
    ownerID: view.ownerID,
    visibility: view.visibility as Visibility,
    playerData: normalizePlayerData(view.playerData),
    privateData: normalizePrivateData(view.privateData),
    result: normalizeResult(view.result),
    roomData: normalizeRoomData(view.roomData, players),
  };
}

export const selfID = (snapshot: Snapshot) =>
  snapshot.type === 'MATCH_SYNC' ? snapshot.playerID : snapshot.playerId;

export const playerName = (
  id: string,
  players?: Record<string, LoveLetterPlayer>,
) => playerDisplayName(players?.[id], id);
export const playerLabel = (
  id: string,
  players?: Record<string, LoveLetterPlayer>,
) => playerDisplayLabel(players?.[id], id);

export const phaseKey = (snapshot?: Snapshot) =>
  snapshot ? `${snapshot.roomID}:${snapshot.seq}` : '';
