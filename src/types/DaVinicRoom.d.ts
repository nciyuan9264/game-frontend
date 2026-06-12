/** 可用的游戏状态类型 */
export type GameStatus = 'match' | 'waiting' | 'getCard' | 'guessCard' | 'setCard' | 'end';

interface PlayerInfo {
  playerID: string;
  online: boolean;
  ai: boolean;
  ready: boolean;
}

interface GuessCardLastPayload {
  targetCardID: string;
  targetPlayerID: string;
  guessNum: number;
  correct: boolean;
}

interface LastAction {
  action: 'guess_card' | string;
  playerID: string;
  payload?: GuessCardLastPayload;
}

interface RoomData {
  currentPlayer: string;
  gameStatus: GameStatus;
  players: Record<string, PlayerInfo>;
  boardCards: Record<string, Card>;
  /** 当前阶段结束时间（ISO 字符串） */
  turnDeadline?: string;
  lastData?: LastAction | null;
}

interface Card {
  id: string;
  color: number;
  num: number;
  isRevealed: boolean;
  index?: number;
}

interface CardData {
  self: Card[];
  opponents: Card[];
}

interface WsRoomSyncData {
  playerId: string;
  ownerID: string;
  roomData: RoomData;
  cardData?: CardData;
  type: string;
  message?: string;
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
