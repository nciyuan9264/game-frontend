import { describe, expect, it } from 'vitest';
import type { LeaderboardEntry as GeneratedLeaderboardEntry } from '@/api/generated/game-platform';
import { toLeaderboardEntry } from './history';

describe('toLeaderboardEntry', () => {
  it('preserves resolved user avatars for leaderboard views', () => {
    const entry: GeneratedLeaderboardEntry = {
      userID: '7',
      playerID: '7',
      displayName: 'Alice',
      avatar: 'https://cdn.example.com/alice.png',
      totalGames: 6,
      metric: {
        davinci: {
          wins: 5,
          winRate: 5 / 6,
        },
      },
    };

    expect(toLeaderboardEntry(entry)).toMatchObject({
      userID: '7',
      displayName: 'Alice',
      avatar: 'https://cdn.example.com/alice.png',
    });
  });
});
