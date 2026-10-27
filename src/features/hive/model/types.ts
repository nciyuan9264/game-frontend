import type {
  LobbyPlayerLike,
  LobbyRoomLike,
} from '@/features/game-core/model/room';
export type { LobbyFilter } from '@/features/game-core/model/room';

export type Visibility = 'public' | 'private';
export type Side = 'white' | 'black';
export type PieceKind =
  | 'queen'
  | 'ant'
  | 'beetle'
  | 'grasshopper'
  | 'spider';
export type ActionKind = 'place' | 'move' | 'pass' | 'resign';
export type GameStatus = 'match' | 'waiting' | 'playing' | 'end';
export type ActionMode = 'place' | 'move';

export interface Hex {
  q: number;
  r: number;
}

export interface Piece {
  pieceID: string;
  side: Side;
  kind: PieceKind;
  number: number;
}

export interface Stack {
  position: Hex;
  pieces: Piece[];
}

export interface MoveOption {
  kind: 'place' | 'move';
  pieceID: string;
  to: Hex;
  path: Hex[];
}

export interface ActionEntry {
  id: number;
  kind: ActionKind;
  playerID: string;
  side: Side;
  pieceID?: string;
  from?: Hex;
  to?: Hex;
  path: Hex[];
  automatic: boolean;
}

export interface PlayerState {
  side: Side;
  turnsTaken: number;
  queenPlaced: boolean;
  queenPressure: number;
  reserveByKind: Record<PieceKind, number>;
}

export interface Result {
  winnerID?: string;
  winnerSide?: Side;
  draw: boolean;
  reason: string;
  turnCount: number;
  placedPieceCount: number;
  maxStackHeight: number;
}

export interface HivePlayer extends LobbyPlayerLike {}

export interface HiveRoom extends LobbyRoomLike {
  visibility: Visibility;
  roomPlayer: HivePlayer[];
  playerOrder?: string[];
  turnCount?: number;
  placedPieceCount?: number;
}

export interface PendingAction {
  kind: 'place' | 'move';
  pieceID: string;
  to: Hex;
  path: Hex[];
}
