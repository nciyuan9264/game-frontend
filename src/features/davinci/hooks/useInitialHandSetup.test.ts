import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Card, GameStatus } from '../model/types';
import { useInitialHandSetup } from './useInitialHandSetup';

const cards: Card[] = [
  { id: 'two', num: 2, color: 0, index: 0 },
  { id: 'four', num: 4, color: 1, index: 1 },
  { id: 'seven', num: 7, color: 0, index: 2 },
  { id: 'black-joker', num: -1, color: 1, index: -1 },
  { id: 'white-joker', num: -1, color: 0, index: -1 },
];

describe('useInitialHandSetup', () => {
  it('places two Jokers locally and resets only at a match boundary', () => {
    const { result, rerender } = renderHook((props: {
      matchID: string;
      status: GameStatus;
      cards: Card[];
      ready: boolean;
    }) => useInitialHandSetup(props), {
      initialProps: {
        matchID: 'match-1',
        status: 'initialize',
        cards,
        ready: false,
      },
    });

    expect(result.current.activeJoker?.id).toBe('black-joker');
    act(() => result.current.placeJoker(1, 'black-joker'));
    expect(result.current.activeJoker?.id).toBe('white-joker');
    act(() => result.current.placeJoker(4, 'white-joker'));
    expect(result.current.canConfirm).toBe(true);
    expect(result.current.jokerPlacements).toEqual([
      { id: 'black-joker', index: 1 },
      { id: 'white-joker', index: 4 },
    ]);

    rerender({
      matchID: 'match-1',
      status: 'initialize',
      cards: cards.map(card => ({ ...card })),
      ready: false,
    });
    expect(result.current.jokerPlacements).toEqual([
      { id: 'black-joker', index: 1 },
      { id: 'white-joker', index: 4 },
    ]);

    rerender({
      matchID: 'match-2',
      status: 'initialize',
      cards,
      ready: false,
    });
    expect(result.current.pendingJokers).toHaveLength(2);
    expect(result.current.canConfirm).toBe(false);
  });

  it('allows a player without Jokers to confirm the default order', () => {
    const { result } = renderHook(() => useInitialHandSetup({
      matchID: 'match-1',
      status: 'initialize',
      cards: cards.slice(0, 3),
      ready: false,
    }));

    expect(result.current.canConfirm).toBe(true);
    expect(result.current.jokerPlacements).toEqual([]);
  });
});
