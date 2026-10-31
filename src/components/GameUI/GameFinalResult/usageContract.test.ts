import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const finalResultEntries = [
  '../../../features/acquire/pages/Results/index.tsx',
  '../../../features/cantstop/pages/Results/index.tsx',
  '../../../features/davinci/pages/Results/index.tsx',
  '../../../features/forsale/pages/Results.tsx',
  '../../../features/fugitive/pages/Results/index.tsx',
  '../../../features/hex/pages/Results/index.tsx',
  '../../../features/hive/pages/Results/index.tsx',
  '../../../features/loveletter/pages/Results/index.tsx',
  '../../../features/onitama/pages/Results/index.tsx',
  '../../../features/othello/pages/Results/index.tsx',
  '../../../features/quoridor/pages/Results/index.tsx',
  '../../../features/sixnimmt/pages/Results/index.tsx',
  '../../../features/splendor/pages/Results/index.tsx',
  '../../../features/warchest/pages/Results/index.tsx',
  '../../../features/yinsh/pages/Results/index.tsx',
] as const;

describe('final result usage contract', () => {
  it.each(finalResultEntries)('%s uses the shared final result layout', entry => {
    const source = readFileSync(new URL(entry, import.meta.url), 'utf8');

    expect(source).toContain('GameFinalResult');
    expect(source).toContain('<GameFinalResult');
    expect(source).toContain('GameFinalResultActions');
  });
});
