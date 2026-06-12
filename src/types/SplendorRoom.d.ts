/** Splendor 对局状态枚举字符串 */
export type SplendorGameStatusType = 'waiting' | 'playing' | 'last_turn' | 'end';

/** Splendor 大厅/房间状态（含 match） */
export type SplendorRoomStatusType = 'match' | SplendorGameStatusType;

/** 五种宝石颜色（不含金） */
export type CardColorType = 'Black' | 'Blue' | 'Green' | 'Red' | 'White';
/** 全部宝石颜色（含金 Gold） */
export type GemColorType = CardColorType | 'Gold';

/** 发展卡 */
export interface SplendorNormalCard {
  id: number;
  level: number;
  bonus: CardColorType;
  points: number;
  cost: Record<string, number>;
  state: number; // 0 隐藏 / 1 翻开 / 2 已购买
}

/** 贵族卡 */
export interface SplendorNoble {
  id: string;
  cost: Record<string, number>;
  points: number;
  state: number;
}

/** 单个玩家的对局数据 */
export interface SplendorPlayerData {
  normalCard: SplendorNormalCard[];
  nobleCard: SplendorNoble[];
  reserveCard: SplendorNormalCard[];
  gem: Record<string, number>;
  score: number;
}

/** 最近一次动作 */
export interface SplendorLastAction {
  action: string;
  playerID: string;
  payload?: unknown;
}

/** roomInfo —— 注意 roomStatus 是 boolean，对局状态读 gameStatus */
export interface SplendorRoomInfo {
  roomStatus: boolean;
  gameStatus: SplendorGameStatusType;
  maxPlayers: number;
  userID: string;
}

/** 房间公共数据 */
export interface SplendorRoomData {
  card: Record<string, SplendorNormalCard[]>;
  gems: Record<string, number>;
  nobles: SplendorNoble[];
  currentPlayer: string;
  roomInfo: SplendorRoomInfo;
  lastData?: SplendorLastAction | null;
  turnDeadline?: string | null;
  turnTimeoutMs?: number;
}

/** 对局同步消息（type === 'sync'） */
export interface SplendorWsRoomSyncData {
  type: string;
  playerId: string;
  playerData: Record<string, SplendorPlayerData>;
  roomData: SplendorRoomData;
  message?: string;
}

/** 大厅玩家信息 */
export interface SplendorPlayerInfo {
  playerID: string;
  online: boolean;
  ai: boolean;
  ready: boolean;
}

/** 大厅同步消息（type === 'MATCH_SYNC'） */
export interface SplendorWsMatchSyncData {
  type: string;
  roomID: string;
  ownerID: string;
  status: SplendorRoomStatusType;
  playerID: string;
  players: Record<string, SplendorPlayerInfo>;
  message?: string;
}
