/** 数据库自增 ID */
export type GameID = number;

/** 支持历史战绩的游戏类型 */
export type HistoryGameType = 'acquire' | 'davinci' | 'splendor';

/** 后端 RoomStatus 枚举 */
export type HistoryGameStatus = string;

/** 后端命令类型（白名单） */
export type CmdType = string;

/** 终局每个玩家的资产快照（与 ROOM_SYNC.result 同形） */
export interface PlayerResult {
  money: number;
  stocks: number;
  total: number;
}
export type PlayerResultMap = Record<string, PlayerResult>;

/** 一局玩家行 */
export interface GamePlayer {
  id: number;
  gameID: GameID;
  userID?: number | null;
  playerID: string;
  seatIndex: number;
  isAI: boolean;
  finalScore?: number | null;
  finalMoney?: number | null;
  finalStocks: number;
  isWinner: boolean;
  createdAt: string;
}

/** 初始状态（GameState，回放种子） */
export type GameStateLike = unknown;

/** 一局元信息 */
export interface Game {
  id: GameID;
  roomID: string;
  gameType: HistoryGameType;
  startedAt: string;
  endedAt?: string | null;
  durationSeconds: number;
  winnerUserID?: number | null;
  winnerPlayerID?: string;
  maxPlayers: number;
  initialState?: GameStateLike | null;
  finalResult?: PlayerResultMap | unknown | null;
  createdAt: string;
  updatedAt: string;
  players?: GamePlayer[];
}

/** 命令时间轴事件（不含 payload，用于做时间轴） */
export interface EventMeta {
  seq: number;
  playerID: string;
  cmdType: CmdType;
}

export interface CompanyState {
  name: string;
  tiles: number;
  stockTotal: number;
  stockPrice: number;
}

export interface SnapshotTile {
  id: string;
  belong: string;
}

/** 与对局中 playerData 同结构 */
export interface PlayerStateLike {
  money: number;
  stocks: Record<string, number>;
  tiles: string[];
}

/** 单步快照（与 ROOM_SYNC 同形，前端可复用对局渲染组件） */
export interface Snapshot {
  seq: number;
  totalEvents: number;
  currentEvent?: {
    seq: number;
    playerID: string;
    cmdType: CmdType;
    payload: unknown;
  };
  roomData: {
    companyInfo: Record<string, CompanyState>;
    currentPlayer: string;
    gameStatus: HistoryGameStatus;
    tiles: Record<string, SnapshotTile>;
    players: Record<string, { playerID: string; online: boolean; ai: boolean }>;
  };
  playersData: Record<string, PlayerStateLike>;
  result: PlayerResultMap;
}

/** 玩家整体胜率统计 */
export interface Stats {
  totalGames: number;
  wins: number;
  winRate: number;
  avgScore: number;
}

export interface ListGamesData {
  games: Game[];
}

export interface GameDetailData {
  game: Game;
  players: GamePlayer[];
  events: EventMeta[];
}
