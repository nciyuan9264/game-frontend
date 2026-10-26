import type {
  WarChestMatchSetup,
  WarChestPlayerState,
  WarChestPrivateData,
  WarChestResult,
  WarChestRoomData,
} from '@/api/generated/game-platform';
import type {
  LobbyPlayerLike,
  LobbyRoomLike,
} from '@/features/game-core/model/room';

export type { LobbyFilter } from '@/features/game-core/model/room';
export type Visibility = 'public' | 'private';
export type SetupMode = 'recommended' | 'random' | 'draft';
export type GameStatus = 'match' | 'waiting' | 'playing' | 'pending' | 'end';

export interface WarChestPlayer extends LobbyPlayerLike {}

export interface WarChestRoom extends LobbyRoomLike {
  visibility: Visibility;
  roomPlayer: WarChestPlayer[];
  playerOrder?: string[];
  displayName?: string;
  turnTimeoutSeconds?: number;
  maxControlledLocations?: number;
}

export type MatchSetup = WarChestMatchSetup;
export type PlayerState = WarChestPlayerState;
export type PrivateData = WarChestPrivateData;
export type Result = WarChestResult;
export type RoomData = WarChestRoomData;
