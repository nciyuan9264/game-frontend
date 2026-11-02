import { useCallback, useState } from 'react';

export interface DateRange {
  start: string;
  end: string;
}

export type DatePresetKey =
  | 'this_week'
  | 'this_biweek'
  | 'this_month'
  | 'last_7_days'
  | 'last_30_days'
  | 'last_90_days';

export const datePresets: ReadonlyArray<{ key: DatePresetKey; label: string }> = [
  { key: 'this_week', label: '本周' },
  { key: 'this_biweek', label: '本双周' },
  { key: 'this_month', label: '本月' },
  { key: 'last_7_days', label: '最近 7 天' },
  { key: 'last_30_days', label: '最近 30 天' },
  { key: 'last_90_days', label: '最近 90 天' },
];

const parseISODate = (value: string): Date => new Date(`${value}T00:00:00.000Z`);
const formatISODate = (value: Date): string => value.toISOString().slice(0, 10);

const addDays = (value: string, days: number): string => {
  const date = parseISODate(value);
  date.setUTCDate(date.getUTCDate() + days);
  return formatISODate(date);
};

const startOfWeek = (value: string): string => {
  const day = parseISODate(value).getUTCDay();
  return addDays(value, day === 0 ? -6 : 1 - day);
};

export const beijingToday = (now = new Date()): string => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
};

export const getPresetRange = (preset: DatePresetKey, today: string): DateRange => {
  switch (preset) {
    case 'this_week':
      return { start: startOfWeek(today), end: today };
    case 'this_biweek':
      return { start: addDays(startOfWeek(today), -7), end: today };
    case 'this_month':
      return { start: `${today.slice(0, 8)}01`, end: today };
    case 'last_7_days':
      return { start: addDays(today, -6), end: today };
    case 'last_30_days':
      return { start: addDays(today, -29), end: today };
    case 'last_90_days':
      return { start: addDays(today, -89), end: today };
  }
};

export const rangeDays = (range: DateRange): number =>
  Math.floor((parseISODate(range.end).getTime() - parseISODate(range.start).getTime()) / 86_400_000) + 1;

export const validateDateRange = (range: DateRange, today: string): string => {
  if (!range.start || !range.end) return '请选择开始日期和结束日期';
  if (range.start > range.end) return '开始日期不能晚于结束日期';
  if (range.end > today) return '结束日期不能晚于今天';
  if (rangeDays(range) > 366) return '日期范围不能超过 366 天';
  return '';
};

export function useOverviewDateRange() {
  const [today] = useState(beijingToday);
  const [range, setRange] = useState<DateRange>(() => getPresetRange('last_30_days', today));
  const [preset, setPreset] = useState<DatePresetKey | 'custom'>('last_30_days');

  const selectPreset = useCallback((key: DatePresetKey) => {
    setRange(getPresetRange(key, today));
    setPreset(key);
  }, [today]);

  const selectCustomRange = useCallback((next: DateRange) => {
    setRange(next);
    setPreset('custom');
  }, []);

  return {
    range,
    today,
    preset,
    selectPreset,
    selectCustomRange,
  };
}
