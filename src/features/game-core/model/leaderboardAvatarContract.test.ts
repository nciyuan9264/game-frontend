import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const rankingPages = [
  'src/features/acquire/pages/Community/index.tsx',
  'src/features/cantstop/pages/Community/index.tsx',
  'src/features/davinci/pages/Community/index.tsx',
  'src/features/forsale/pages/Community.tsx',
  'src/features/fugitive/pages/Rankings/index.tsx',
  'src/features/hex/pages/Community/index.tsx',
  'src/features/hive/pages/Community/index.tsx',
  'src/features/loveletter/pages/Community/index.tsx',
  'src/features/onitama/pages/Community/index.tsx',
  'src/features/othello/pages/Community/index.tsx',
  'src/features/quoridor/pages/Community/index.tsx',
  'src/features/sixnimmt/pages/Community/index.tsx',
  'src/features/splendor/pages/Community/index.tsx',
  'src/features/warchest/pages/Community/index.tsx',
  'src/features/yinsh/pages/Community/index.tsx',
] as const;

describe('leaderboard avatar contract', () => {
  it.each(rankingPages)('%s renders resolved user avatars', file => {
    const source = readFileSync(resolve(process.cwd(), file), 'utf8');

    expect(source).toContain('avatar: entry.avatar');
    expect(source).toContain('avatar={entry.avatar}');
  });
});
