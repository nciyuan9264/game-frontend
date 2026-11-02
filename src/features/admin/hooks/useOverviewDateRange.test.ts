import { describe, expect, it } from 'vitest';
import {
  beijingToday,
  getPresetRange,
  rangeDays,
  validateDateRange,
} from './useOverviewDateRange';

describe('overview date ranges', () => {
  it('derives the Beijing calendar date without using the browser timezone', () => {
    expect(beijingToday(new Date('2026-11-01T16:30:00Z'))).toBe('2026-11-02');
  });

  it('builds aligned and rolling shortcut ranges', () => {
    const today = '2026-11-02';
    expect(getPresetRange('this_week', today)).toEqual({ start: '2026-11-02', end: today });
    expect(getPresetRange('this_biweek', today)).toEqual({ start: '2026-10-26', end: today });
    expect(getPresetRange('this_month', today)).toEqual({ start: '2026-11-01', end: today });
    expect(getPresetRange('last_7_days', today)).toEqual({ start: '2026-10-27', end: today });
    expect(getPresetRange('last_30_days', today)).toEqual({ start: '2026-10-04', end: today });
  });

  it('validates custom ranges and inclusive day counts', () => {
    expect(rangeDays({ start: '2026-10-27', end: '2026-11-02' })).toBe(7);
    expect(validateDateRange({ start: '2026-11-03', end: '2026-11-02' }, '2026-11-02'))
      .toBe('开始日期不能晚于结束日期');
    expect(validateDateRange({ start: '2026-11-01', end: '2026-11-03' }, '2026-11-02'))
      .toBe('结束日期不能晚于今天');
    expect(validateDateRange({ start: '2025-11-01', end: '2026-11-02' }, '2026-11-02'))
      .toBe('日期范围不能超过 366 天');
  });
});
