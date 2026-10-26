import { describe, expect, it } from 'vitest';
import {
  actionLabel,
  coordinate,
  targetRow,
  wallLabel,
  wallReasonCopy,
  wallStyle,
} from './board';

describe('quoridor board presentation helpers', () => {
  it('formats cells and wall anchors without accepting out-of-board values', () => {
    expect(coordinate({ row: 0, column: 0 })).toBe('A1');
    expect(coordinate({ row: 8, column: 8 })).toBe('I9');
    expect(coordinate({ row: 9, column: 4 })).toBe('—');
    expect(wallLabel({ row: 3, column: 4, orientation: 'v' }))
      .toBe('E4 · 纵向');
  });

  it('maps each side to the opposite goal row', () => {
    expect(targetRow('south')).toBe(0);
    expect(targetRow('north')).toBe(8);
  });

  it('positions horizontal and vertical walls across two cells', () => {
    expect(wallStyle({ row: 3, column: 4, orientation: 'h' })).toEqual({
      left: `${4 / 9 * 100}%`,
      top: `${4 / 9 * 100}%`,
      width: `${2 / 9 * 100}%`,
    });
    expect(wallStyle({ row: 3, column: 4, orientation: 'v' })).toEqual({
      left: `${5 / 9 * 100}%`,
      top: `${3 / 9 * 100}%`,
      height: `${2 / 9 * 100}%`,
    });
  });

  it('keeps server reason codes and action logs understandable', () => {
    expect(wallReasonCopy('blocks_path')).toContain('封死通路');
    expect(actionLabel({
      id: 1,
      kind: 'move',
      playerID: '7',
      side: 'south',
      from: { row: 4, column: 4 },
      to: { row: 2, column: 4 },
      automatic: false,
    })).toBe('越过对手 E5 → E3');
  });
});
