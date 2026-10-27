import type {
  LobbyPlayerLike,
  LobbyRoomLike,
} from '@/features/game-core/model/room';
export type { LobbyFilter } from '@/features/game-core/model/room';

export type Visibility = 'public' | 'private';
export type Side = 'red' | 'teal';
export type Stone = '' | Side;
export type GameStatus = 'match' | 'waiting' | 'playing' | 'end';

export interface Cell {
  row: number;
  column: number;
}

export interface ActionEntry {
  id: number;
  kind: 'place' | 'swap' | 'resign';
  playerID: string;
  side: Side;
  cell?: Cell;
  automatic: boolean;
}

export interface PlayerState {
  side: Side;
  stoneCount: number;
}

export interface Result {
  winnerID?: string;
  winnerSide?: Side;
  reason: string;
  turnCount: number;
  pathLength: number;
  redStoneCount: number;
  tealStoneCount: number;
}

export interface HexPlayer extends LobbyPlayerLike {}

export interface HexRoom extends LobbyRoomLike {
  visibility: Visibility;
  roomPlayer: HexPlayer[];
  playerOrder?: string[];
  turnCount?: number;
}
