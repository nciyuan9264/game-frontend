import type { ListRoomInfo, RoomPlayer } from '@/types/room';

export type GameStatus = 'match' | 'waiting' | 'getCard' | 'guessCard' | 'setCard' | 'end';

export interface Card {
  id: string;
  color: number;
  num?: number;
  isRevealed?: boolean;
  index?: number;
}

export interface DavinciPlayer extends RoomPlayer {
  name?: string;
  avatar?: string;
}

export interface DavinciRoom extends Omit<ListRoomInfo, 'roomPlayer'> {
  roomPlayer: DavinciPlayer[];
  playerOrder?: string[];
  ownerName?: string;
  ownerAvatar?: string;
  isMember?: boolean;
}

export type LobbyFilter = 'all' | 'joinable' | 'playing';
