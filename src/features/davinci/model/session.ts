import type { Card, DavinciPlayer, GameStatus } from './types';

export interface LastGuessPayload {
  targetCardID: string;
  targetPlayerID: string;
  guessNum: number;
  correct: boolean;
}

export interface LastAction {
  action: string;
  playerID: string;
  payload?: LastGuessPayload;
}

export interface MatchSnapshot {
  type: 'MATCH_SYNC';
  roomID: string;
  ownerID: string;
  status: GameStatus;
  playerID: string;
  players: Record<string, DavinciPlayer>;
  maxPlayers: number;
  playerOrder: string[];
  phaseVersion: number;
  turnNumber: number;
}

export interface GameSnapshot {
  type: 'ROOM_SYNC';
  roomID: string;
  ownerID: string;
  playerId: string;
  phaseVersion: number;
  turnNumber: number;
  roomData: {
    currentPlayer: string;
    gameStatus: GameStatus;
    players: Record<string, DavinciPlayer>;
    playerOrder: string[];
    boardCards: Record<string, Card>;
    lastData?: LastAction | null;
    turnDeadline?: string;
    turnTimeoutMs?: number;
    phaseVersion: number;
    turnNumber: number;
  };
  cardData: {
    self: Card[];
    opponents: Card[];
  };
}

export type Snapshot = MatchSnapshot | GameSnapshot;
export type CommandType = 'match_ready' | 'match_begin' | 'match_add_ai' | 'match_remove_player'
  | 'game_ready' | 'game_get_card' | 'game_guess_card' | 'game_set_card'
  | 'game_play_audio' | 'game_restart_game';
export type CommandPayload = Record<string, unknown>;

export interface PendingCommand {
  id: string;
  type: CommandType;
  payload: CommandPayload;
  before: Snapshot;
  epoch: number;
}

export type ServerMessage = Snapshot | {
  type: 'error' | 'command_result' | 'audio';
  code?: string;
  message?: string;
  requestId?: string;
  phaseVersion?: number;
};

export function parseServerMessage(value: string): ServerMessage | undefined {
  try {
    const data = JSON.parse(value);
    if (!data || typeof data !== 'object') return;
    if (['error', 'command_result', 'audio'].includes(data.type)) return data;
    if (typeof data.roomID !== 'string' || !Number.isInteger(data.phaseVersion)) return;
    if (data.type === 'MATCH_SYNC' && data.players && typeof data.playerID === 'string') return data;
    if (
      data.type === 'ROOM_SYNC'
      && data.roomData?.players
      && data.roomData?.boardCards
      && data.cardData
      && typeof data.playerId === 'string'
    ) return data;
  } catch {
    // Ignore malformed frames and retain the last known-good snapshot.
  }
}

export const selfID = (snapshot: Snapshot) =>
  snapshot.type === 'MATCH_SYNC' ? snapshot.playerID : snapshot.playerId;

export const playerName = (id: string, players: Record<string, DavinciPlayer>) =>
  players[id]?.name || id.replace(/-\d+$/, '');
