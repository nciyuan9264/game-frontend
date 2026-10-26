import type {
  LobbyPlayerLike,
  LobbyRoomLike,
} from '@/features/game-core/model/room';
export type { LobbyFilter } from '@/features/game-core/model/room';

export type Visibility = 'public' | 'private';
export type GameStatus = 'match' | 'initialize' | 'waiting' | 'getCard' | 'guessCard' | 'setCard' | 'end';

export interface Card {
  id: string;
  color: number;
  num?: number;
  isRevealed?: boolean;
  index?: number;
}

export interface DavinciPlayer extends LobbyPlayerLike {}

export interface DavinciRoom extends LobbyRoomLike {
  visibility: Visibility;
  roomPlayer: DavinciPlayer[];
  playerOrder?: string[];
}
