import type {
  LobbyPlayerLike,
  LobbyRoomLike,
} from '@/features/game-core/model/room';
export type { LobbyFilter } from '@/features/game-core/model/room';

export type Visibility = 'public' | 'private';
export type Side = 'white' | 'black';
export type GameStatus =
  | 'match'
  | 'waiting'
  | 'placement'
  | 'move'
  | 'remove_row'
  | 'remove_ring'
  | 'end';

export interface YinshPlayer extends LobbyPlayerLike {}

export interface YinshRoom extends LobbyRoomLike {
  visibility: Visibility;
  roomPlayer: YinshPlayer[];
  playerOrder?: string[];
  ringsRemoved?: number;
}

export interface MoveOption {
  to: string;
  flips: string[];
}

export interface Row {
  id: string;
  points: string[];
  owner: Side;
}

export interface PlayerState {
  side: Side;
  ringsRemoved: number;
}

export interface LastAction {
  action: string;
  playerID: string;
  payload?: Record<string, unknown>;
}

export interface Result {
  winnerID?: string;
  reason: string;
  ringsRemoved: Record<Side, number>;
}
