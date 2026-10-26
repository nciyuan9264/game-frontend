import type {
  LobbyPlayerLike,
  LobbyRoomLike,
} from '@/features/game-core/model/room';
export type { LobbyFilter } from '@/features/game-core/model/room';

export type Visibility = 'public' | 'private';
export type Side = 'south' | 'north';
export type Orientation = 'h' | 'v';
export type GameStatus = 'match' | 'waiting' | 'playing' | 'end';
export type ActionMode = 'move' | 'wall';
export type WallReason =
  | 'overlap'
  | 'crossing'
  | 'blocks_path'
  | 'no_stock'
  | string;

export interface Cell {
  row: number;
  column: number;
}

export interface WallSpec extends Cell {
  orientation: Orientation;
}

export interface Wall extends WallSpec {
  side: Side;
}

export interface WallOption extends WallSpec {
  legal: boolean;
  reasonCode?: WallReason;
}

export interface ActionEntry {
  id: number;
  kind: 'move' | 'wall' | 'resign';
  playerID: string;
  side: Side;
  from?: Cell;
  to?: Cell;
  wall?: WallSpec;
  automatic: boolean;
}

export interface PlayerState {
  side: Side;
  wallsRemaining: number;
  distanceToGoal: number;
}

export interface Result {
  winnerID?: string;
  winnerSide?: Side;
  reason: string;
  turnCount: number;
  placedWallCount: number;
}

export interface QuoridorPlayer extends LobbyPlayerLike {}

export interface QuoridorRoom extends LobbyRoomLike {
  visibility: Visibility;
  roomPlayer: QuoridorPlayer[];
  playerOrder?: string[];
  turnCount?: number;
}

export type PendingAction =
  | { kind: 'move'; to: Cell }
  | { kind: 'wall'; wall: WallSpec };
