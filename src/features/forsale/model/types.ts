import type {
  LobbyPlayerLike,
  LobbyRoomLike,
} from '@/features/game-core/model/room';
export type { LobbyFilter } from '@/features/game-core/model/room';

export type Visibility = 'public' | 'private';
export type GameStatus =
  | 'match'
  | 'waiting'
  | 'auction'
  | 'buyResult'
  | 'bridge'
  | 'sellSelect'
  | 'sellLocked'
  | 'sellReveal'
  | 'end';

export interface ForSalePlayer extends LobbyPlayerLike {
  displayName: string;
  seatIndex: number;
}

export interface ForSaleRoom extends LobbyRoomLike {
  visibility: Visibility;
  roomPlayer: ForSalePlayer[];
}

export const startingCoins = (players: number) =>
  players === 3 ? 28 : players === 4 ? 21 : players === 5 ? 16 : 14;

export const roundsFor = (players: number) =>
  players === 3 ? 8 : players === 4 ? 7 : players === 5 ? 6 : 5;

export const refund = (bid: number) => Math.ceil(Math.max(0, bid) / 2);

export const chequeMoney = (value: number) =>
  `$${(value * 1000).toLocaleString('en-US')}`;

const propertyTitles = [
  '河畔小屋',
  '花园村舍',
  '街角洋房',
  '露台别墅',
  '都会公馆',
  '日光庄园',
];

export const propertyType = (value: number) =>
  Math.min(5, Math.max(0, Math.floor((value - 1) / 5)));

export const propertyName = (value: number) =>
  propertyTitles[propertyType(value)];
