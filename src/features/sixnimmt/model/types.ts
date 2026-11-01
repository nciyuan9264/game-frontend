import type {
  LobbyPlayerLike,
  LobbyRoomLike,
} from '@/features/game-core/model/room';

export type Visibility = 'public' | 'private';
export type GameStatus =
  | 'match'
  | 'waiting'
  | 'selecting'
  | 'revealing'
  | 'chooseRow'
  | 'roundEnd'
  | 'end';
export type LobbyFilter = 'all' | 'joinable' | 'playing';

export interface SixNimmtPlayer extends LobbyPlayerLike {}

export interface SixNimmtRoom extends LobbyRoomLike {
  visibility: Visibility;
  roomPlayer: SixNimmtPlayer[];
  playerOrder?: string[];
}
