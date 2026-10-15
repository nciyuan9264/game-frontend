import type { ListRoomInfo, RoomPlayer } from '@/types/room';

export type Visibility = 'public' | 'private';
export interface AcquirePlayer extends RoomPlayer {
  name?: string;
  avatar?: string;
}
export interface AcquireRoom extends Omit<ListRoomInfo, 'roomPlayer'> {
  visibility: Visibility;
  roomPlayer: AcquirePlayer[];
  playerOrder?: string[];
  ownerName?: string;
  ownerAvatar?: string;
  isMember?: boolean;
}
export type LobbyFilter = 'all' | 'joinable' | 'playing';
export const companyKeys = ['American', 'Continental', 'Festival', 'Imperial', 'Sackson', 'Tower', 'Worldwide'] as const;
export type Company = typeof companyKeys[number];
export const companyColors: Record<Company, string> = {
  American: '#82b1e1', Continental: '#8dc19c', Festival: '#d4b96f', Imperial: '#cf8d89',
  Sackson: '#bd9dce', Tower: '#75bec5', Worldwide: '#9aacbb',
};
export const companyPriceTiers: Record<Company, number> = {
  American: 1, Continental: 2, Festival: 1, Imperial: 2, Sackson: 0, Tower: 0, Worldwide: 1,
};
