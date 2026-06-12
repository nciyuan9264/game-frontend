import { SplendorGameStatus } from '@/enum/game';
import {
  CardColorType,
  GemColorType,
  SplendorLastAction,
  SplendorNormalCard,
  SplendorWsRoomSyncData,
} from '@/types/SplendorRoom';
import { backendName2FrontendName } from '@/util/user';

/**
 * 宝石/卡牌颜色视觉配置（深色珠宝主题）。
 * key 沿用后端英文标识；每色给出主色、渐变高光、文字色，用于纯 CSS 重绘。
 */
export interface GemVisual {
  /** token 主体色 */
  main: string;
  /** 高光色（径向渐变中心） */
  light: string;
  /** 暗部色（径向渐变边缘） */
  dark: string;
  /** 文字色 */
  text: string;
  /** 中文名 */
  label: string;
}

export const GemColor: Record<GemColorType, GemVisual> = {
  White: { main: '#e8edf5', light: '#ffffff', dark: '#b9c2d4', text: '#1f2430', label: '钻石' },
  Blue: { main: '#3b82f6', light: '#7db1ff', dark: '#1d4ed8', text: '#ffffff', label: '蓝宝石' },
  Green: { main: '#10b981', light: '#5ee3b2', dark: '#047857', text: '#ffffff', label: '祖母绿' },
  Red: { main: '#ef4444', light: '#ff8a8a', dark: '#b91c1c', text: '#ffffff', label: '红宝石' },
  Black: { main: '#4b5563', light: '#8b94a3', dark: '#1f2530', text: '#ffffff', label: '玛瑙' },
  Gold: { main: '#f5c451', light: '#ffe7a0', dark: '#c8941f', text: '#3a2c08', label: '黄金' },
};

/** 拿宝石时可选的全部颜色（含 Gold，Gold 不可主动拿） */
export const gemColors: GemColorType[] = ['White', 'Blue', 'Green', 'Red', 'Black', 'Gold'];
/** 五种发展卡颜色（折扣色，不含 Gold） */
export const cardColors: CardColorType[] = ['White', 'Blue', 'Green', 'Red', 'Black'];

/** 读取当前对局状态（注意从 roomInfo.gameStatus 读，而非 roomStatus） */
export const getGameStatus = (data?: SplendorWsRoomSyncData): SplendorGameStatus | undefined => {
  return data?.roomData.roomInfo.gameStatus as SplendorGameStatus | undefined;
};

/** 是否处于「可行动」对局（playing / last_turn） */
export const isPlayableStatus = (data?: SplendorWsRoomSyncData): boolean => {
  const status = getGameStatus(data);
  return status === SplendorGameStatus.PLAYING || status === SplendorGameStatus.LAST_TURN;
};

/** 当前连接用户是否为当前回合玩家 */
export const isCurrentPlayer = (data?: SplendorWsRoomSyncData, userID?: string): boolean => {
  if (!data || !userID) return false;
  return data.roomData.currentPlayer === userID;
};

/** 当前用户是否房主（roomInfo.userID = ownerID） */
export const isOwner = (data?: SplendorWsRoomSyncData, userID?: string): boolean => {
  if (!data || !userID) return false;
  return data.roomData.roomInfo.userID === userID;
};

/** 统计玩家已购发展卡的折扣计数（按 bonus 颜色，过滤 Gold） */
export const getCardCountByColor = (
  normalCard?: SplendorNormalCard[]
): Record<CardColorType, number> => {
  const count: Record<CardColorType, number> = {
    Black: 0,
    Blue: 0,
    Green: 0,
    Red: 0,
    White: 0,
  };
  normalCard?.forEach((card) => {
    const color = card.bonus as CardColorType;
    if (color in count) {
      count[color] += 1;
    }
  });
  return count;
};

/**
 * 判断当前玩家是否买得起某张卡。
 * 折扣（已购卡）+ 宝石覆盖各色成本，不足部分用 Gold 补，Gold 不够则不可买。
 */
export const canBuy = (data?: SplendorWsRoomSyncData, card?: SplendorNormalCard): boolean => {
  if (!data || !card) return false;
  const userID = data.playerId;
  if (userID !== data.roomData.currentPlayer) return false;
  if (!isPlayableStatus(data)) return false;

  const player = data.playerData[userID];
  if (!player) return false;

  const cardCount = getCardCountByColor(player.normalCard);
  let remainingGold = player.gem['Gold'] ?? 0;

  for (const [color, cost] of Object.entries(card.cost)) {
    if (!cost) continue;
    const owned = (player.gem[color] ?? 0) + (cardCount[color as CardColorType] ?? 0);
    if (owned < cost) {
      const needGold = cost - owned;
      if (remainingGold >= needGold) {
        remainingGold -= needGold;
      } else {
        return false;
      }
    }
  }
  return true;
};

