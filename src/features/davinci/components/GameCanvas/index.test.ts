import { describe, expect, it } from 'vitest';
import { computeInsertIndex } from './layout';
import type { Card } from '../../model/types';

const card = (id: string, num: number, color: number, index: number): Card => ({
  id, num, color, index, isRevealed: false,
});

describe('DaVinci card insertion', () => {
  it('sorts numbers and places black before white for equal values', () => {
    const cards = [
      card('one', 1, 0, 0),
      card('white-three', 3, 0, 1),
      card('six', 6, 1, 2),
    ];
    expect(computeInsertIndex(cards, card('black-three', 3, 1, -1))).toBe(1);
    expect(computeInsertIndex(cards, card('four', 4, 0, -1))).toBe(2);
    expect(computeInsertIndex(cards, card('nine', 9, 1, -1))).toBe(3);
  });
});
