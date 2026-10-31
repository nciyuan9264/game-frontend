import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const communityEntries = [
  '../../../features/acquire/pages/Community/index.tsx',
  '../../../features/cantstop/pages/Community/index.tsx',
  '../../../features/davinci/pages/Community/index.tsx',
  '../../../features/forsale/pages/Community.tsx',
  '../../../features/fugitive/pages/Guide/index.tsx',
  '../../../features/fugitive/pages/Rankings/index.tsx',
  '../../../features/hex/pages/Community/index.tsx',
  '../../../features/hive/pages/Community/index.tsx',
  '../../../features/loveletter/pages/Community/index.tsx',
  '../../../features/onitama/pages/Community/index.tsx',
  '../../../features/othello/pages/Community/index.tsx',
  '../../../features/quoridor/pages/Community/index.tsx',
  '../../../features/sixnimmt/pages/Community/index.tsx',
  '../../../features/splendor/pages/Community/index.tsx',
  '../../../features/warchest/pages/Community/index.tsx',
  '../../../features/yinsh/pages/Community/index.tsx',
] as const;

describe('game tab usage contract', () => {
  it.each(communityEntries)('%s does not hand-roll semantic tabs', entry => {
    const source = readFileSync(new URL(entry, import.meta.url), 'utf8');

    expect(source).not.toContain('role="tab"');
    expect(source).not.toContain('role="tablist"');
  });
});
