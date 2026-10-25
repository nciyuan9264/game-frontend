import type {
  LobbyPlayerLike,
  LobbyRoomLike,
} from '@/features/game-core/model/room';
export type { LobbyFilter } from '@/features/game-core/model/room';

export type Visibility = 'public' | 'private';
export type Side = 'black' | 'white';
export type Disc = Side | '';
export type GameStatus =
  | 'match'
  | 'waiting'
  | 'playing'
  | 'pass'
  | 'end';

export interface OthelloPlayer extends LobbyPlayerLike {}

export interface OthelloRoom extends LobbyRoomLike {
  visibility: Visibility;
  roomPlayer: OthelloPlayer[];
  playerOrder?: string[];
  occupiedCount?: number;
  progressCurrent?: number;
  progressTotal?: number;
}

export interface LegalMove {
  index: number;
  flips: number[];
  lines: number[][];
}

export interface MoveEntry {
  id: number;
  kind: string;
  playerID: string;
  side: Side;
  index?: number;
  flips: number[];
  automatic: boolean;
}

export interface PlayerState {
  side: Side;
  discCount: number;
}

export interface Result {
  winnerID?: string;
  winnerSide?: Side;
  blackCount: number;
  whiteCount: number;
  draw: boolean;
  reason: string;
}
