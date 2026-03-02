/** 可用的游戏状态类型 */
export type GameStatus = 'match' | 'waiting' | 'createCompany' | 'buyStock' | 'merging' | 'mergingSelection' | 'mergingSettle' | 'end' | 'setTile';

interface ListRoomInfo {
  roomID: string;
  ownerID: string;
  maxPlayers: number;
  status: GameStatus;
  emptyTileCount: number;
  roomPlayer: {
    playerID: string;
    online: boolean;
    ready: boolean;
    ai: boolean;
  }[];
}

interface CreateRoomRequest {
  RoomID?: string;
  MaxPlayers: number;
  AiCount: number;
  UserID: string;
}

interface DeleteRoomRequest {
  RoomID: string;
}

interface CreateRoomReponse {
  roomID: string;
}

interface DeleteRoomReponse {}

interface GetRoomListReponse {
  rooms: ListRoomInfo[];
  onlinePlayer: number;
}

interface PlayerData {
  money: number;
  stocks: Record<CompanyKey, number>;
  tiles: string[];
}

type CompanyKey = 'American' | 'Continental' | 'Festival' | 'Imperial' | 'Sackson' | 'Tower' | 'Worldwide' | 'Blank';

interface CompanyInfoItem {
  name: string;
  stockPrice: number;
  stockTotal: number;
  tiles: number;
  valuation: string;
}

interface TileData {
  id: string;
  belong: CompanyKey;
}

interface RoomInfo {
  maxPlayers: string;
  roomStatus: GameStatus; // 你可以加更多状态
  roomStatus: boolean;
  ownerID: string;
}

interface PlayerInfo {
  playerID: string;
  online: boolean;
  ai: boolean;
  ready: boolean;
}

interface RoomData {
  companyInfo: Record<CompanyKey, CompanyInfoItem>;
  currentPlayer: string;
  currentStep: string;
  gameStatus: GameStatus;
  tiles: Record<string, TileData>;
  players: Record<string, PlayerInfo>;
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
  ownerID: string;
  playerData: PlayerData;
  roomData: RoomData;
  tempData: TempData;
  type: string;
  message?: string;
  result?: Record<string, int>;
}

interface WsMatchSyncData {
  type: string;
  roomID: string;
  ownerID: string;
  status: GameStatus;
  playerID: string;
  players: Record<string, PlayerInfo>;
  message?: string;
}
