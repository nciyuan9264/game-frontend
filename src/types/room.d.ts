// 跨游戏复用的房间列表 / REST DTO 单一来源。
// 各游戏专属的对局结构（RoomData / WsRoomSyncData / Card 等）仍放在各自的 *Room.d.ts。

/** 房间内玩家（大厅列表用） */
export interface RoomPlayer {
  playerID: string;
  online: boolean;
  ai: boolean;
  ready: boolean;
}

/**
 * /room/list 的统一房间外壳。
 * 游戏专属的进度字段统一用可选承载（后端 omitempty）：
 * - acquire: emptyTileCount（剩余空地块）
 * - davinci: boardCardCount（牌堆剩余）
 * - splendor: maxScore（房间最高分，满分 15）
 */
export interface ListRoomInfo {
  roomID: string;
  ownerID: string;
  maxPlayers: number;
  status: string;
  emptyTileCount?: number;
  boardCardCount?: number;
  maxScore?: number;
  roomPlayer: RoomPlayer[];
}

export interface CreateRoomRequest {
  RoomID?: string;
  MaxPlayers: number;
  AiCount: number;
  UserID: string;
}

export interface DeleteRoomRequest {
  RoomID: string;
}

export interface CreateRoomReponse {
  roomID: string;
}

export interface DeleteRoomReponse {}

export interface GetRoomListReponse {
  rooms: ListRoomInfo[];
  onlinePlayer: number;
}
