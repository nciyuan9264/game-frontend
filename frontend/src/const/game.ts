import { GameStatus } from "@/types/room";

export const GameStatusMap: Record<GameStatus, string> = {
  waiting: '等待中',
  createCompany: '游戏中',
  buyStock: '购买股票',
  setTile: '设置地块',
  merging: '并购中',
  mergingSelection: '选择并购公司',
  mergingSettle: '结算并购',
  end: '已结束',
};