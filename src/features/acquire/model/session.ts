import type { WsRoomSyncData, WsMatchSyncData } from '@/types/AcquireRoom';
import type { AcquirePlayer, Company, Visibility } from './types';

export type MatchSnapshot = Omit<WsMatchSyncData, 'type' | 'players'> & {
  type: 'MATCH_SYNC'; visibility: Visibility; phaseVersion: number; turnNumber: number;
  maxPlayers: number; playerOrder: string[]; players: Record<string, AcquirePlayer>;
};
export type GameSnapshot = Omit<WsRoomSyncData, 'type' | 'roomData'> & {
  type: 'ROOM_SYNC'; roomID: string; visibility: Visibility; phaseVersion: number; turnNumber: number;
  roomData: WsRoomSyncData['roomData'] & { players: Record<string, AcquirePlayer>; playerOrder: string[] };
};
export type Snapshot = MatchSnapshot | GameSnapshot;
/** Historical rendering does not require live phase or connection metadata. */
export type DisplaySnapshot = Pick<WsRoomSyncData, 'playerId' | 'playerData' | 'roomData' | 'result'>;
export type ServerMessage = Snapshot | {
  type: 'error' | 'command_result' | 'audio'; code?: string; message?: string; requestId?: string;
};
export type CommandType = 'match_ready' | 'match_begin' | 'match_add_ai' | 'match_remove_player'
  | 'room_update_settings' | 'game_ready' | 'game_place_tile' | 'game_create_company'
  | 'game_buy_stock' | 'game_merging_selection' | 'game_merging_settle' | 'game_end_vote' | 'game_restart_game';
export type CommandPayload = Record<string, unknown>;
export interface PendingCommand {
  id: string; type: CommandType; payload: CommandPayload; before: Snapshot; epoch: number;
}
export type BuyDraft = Partial<Record<Company, number>>;
export type MergeDraft = Partial<Record<Company, { sell: number; groups: number }>>;
export type BusinessPanel = 'buy' | 'merge' | 'merge-wait' | 'found' | 'survivor';
export const money = (value: number) => `$${value.toLocaleString('en-US')}`;
export const selfID = (snapshot: Snapshot) => snapshot.type === 'MATCH_SYNC' ? snapshot.playerID : snapshot.playerId;
export const phaseKey = (snapshot?: Snapshot) => snapshot ? `${snapshot.roomID}:${snapshot.phaseVersion}` : '';
const emptyEndGame: NonNullable<GameSnapshot['roomData']['endGame']> = {
  eligible: false, condition: '', company: '', tileCount: 0, votes: {},
};
export const endGameState = (snapshot: GameSnapshot) => snapshot.roomData.endGame ?? emptyEndGame;
export const playerName = (id: string, players: Record<string, AcquirePlayer>) =>
  players[id]?.name || id.replace(/-\d+$/, '');

export function parseServerMessage(value: string): ServerMessage | undefined {
  try {
    const data = JSON.parse(value);
    if (!data || typeof data !== 'object') return;
    if (['error', 'command_result', 'audio'].includes(data.type)) return data;
    if (typeof data.roomID !== 'string' || !Number.isInteger(data.phaseVersion)) return;
    if (data.type === 'MATCH_SYNC' && data.players && typeof data.playerID === 'string') return data;
    if (data.type === 'ROOM_SYNC' && data.roomData?.tiles && data.roomData?.companyInfo && data.playerData
      && typeof data.playerId === 'string') return data;
  } catch { /* Ignore malformed/non-protocol frames; never clear the last good snapshot. */ }
}
