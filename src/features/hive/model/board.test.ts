import { describe, expect, it } from 'vitest';
import {
  actionLabel,
  coordinate,
  findPiece,
  hexKey,
  neighbors,
  pieceKindFromID,
  stackMap,
  topPiece,
} from './board';
import type { Stack } from './types';

const stacks: Stack[] = [{
  position: { q: 0, r: 0 },
  pieces: [
    { pieceID: 'wQ1', side: 'white', kind: 'queen', number: 1 },
    { pieceID: 'bB1', side: 'black', kind: 'beetle', number: 1 },
  ],
}];

describe('hive board presentation helpers', () => {
  it('keeps axial coordinates and all six neighbors explicit', () => {
    expect(hexKey({ q: -2, r: 3 })).toBe('-2,3');
    expect(coordinate({ q: -2, r: 3 })).toBe('(-2, 3)');
    expect(neighbors({ q: 0, r: 0 })).toEqual([
      { q: 1, r: 0 },
      { q: 0, r: 1 },
      { q: -1, r: 1 },
      { q: -1, r: 0 },
      { q: 0, r: -1 },
      { q: 1, r: -1 },
    ]);
  });

  it('preserves stack order and exposes only the top piece', () => {
    const board = stackMap(stacks);
    expect(topPiece(board['0,0'])?.pieceID).toBe('bB1');
    expect(findPiece(stacks, 'wQ1')).toMatchObject({
      level: 0,
      piece: { kind: 'queen' },
    });
  });

  it('derives piece kinds and readable action labels from stable IDs', () => {
    expect(pieceKindFromID('wG2')).toBe('grasshopper');
    expect(pieceKindFromID('bS1')).toBe('spider');
    expect(actionLabel({
      id: 8,
      kind: 'move',
      playerID: '7',
      side: 'white',
      pieceID: 'wG1',
      from: { q: -2, r: 1 },
      to: { q: 1, r: 1 },
      path: [
        { q: -2, r: 1 },
        { q: -1, r: 1 },
        { q: 0, r: 1 },
        { q: 1, r: 1 },
      ],
      automatic: false,
    })).toBe('蚱蜢 · (-2, 1) → (1, 1)');
  });
});
