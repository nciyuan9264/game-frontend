import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const liveGameEntries = [
  '../../../features/acquire/pages/Play/index.tsx',
  '../../../features/cantstop/pages/Play/index.tsx',
  '../../../features/davinci/pages/Play/index.tsx',
  '../../../features/forsale/pages/Play.tsx',
  '../../../features/fugitive/pages/Play/index.tsx',
  '../../../features/hex/pages/Play/index.tsx',
  '../../../features/hive/pages/Play/index.tsx',
  '../../../features/loveletter/pages/Play/index.tsx',
  '../../../features/onitama/pages/Play/index.tsx',
  '../../../features/othello/pages/Play/index.tsx',
  '../../../features/quoridor/pages/Play/index.tsx',
  '../../../features/sixnimmt/pages/Play/index.tsx',
  '../../../features/splendor/pages/Play/index.tsx',
  '../../../features/warchest/pages/Battle/index.tsx',
  '../../../features/yinsh/pages/Play/index.tsx',
] as const;

describe('live game mobile topbar contract', () => {
  it.each(liveGameEntries)('%s uses the shared topbar', entry => {
    const source = readFileSync(new URL(entry, import.meta.url), 'utf8');

    expect(source).toContain('GameMobileTopbar');
    expect(source).toContain('<GameMobileTopbar');
  });
});
