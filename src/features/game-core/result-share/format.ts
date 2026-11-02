import type { GameType } from '@/hooks/useGameType';
import type { ResultCardPlayer } from './model';
import type { ResultCardTheme } from './themes';

const beijingDate = new Intl.DateTimeFormat('zh-CN', {
  timeZone: 'Asia/Shanghai',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

export function formatResultDate(value: string): string {
  return beijingDate.format(new Date(value)).replace(/\//g, '.');
}

export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor(seconds % 3600 / 60);
  const remainder = seconds % 60;
  if (hours > 0) return `${hours}小时${minutes}分`;
  if (minutes > 0) return `${minutes}分${remainder}秒`;
  return `${remainder}秒`;
}

export function formatRank(rank?: number): string {
  return rank == null ? '—' : `第 ${rank} 名`;
}

export function formatScore(
  gameType: GameType,
  value?: number,
): string {
  if (value == null) return '—';
  if (gameType === 'acquire' || gameType === 'forsale') {
    return `¥${value.toLocaleString('zh-CN')}`;
  }
  return value.toLocaleString('zh-CN');
}

export function formatRole(
  player: ResultCardPlayer,
  theme: ResultCardTheme,
): string | undefined {
  if (!player.gameRole) return;
  return theme.roleLabels?.[player.gameRole] ?? player.gameRole;
}

export function resultImageFilename(
  gameType: GameType,
  nickname: string,
  endedAt: string,
): string {
  const date = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
  }).format(new Date(endedAt)).replace(/-/g, '');
  const safeName = nickname
    .trim()
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, '-')
    .slice(0, 32) || 'player';
  return `${gameType}-${safeName}-${date}.png`;
}
