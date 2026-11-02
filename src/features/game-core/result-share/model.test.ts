import { describe, expect, it } from 'vitest';
import type { ResultCardData } from '@/api/generated/game-platform';
import type { GameType } from '@/hooks/useGameType';
import { toResultCardModel } from './model';
import { resultCardThemes } from './themes';

const gameTypes: GameType[] = [
  'acquire',
  'splendor',
  'davinci',
  'yinsh',
  'othello',
  'fugitive',
  'warchest',
  'quoridor',
  'loveletter',
  'sixnimmt',
  'cantstop',
  'hex',
  'forsale',
  'onitama',
  'hive',
];

function data(players: ResultCardData['players']): ResultCardData {
  return {
    game_type: 'hive',
    started_at: '2026-11-02T10:00:00Z',
    ended_at: '2026-11-02T10:10:00Z',
    duration_seconds: 600,
    players,
  };
}

describe('result card model', () => {
  it('defines a distinct complete theme for every supported game', () => {
    expect(Object.keys(resultCardThemes).sort()).toEqual([...gameTypes].sort());
    for (const theme of Object.values(resultCardThemes)) {
      expect(new Set([
        theme.primary,
        theme.secondary,
        theme.paper,
        theme.accent,
      ]).size).toBe(4);
    }
  });

  it('detects a completed draw from tied first-place players', () => {
    const model = toResultCardModel(data([{
      display_name: 'Alice',
      seat_index: 0,
      is_ai: false,
      final_stocks: 0,
      final_rank: 1,
      is_winner: false,
      is_self: true,
    }, {
      display_name: 'Bob',
      seat_index: 1,
      is_ai: false,
      final_stocks: 0,
      final_rank: 1,
      is_winner: false,
      is_self: false,
    }]), 'hive');

    expect(model.outcome).toBe('draw');
    expect(model.self.displayName).toBe('Alice');
  });

  it('preserves multiple winners and rejects missing self data', () => {
    const players = [{
      display_name: 'Alice',
      seat_index: 0,
      is_ai: false,
      final_stocks: 0,
      final_rank: 1,
      is_winner: true,
      is_self: true,
    }, {
      display_name: 'Bob',
      seat_index: 1,
      is_ai: false,
      final_stocks: 0,
      final_rank: 1,
      is_winner: true,
      is_self: false,
    }];
    expect(toResultCardModel(data(players), 'loveletter').winnerCount).toBe(2);
    expect(() => toResultCardModel(
      data(players.map(player => ({ ...player, is_self: false }))),
      'loveletter',
    )).toThrow('战绩中缺少当前玩家');
  });
});
