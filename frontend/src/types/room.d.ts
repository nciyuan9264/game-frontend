/** 可用的游戏状态类型 */
export type GameStatus = 'waiting' | 'createCompany' | 'buyStock' | 'merging' | 'mergingSelection' | 'mergingSettle' | 'end'| 'setTile';

interface ListRoomInfo {
  roomID: string;
  userID: string;
  maxPlayers: number;
  status: boolean;
  roomPlayer: {
    playerID: string;
    online: boolean;
  }[]
}

interface CreateRoomRequest {
  RoomID?: string;
  MaxPlayers: number;
  UserID: string;
}

interface DeleteRoomRequest{
  RoomID: string;
}

interface CreateRoomReponse {
  room_id: string;
}

interface DeleteRoomReponse{
}

interface GetRoomListReponse {
  rooms: ListRoomInfo[];
}

interface PlayerData {
  info: {
    money: number;
  };
  stocks: Record<CompanyKey, number>;
  tiles: string[];
}

type CompanyKey = 'American' | 'Continental' | 'Festival' | 'Imperial' | 'Sackson' | 'Tower' | 'Worldwide' | 'Blank';

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
  gameStatus: GameStatus; // 你可以加更多状态
  roomStatus: boolean;
}

interface RoomData {
  companyInfo: Record<CompanyKey, CompanyInfoItem>;
  currentPlayer: string;
  currentStep: string;
  roomInfo: RoomInfo;
  tiles: Record<string, TileData>;
}

interface TempData {
  last_tile_key: string;
  mergeSettleData: Record<
    CompanyKey,
    {
      dividends: Record<string, number>;
      hoders: string[];
    }
  >;
  /** 合并别的公司的公司 */
  merge_main_company_temp: CompanyKey;
  /** 玩家选择留下那个公司 */
  merge_selection_temp: { mainCompany: string[]; otherCompany: string[] };
}

interface WsRoomSyncData {
  playerId: string;
  playerData: PlayerData;
  roomData: RoomData;
  tempData: TempData;
  type: string;
  message?: string;
  result?: Record<string, int>;
}
