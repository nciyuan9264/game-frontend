import type {
  LobbyPlayerLike,
  LobbyRoomLike,
} from '@/features/game-core/model/room';
export type { LobbyFilter } from '@/features/game-core/model/room';

export type Visibility = 'public' | 'private';
export type GameStatus = 'match' | 'waiting' | 'playing' | 'last_turn' | 'end';
export type CardColor = 'White' | 'Blue' | 'Green' | 'Red' | 'Black';
export type GemColor = CardColor | 'Gold';
export type GemCounts = Partial<Record<GemColor, number>>;

export interface GemTakePayload {
  take: Partial<Record<CardColor, number>>;
  returns?: GemCounts;
}

export interface ReserveCardPayload {
  cardID: number;
  returns?: GemCounts;
}

export interface SplendorPlayer extends LobbyPlayerLike {}

export interface SplendorRoom extends LobbyRoomLike {
  visibility: Visibility;
  roomPlayer: SplendorPlayer[];
  playerOrder?: string[];
}

export interface DevelopmentCard {
  id: number;
  level: number;
  bonus: CardColor;
  points: number;
  cost: Partial<Record<CardColor, number>>;
  state: number;
}

export interface Noble {
  id: string;
  cost: Partial<Record<CardColor, number>>;
  points: number;
  state: number;
}

export interface PlayerState {
  normalCard: DevelopmentCard[];
  nobleCard: Noble[];
  reserveCard: DevelopmentCard[];
  gem: GemCounts;
  score: number;
}

export interface SplendorResult {
  score: number;
  cards: number;
  nobles: number;
}

export const cardColors: CardColor[] = ['White', 'Blue', 'Green', 'Red', 'Black'];
export const gemColors: GemColor[] = [...cardColors, 'Gold'];

export const gemMeta: Record<GemColor, { label: string; short: string }> = {
  White: { label: '钻石', short: '白' },
  Blue: { label: '蓝宝石', short: '蓝' },
  Green: { label: '祖母绿', short: '绿' },
  Red: { label: '红宝石', short: '红' },
  Black: { label: '玛瑙', short: '黑' },
  Gold: { label: '黄金', short: '金' },
};
