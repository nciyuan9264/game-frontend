import { describe, expect, it } from 'vitest';
import {
  formatDuration,
  formatResultDate,
  formatScore,
  resultImageFilename,
} from './format';

describe('result card formatting', () => {
  it('formats authoritative duration without dropping seconds', () => {
    expect(formatDuration(42)).toBe('42秒');
    expect(formatDuration(125)).toBe('2分5秒');
    expect(formatDuration(3725)).toBe('1小时2分');
  });

  it('formats dates in Beijing time and money scores by game', () => {
    expect(formatResultDate('2026-11-02T16:30:00Z')).toContain('2026.11.03');
    expect(formatScore('acquire', 123456)).toBe('¥123,456');
    expect(formatScore('splendor', 15)).toBe('15');
  });

  it('sanitizes the exported filename', () => {
    expect(resultImageFilename(
      'hive',
      'Alice / Bob',
      '2026-11-02T16:30:00Z',
    )).toBe('hive-Alice---Bob-20261103.png');
  });
});
