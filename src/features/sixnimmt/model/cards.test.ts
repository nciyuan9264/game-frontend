import { describe, expect, it } from 'vitest';
import { bullheads, rowPenalty, targetRow } from './cards';

describe('Six Nimmt card helpers', () => {
  it('scores the five official bullhead values', () => {
    expect([23, 25, 30, 44, 55].map(bullheads)).toEqual([1, 2, 3, 5, 7]);
    expect(rowPenalty([23, 25, 30, 44, 55])).toBe(18);
  });

  it('selects the greatest row tail below the card', () => {
    const rows = [[12, 23], [30, 44], [61, 64], [79, 90]];
    expect(targetRow(rows, 68)).toBe(2);
    expect(targetRow(rows, 7)).toBe(-1);
  });
});
