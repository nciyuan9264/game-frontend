import type {
  AcquireCompanyState,
  AcquirePlayerState,
  AcquireRoomData,
  AcquireRoomView,
  AcquireTile,
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
import type {
  AcquirePlayer,
  Company,
  Visibility,
} from './types';

export type GameStatus =
  | 'match'
  | 'waiting'
  | 'createCompany'
  | 'buyStock'
  | 'merging'
  | 'mergingSelection'
  | 'mergingSettle'
  | 'end'
  | 'setTile';

type NormalizedRoomData = Omit<
  AcquireRoomData,
  | 'companyInfo'
  | 'gameStatus'
  | 'playerOrder'
  | 'players'
  | 'tiles'
  | 'turnTimeoutMs'
  | 'endGame'
> & {
  companyInfo: Record<Company, AcquireCompanyState>;
  gameStatus: GameStatus;
  playerOrder?: string[];
  players: Record<string, AcquirePlayer>;
  tiles: Record<string, Omit<AcquireTile, 'belong'> & {
    belong: Company | 'Blank' | '';
  }>;
  turnTimeoutMs?: number;
  endGame?: {
    eligible: boolean;
    condition: '' | 'company_size' | 'all_companies_safe';
    company: string;
    tileCount: number;
    votes: Record<string, boolean>;
  };
};

export interface MatchSnapshot extends SessionSnapshotBase {
  type: 'MATCH_SYNC';
  ownerID: string;
  status: GameStatus;
  playerID: string;
  visibility: Visibility;
  maxPlayers: number;
  players: Record<string, AcquirePlayer>;
  playerOrder: string[];
}

export type GameSnapshot = SessionSnapshotBase & Omit<
  AcquireRoomView,
  'roomData' | 'visibility'
> & {
  type: 'ROOM_SYNC';
  visibility: Visibility;
  roomData: NormalizedRoomData;
};

export type Snapshot = MatchSnapshot | GameSnapshot;
export type DisplaySnapshot = Pick<
  GameSnapshot,
  'playerId' | 'playerData' | 'roomData' | 'result'
>;
export type ServerMessage =
  | Snapshot
  | RealtimeCommandResult
  | RealtimeErrorMessage;
export type CommandType =
  | 'match_ready'
  | 'match_begin'
  | 'match_add_ai'
  | 'match_remove_player'
  | 'room_update_settings'
  | 'game_ready'
  | 'game_place_tile'
  | 'game_create_company'
  | 'game_buy_stock'
  | 'game_merging_selection'
  | 'game_merging_settle'
  | 'game_end_vote'
  | 'game_restart_game';
export type CommandPayload = Record<string, unknown>;
export type PendingCommand = SessionPendingCommand<
  Snapshot,
  CommandType,
  CommandPayload
>;
export type BuyDraft = Partial<Record<Company, number>>;
export type MergeDraft = Partial<
  Record<Company, { sell: number; groups: number }>
>;
export type BusinessPanel =
  | 'buy'
  | 'merge'
  | 'merge-wait'
  | 'found'
  | 'survivor';

export const money = (value: number) => `$${value.toLocaleString('en-US')}`;
export const selfID = (snapshot: Snapshot) =>
  snapshot.type === 'MATCH_SYNC' ? snapshot.playerID : snapshot.playerId;
export const phaseKey = (snapshot?: Snapshot) =>
  snapshot ? `${snapshot.roomID}:${snapshot.seq}` : '';
const emptyEndGame: NonNullable<GameSnapshot['roomData']['endGame']> = {
  eligible: false,
  condition: '',
  company: '',
  tileCount: 0,
  votes: {},
};
export const endGameState = (snapshot: GameSnapshot) =>
  snapshot.roomData.endGame ?? emptyEndGame;
export const playerName = (
  id: string,
  players: Record<string, AcquirePlayer>,
) => players[id]?.name || id.replace(/-\d+$/, '');

function normalizePlayers(
  players: Record<string, AcquirePlayer>,
): Record<string, AcquirePlayer> {
  return Object.fromEntries(Object.entries(players).map(([id, player]) => [
    id,
    {
      ...player,
      name: player.name || player.displayName,
    },
  ]));
}

function endCondition(
  value?: string,
): '' | 'company_size' | 'all_companies_safe' {
  return value === 'company_size' || value === 'all_companies_safe'
    ? value
    : '';
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
    // #region debug-point C:match-sync
    void fetch('https://api.gamebus.online/__trae-debug/room-create-filter-error/event', { method: 'POST', body: JSON.stringify({ sessionId: 'room-create-filter-error', runId: 'pre-fix', hypothesisId: 'C', location: 'features/acquire/model/session.ts:parseServerMessage', msg: '[DEBUG] Acquire MATCH_SYNC shape', data: { roomID: envelope.roomID, envelopeKeys: Object.keys(envelope), playerOrderIsArray: Array.isArray(envelope.playerOrder), playerOrderLength: Array.isArray(envelope.playerOrder) ? envelope.playerOrder.length : -1, playersIsRecord: !!envelope.players && typeof envelope.players === 'object', playerCount: envelope.players && typeof envelope.players === 'object' ? Object.keys(envelope.players).length : -1 }, ts: Date.now() }) }).catch(() => {});
    // #endregion
    return {
      ...common,
      type: 'MATCH_SYNC',
      ownerID: envelope.ownerID,
      status: envelope.status as GameStatus,
      playerID: envelope.playerID,
      visibility: envelope.visibility as Visibility,
      maxPlayers: envelope.maxPlayers,
      players: normalizePlayers(envelope.players),
      playerOrder: envelope.playerOrder,
    };
  }
  const view = envelope.view.acquire;
  if (!view) return;
  const endGame = view.roomData.endGame;
  return {
    ...common,
    type: 'ROOM_SYNC',
    playerId: view.playerId,
    ownerID: view.ownerID,
    visibility: view.visibility as Visibility,
    playerData: view.playerData as AcquirePlayerState,
    tempData: view.tempData,
    result: view.result,
    roomData: {
      ...view.roomData,
      companyInfo: view.roomData.companyInfo as Record<Company, AcquireCompanyState>,
      gameStatus: view.roomData.gameStatus as GameStatus,
      players: normalizePlayers(view.roomData.players),
      tiles: view.roomData.tiles as NormalizedRoomData['tiles'],
      turnTimeoutMs: view.roomData.turnTimeoutMs == null
        ? undefined
        : Number(view.roomData.turnTimeoutMs),
      endGame: endGame
        ? {
            ...endGame,
            condition: endCondition(endGame.condition),
          }
        : undefined,
    },
  };
}
