import { describe, expect, it } from 'vitest';
import { computeInsertIndex, insertPendingCard } from './layout';
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

  it('keeps intermediate two-Joker placement compact', () => {
    const cards = [
      card('two', 2, 0, 0),
      card('four', 4, 1, 1),
      card('seven', 7, 0, 2),
      card('black-joker', -1, 1, -1),
      card('white-joker', -1, 0, -1),
    ];
    const first = insertPendingCard(cards, 'black-joker', 1);
    expect(first.find(value => value.id === 'black-joker')?.index).toBe(1);
    expect(first.find(value => value.id === 'white-joker')?.index).toBe(-1);

    const second = insertPendingCard(first, 'white-joker', 4);
    expect(Object.fromEntries(second.map(value => [value.id, value.index]))).toEqual({
      two: 0,
      'black-joker': 1,
      four: 2,
      seven: 3,
      'white-joker': 4,
    });
  });
});
