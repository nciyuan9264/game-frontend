
/** 可用的游戏状态类型 */
// export type GameStatus = 'waiting' | 'createCompany' | 'buyStock' | 'merging' | 'mergingSelection' | 'mergingSettle' | 'end' | 'setTile';

interface SplendorCard {
  bonus: CardColorType;
  cost: map<string, number>;
  id: number;
  level: number;
  points: number;
  state: number;
}

interface SplendorNoble {
  id: string;
  cost: map<CardColorType, number>;
  points: number;
  state: number;
}

interface SplendorPlayerData {
  card: map<string, number>;
  gem: map<string, number>;
  reserveCard: SplendorCard[];
  score: number;
}

interface SplendorRoomData {
  card: map<string, SplendorCard[]>;
  gems: map<string, number>;
  nobles: SplendorNoble[];
  currentPlayer: string;
  roomInfo: {
    maxPlayers: number;
    roomStatus: boolean;
    gameStatus: GameStatus;
    round: number;
  }
}

interface SplendorPlayerData {
  card: map<string, number>;
  gem: map<string, number>;
  nobleCard: SplendorNoble[];
  reserveCard: SplendorCard[];
  score: number;
}

interface SplendorWsRoomSyncData {
  playerId: string;
  playerData: map<string, SplendorPlayerData>;
  roomData: SplendorRoomData;
  type: string;
  message?: string;
}
