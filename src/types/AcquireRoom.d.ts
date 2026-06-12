/** 可用的游戏状态类型 */
export type GameStatus = 'match' | 'waiting' | 'createCompany' | 'buyStock' | 'merging' | 'mergingSelection' | 'mergingSettle' | 'end' | 'setTile';

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
  /** 当前阶段结束时间（ISO 字符串） */
  turnDeadline?: string;
  /** 当前阶段计划时长，单位毫秒 */
  turnTimeoutMs?: number;
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
  result?: Record<string, { money: number; stocks: number; total: number }>;
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
