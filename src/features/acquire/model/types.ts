import type {
  LobbyPlayerLike,
  LobbyRoomLike,
} from '@/features/game-core/model/room';
export type { LobbyFilter } from '@/features/game-core/model/room';

export type Visibility = 'public' | 'private';
export interface AcquirePlayer extends LobbyPlayerLike {}
export interface AcquireRoom extends LobbyRoomLike {
  visibility: Visibility;
  roomPlayer: AcquirePlayer[];
  playerOrder?: string[];
}
export const companyKeys = ['American', 'Continental', 'Festival', 'Imperial', 'Sackson', 'Tower', 'Worldwide'] as const;
export type Company = typeof companyKeys[number];
export const companyColors: Record<Company, string> = {
  American: '#82b1e1', Continental: '#8dc19c', Festival: '#d4b96f', Imperial: '#cf8d89',
  Sackson: '#bd9dce', Tower: '#75bec5', Worldwide: '#9aacbb',
};
export const companyPriceTiers: Record<Company, number> = {
  American: 1, Continental: 2, Festival: 1, Imperial: 2, Sackson: 0, Tower: 0, Worldwide: 1,
};
