import type {
  LobbyPlayerLike,
  LobbyRoomLike,
} from '@/features/game-core/model/room';

export type Visibility = 'public' | 'private';
export type GameStatus =
  | 'match'
  | 'waiting'
  | 'roll'
  | 'choose'
  | 'decide'
  | 'bust'
  | 'banked'
  | 'end';
export type LobbyFilter = 'all' | 'joinable' | 'playing';

export interface CantStopPlayer extends LobbyPlayerLike {}

export interface CantStopRoom extends LobbyRoomLike {
  visibility: Visibility;
  roomPlayer: CantStopPlayer[];
  playerOrder?: string[];
  maxClaimedColumns?: number;
  targetColumns?: number;
}
