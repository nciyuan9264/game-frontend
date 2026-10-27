import type { ActionLog } from './types';

const pad = (value: number) => String(value).padStart(2, '0');

const sourceSuffix = (action: ActionLog, playerIsAI: boolean) => {
  if (!action.automatic) return '';
  return playerIsAI ? '（AI 操作）' : '（超时托管）';
};

export function formatActionLog(
  action: ActionLog,
  playerIsAI: boolean,
): string {
  let text: string;
  switch (action.kind) {
    case 'draw':
      text = action.numbers?.length
        ? `从第 ${Number(action.deckIndex) + 1} 堆抽到 ${action.numbers.map(pad).join(' / ')}`
        : `从第 ${Number(action.deckIndex) + 1} 堆抽了牌`;
      break;
    case 'playHideout':
      text = action.destination == null
        ? '设置了一处藏身点'
        : `前往 ${pad(action.destination)}，附带 ${action.sprintCount} 张冲刺`;
      break;
    case 'finishOpening':
      text = '完成了初始路线';
      break;
    case 'layLow':
      text = action.numbers?.length
        ? `选择潜伏，并补到 ${action.numbers.map(pad).join(' / ')}`
        : '选择潜伏，并从最低牌堆补牌';
      break;
    case 'search':
      text = `搜查 ${action.numbers?.map(pad).join(' / ') || '未知地点'}：${
        action.success ? '命中' : '未命中'}`;
      break;
    default:
      text = '完成一步行动';
  }
  return `${text}${sourceSuffix(action, playerIsAI)}`;
}
