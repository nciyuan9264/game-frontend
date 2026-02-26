/** 可用的游戏状态类型 */
type GameStatus = 'waiting' | 'playing' | 'last_turn' | 'end';

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


interface SplendorRoomData {
  card: map<string, SplendorCard[]>;
  gems: map<string, number>;
  nobles: SplendorNoble[];
  currentPlayer: string;
  roomInfo: {
    maxPlayers: number;
    roomStatus: GameStatus;
    round: number;
  };
}

interface SplendorPlayerData {
  normalCard: SplendorCard[];
  nobleCard: SplendorNoble[];
  reserveCard: SplendorCard[];
  gem: map<string, number>;
  score: number;
}

interface SplendorWsRoomSyncData {
  playerId: string;
  playerData: map<string, SplendorPlayerData>;
  roomData: SplendorRoomData;
  type: string;
  message?: string;
}
