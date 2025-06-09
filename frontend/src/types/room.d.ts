/** 可用的游戏状态类型 */
export type GameStatus =
  | "waiting"
  | "createCompany"
  | "buyStock"
  | "merging"
  | "mergingSelection"
  | "mergingSettle"
  | "end"

// 如果你需要对每个状态加名字，也可以这样定义：
export const GameStatusMap: Record<GameStatus, string> = {
  WAITING: "等待中",
  PLAYING: "游戏中",
  CREATE_COMPANY: "创建公司",
  MERGE: "并购中",
  END: "已结束"
};
interface Room {
  roomID: string;
  maxPlayers: number;
  status: GameStatus;
}

interface CreateRoomRequest {
  RoomID?: string;
  MaxPlayers: number;
}

interface CreateRoomReponse {
  room_id: string;
}

interface GetRoomListReponse{
  rooms: Room[];
}

interface PlayerData {
  info: {
    money: string;
  };
  stocks: Record<CompanyKey, string>;
  tiles: string[];
}

type CompanyKey =
  | 'American'
  | 'Continental'
  | 'Festival'
  | 'Imperial'
  | 'Sackson'
  | 'Tower'
  | 'Worldwide'
  | 'Blank';

interface CompanyInfoItem {
  name: string;
  stockPrice: string;
  stockTotal: string;
  tiles: string;
  valuation: string;
}

interface TileData {
  id: string;
  belong: CompanyKey;
}



interface RoomInfo {
  maxPlayers: string;
  status:  GameStatus// 你可以加更多状态
}

interface RoomData {
  companyInfo: Record<CompanyKey, CompanyInfoItem>;
  currentPlayer: string;
  currentStep: string;
  roomInfo: RoomInfo;
  tiles: Record<string, TileData>;
}

interface WsRoomSyncData {
  playerData: PlayerData;
  playerId: string;
  roomData: RoomData;
  type: string;
}
