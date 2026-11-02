import { gameCatalog } from '@/features/home/model/gameCatalog';

const gameNames = new Map<string, string>(gameCatalog.map(game => [game.key, game.title]));

export const gameName = (gameType: string): string => gameNames.get(gameType) ?? gameType;

export const toNumber = (value: string | number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const formatCount = (value: string | number): string =>
  new Intl.NumberFormat('zh-CN').format(toNumber(value));

export const formatPercent = (value: number): string =>
  new Intl.NumberFormat('zh-CN', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);

export const formatHours = (seconds: string | number): string =>
  `${new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(toNumber(seconds) / 3600)} 小时`;

export const formatDuration = (seconds: string | number): string => {
  const total = Math.max(0, Math.round(toNumber(seconds)));
  if (total < 60) return `${total} 秒`;
  const minutes = Math.round(total / 60);
  if (minutes < 60) return `${minutes} 分钟`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder > 0 ? `${hours} 小时 ${remainder} 分` : `${hours} 小时`;
};

export const formatDateTime = (unix: string | number): string =>
  new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(toNumber(unix) * 1000));

export const chartPoints = (values: number[], width: number, height: number): string => {
  if (values.length === 0) return '';
  const max = Math.max(...values, 1);
  const step = values.length === 1 ? 0 : width / (values.length - 1);
  return values
    .map((value, index) => {
      const x = index * step;
      const y = height - (value / max) * height;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
};
