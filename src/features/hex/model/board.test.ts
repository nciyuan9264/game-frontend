import { describe, expect, it } from 'vitest';
import {
  actionLabel,
  cellAt,
  cellIndex,
  coordinate,
  direction,
  otherSide,
  sideName,
} from './board';

describe('Hex board presentation helpers', () => {
  it('formats all valid 11 by 11 coordinates and rejects invalid cells', () => {
    expect(coordinate({ row: 0, column: 0 })).toBe('A1');
    expect(coordinate({ row: 10, column: 10 })).toBe('K11');
    expect(coordinate({ row: 11, column: 0 })).toBe('—');
    expect(coordinate({ row: 0, column: -1 })).toBe('—');
  });

  it('round-trips board indexes', () => {
    expect(cellIndex({ row: 7, column: 4 })).toBe(81);
    expect(cellAt(81)).toEqual({ row: 7, column: 4 });
  });

  it('keeps side names, goals, and opposites consistent', () => {
    expect(sideName('red')).toBe('陶红');
    expect(direction('red')).toBe('连接南北两岸');
    expect(sideName('teal')).toBe('湖绿');
    expect(direction('teal')).toBe('连接东西两岸');
    expect(otherSide('red')).toBe('teal');
    expect(otherSide('teal')).toBe('red');
  });

  it('describes place, swap, and resign actions', () => {
    expect(actionLabel({
      id: 1,
      kind: 'place',
      playerID: '7',
      side: 'red',
      cell: { row: 5, column: 5 },
      automatic: false,
    })).toBe('落子 F6');
    expect(actionLabel({
      id: 2,
      kind: 'swap',
      playerID: '8',
      side: 'teal',
      automatic: false,
    })).toBe('交换双方颜色');
    expect(actionLabel({
      id: 3,
      kind: 'resign',
      playerID: '7',
      side: 'red',
      automatic: false,
    })).toBe('主动认输');
  });
});
