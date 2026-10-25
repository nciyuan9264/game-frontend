import type {
  LobbyPlayerLike,
  LobbyRoomLike,
} from '@/features/game-core/model/room';
export type { LobbyFilter } from '@/features/game-core/model/room';

export type Visibility = 'public' | 'private';
export type Role = 'fugitive' | 'marshal';
export type GameStatus =
  | 'match'
  | 'waiting'
  | 'opening'
  | 'draw'
  | 'fugitiveAction'
  | 'marshalSearch'
  | 'manhunt'
  | 'end';

export interface Card {
  number: number;
  sprint: number;
}

export interface RouteCard {
  index: number;
  revealed: boolean;
  sprintCount: number;
  card?: Card;
  sprints?: Card[];
}

export interface DeckState {
  deckIndex: number;
  min: number;
  max: number;
  remaining: number;
}

export interface ActionLog {
  id: number;
  roundNo: number;
  kind: string;
  playerID: string;
  role: Role;
  deckIndex?: number;
  numbers?: number[];
  destination?: number;
  sprintCount: number;
  success?: boolean;
  automatic: boolean;
  private?: boolean;
}

export interface PlayerState {
  role: Role;
  handCount: number;
}

export interface Result {
  winnerID: string;
  winnerRole: Role;
  reason: string;
  searches: number;
}

export interface FugitivePlayer extends LobbyPlayerLike {
  gameRole?: Role;
}

export interface FugitiveRoom extends LobbyRoomLike {
  visibility: Visibility;
  roomPlayer: FugitivePlayer[];
  playerOrder?: string[];
  displayName?: string;
  turnTimeoutSeconds?: number;
  highestRevealed?: number;
  hiddenHideoutCount?: number;
}