/** 判断当前玩家是否可预留某张卡 */
export const canPreserve = (data?: SplendorWsRoomSyncData, card?: SplendorNormalCard): boolean => {
  if (!data || !card) return false;
  const userID = data.playerId;
  if (userID !== data.roomData.currentPlayer) return false;
  if (getGameStatus(data) !== SplendorGameStatus.PLAYING) return false;
  if (card.state === 2) return false;

  const player = data.playerData[userID];
  if (!player) return false;

  const totalGem = Object.values(player.gem || {}).reduce((sum, v) => sum + (v as number), 0);
  if (totalGem >= 10) return false;
  if ((player.reserveCard?.length ?? 0) >= 3) return false;
  if ((data.roomData.gems['Gold'] ?? 0) === 0) return false;
  return true;
};

/**
 * 拿宝石合法性校验（纯校验，依赖外部传入的当前选择）。
 * 规则：当前回合 + playing；不超 10 颗上限；拿 3 颗必须全异色；
 * 不允许「拿 2 颗同色且该色库存 ≤ 3」。
 */
export const isTwoSameColorAndLowSupply = (
  selectedGems: (CardColorType | null)[],
  availableGems: Record<string, number>
): boolean => {
  const countMap = selectedGems.filter(Boolean).reduce((acc, color) => {
    acc[color!] = (acc[color!] || 0) + 1;
    return acc;
  }, {} as Record<CardColorType, number>);

  return Object.entries(countMap).some(([color, count]) => {
    return count === 2 && (availableGems[color] ?? 0) <= 3;
  });
};

export const canGetGems = (
  data: SplendorWsRoomSyncData | undefined,
  userID: string,
  selectedGems: (CardColorType | null)[]
): boolean => {
  if (!data) return false;
  if (userID !== data.roomData.currentPlayer) return false;
  if (getGameStatus(data) !== SplendorGameStatus.PLAYING) return false;

  const filteredGems = selectedGems.filter(Boolean) as CardColorType[];
  if (filteredGems.length === 0) return false;

  const player = data.playerData[userID];
  const totalGems = Object.values(player?.gem || {}).reduce(
    (sum, count) => sum + (count as number),
    0
  );
  if (totalGems + filteredGems.length > 10) return false;

  const colorCountMap = filteredGems.reduce((acc, color) => {
    acc[color] = (acc[color] || 0) + 1;
    return acc;
  }, {} as Record<CardColorType, number>);

  // 拿 3 颗必须全异色
  if (filteredGems.length === 3 && Object.keys(colorCountMap).length !== 3) {
    return false;
  }

  if (isTwoSameColorAndLowSupply(selectedGems, data.roomData.gems || {})) {
    return false;
  }

  return true;
};

/** 上一步动作的可读描述 */
export interface LastActionView {
  badge: string;
  text: string;
}

/** 将 lastData 解析成顶栏可读的上一步动作描述 */
export const formatLastAction = (lastData?: SplendorLastAction | null): LastActionView | null => {
  if (!lastData?.action) return null;

  const who = backendName2FrontendName(lastData.playerID);

  switch (lastData.action) {
    case 'get_gem': {
      const payload = (lastData.payload ?? {}) as Record<string, number>;
      const parts = Object.entries(payload)
        .filter(([, num]) => num > 0)
        .map(([color, num]) => `${GemColor[color as GemColorType]?.label ?? color}×${num}`);
      if (parts.length === 0) return { badge: '跳过', text: `${who} 放弃了拿取宝石` };
      return { badge: '拿宝石', text: `${who} 拿取了 ${parts.join('、')}` };
    }
    case 'buy_card': {
      const card = lastData.payload as SplendorNormalCard | undefined;
      const bonus = card ? GemColor[card.bonus]?.label ?? card.bonus : '';
      const points = card?.points ? `（${card.points} 分）` : '';
      return { badge: '购买', text: `${who} 购买了一张${bonus}卡${points}` };
    }
    case 'preserve_card': {
      const card = lastData.payload as SplendorNormalCard | undefined;
      const bonus = card ? GemColor[card.bonus]?.label ?? card.bonus : '';
      return { badge: '保留', text: `${who} 保留了一张${bonus}卡` };
    }
    case 'turn_timeout':
      return { badge: '超时', text: `${who} 操作超时，自动跳过` };
    default:
      return null;
  }
};
