import type {
  LobbyPlayerLike,
  LobbyRoomLike,
} from '@/features/game-core/model/room';
export type { LobbyFilter } from '@/features/game-core/model/room';

export type Visibility = 'public' | 'private';
export type Side = 'blue' | 'red';
export type PieceKind = 'master' | 'student';
export type ActionKind = 'move' | 'pass' | 'resign';
export type GameStatus = 'match' | 'waiting' | 'playing' | 'end';
export type CardID =
  | 'tiger'
  | 'dragon'
  | 'frog'
  | 'rabbit'
  | 'crab'
  | 'elephant'
  | 'goose'
  | 'rooster'
  | 'monkey'
  | 'mantis'
  | 'horse'
  | 'ox'
  | 'crane'
  | 'boar'
  | 'eel'
  | 'cobra';

export interface Cell {
  row: number;
  column: number;
}

export interface MoveOffset {
  x: number;
  y: number;
}

export interface CardDefinition {
  id: CardID;
  name: string;
  englishName: string;
  glyph: string;
  mark: Side;
  moves: readonly MoveOffset[];
  summary: string;
  description: string;
}

export interface Piece {
  id: string;
  side: Side;
  kind: PieceKind;
  cell: Cell;
}

export interface LegalMove {
  cardID: CardID;
  pieceID: string;
  to: Cell;
  capturedPieceID?: string;
  winning: boolean;
}

export interface ActionEntry {
  id: number;
  kind: ActionKind;
  playerID: string;
  side: Side;
  cardID?: CardID;
  pieceID?: string;
  from?: Cell;
  to?: Cell;
  capturedPieceID?: string;
  capturedKind?: PieceKind;
  receivedCardID?: CardID;
  automatic: boolean;
}

export interface PlayerState {
  side: Side;
  pieceCount: number;
  masterAlive: boolean;
}

export interface Result {
  winnerID?: string;
  winnerSide?: Side;
  reason: 'stone' | 'stream' | 'resign' | string;
  turnCount: number;
  winnerPieceCount: number;
}

export interface OnitamaPlayer extends LobbyPlayerLike {}

export interface OnitamaRoom extends LobbyRoomLike {
  visibility: Visibility;
  roomPlayer: OnitamaPlayer[];
  playerOrder?: string[];
  turnCount?: number;
}

export interface PendingMove {
  cardID: CardID;
  pieceID: string;
  to: Cell;
}
