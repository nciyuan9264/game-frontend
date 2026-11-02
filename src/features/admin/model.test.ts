import { describe, expect, it } from 'vitest';
import { chartPoints, formatDuration, formatPercent, toNumber } from './model';

describe('admin analytics presentation', () => {
  it('normalizes generated int64 strings', () => {
    expect(toNumber('42')).toBe(42);
    expect(toNumber('invalid')).toBe(0);
  });

  it('formats duration and rates for operators', () => {
    expect(formatDuration('5400')).toBe('1 小时 30 分');
    expect(formatPercent(0.375)).toBe('37.5%');
  });

  it('builds stable chart coordinates', () => {
    expect(chartPoints([0, 5, 10], 100, 50)).toBe('0.00,50.00 50.00,25.00 100.00,0.00');
    expect(chartPoints([], 100, 50)).toBe('');
  });
});
