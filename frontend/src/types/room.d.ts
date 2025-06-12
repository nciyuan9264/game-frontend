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
    money: number;
  };
  stocks: Record<CompanyKey, number>;
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
  stockPrice: number;
  stockTotal: number;
  tiles: string;
  valuation: string;
}

interface TileData {
  id: string;
  belong: CompanyKey;
}



interface RoomInfo {
  maxPlayers: string;
  gameStatus:  GameStatus// 你可以加更多状态
  roomStatus: boolean;
}

interface RoomData {
  companyInfo: Record<CompanyKey, CompanyInfoItem>;
  currentPlayer: string;
  currentStep: string;
  roomInfo: RoomInfo;
  tiles: Record<string, TileData>;
  /**被合并的公司 */
  merge_other_companies_temp: CompanyKey[];
  /** 合并别的公司的公司 */
  merge_main_company_temp: CompanyKey;
  /** 需要合并结算的玩家*/
  merge_settle_player_temp: string[];
  /** 玩家选择留下那个公司 */
  merge_selection_temp: {mainCompany: string[], otherCompany: string[]};
  mergeSettleData: Record<CompanyKey, {
    dividends: Record<string, number>;
    hoders: string[];
  }>
}

interface WsRoomSyncData {
  playerData: PlayerData;
  playerId: string;
  roomData: RoomData;
  type: string;
}
