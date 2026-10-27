import type {
  LobbyPlayerLike,
  LobbyRoomLike,
} from '@/features/game-core/model/room';
export type { LobbyFilter } from '@/features/game-core/model/room';

export type Visibility = 'public' | 'private';
export type GameStatus =
  | 'match'
  | 'waiting'
  | 'draw'
  | 'play'
  | 'chancellor'
  | 'roundEnd'
  | 'end';

export interface LoveLetterPlayer extends LobbyPlayerLike {
  displayName: string;
  seatIndex: number;
}

export interface LoveLetterRoom extends LobbyRoomLike {
  visibility: Visibility;
  roomPlayer: LoveLetterPlayer[];
  currentRound?: number;
  maxFavor?: number;
  targetFavor?: number;
}
