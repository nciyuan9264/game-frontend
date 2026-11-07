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

const directResignEntries = [
  '../../../features/hex/pages/Play/index.tsx',
  '../../../features/hive/pages/Play/index.tsx',
  '../../../features/onitama/pages/Play/index.tsx',
  '../../../features/othello/pages/Play/index.tsx',
  '../../../features/quoridor/pages/Play/index.tsx',
  '../../../features/yinsh/pages/Play/index.tsx',
] as const;

describe('live game mobile topbar contract', () => {
  it.each(liveGameEntries)('%s uses the shared topbar', entry => {
    const source = readFileSync(new URL(entry, import.meta.url), 'utf8');

    expect(source).toContain('GameMobileTopbar');
    expect(source).toContain('<GameMobileTopbar');
  });

  it.each(liveGameEntries)('%s omits inactive countdown placeholders', entry => {
    const source = readFileSync(new URL(entry, import.meta.url), 'utf8');
    const statusPrefix = source.match(
      /<GameMobileTopbar[\s\S]*?status=\{[\s\S]*?actions=/,
    )?.[0];

    if (statusPrefix == null) {
      const topbarUsage = source.match(/<GameMobileTopbar[\s\S]*?\/>/)?.[0];
      expect(topbarUsage).toBeDefined();
      expect(topbarUsage).not.toContain('status=');
      return;
    }

    expect(statusPrefix).toContain('undefined');
    expect(statusPrefix).not.toContain("'--'");
    expect(statusPrefix).not.toContain("'已结束'");
  });

  it.each(directResignEntries)('%s exposes resign directly without a menu', entry => {
    const source = readFileSync(new URL(entry, import.meta.url), 'utf8');

    expect(source).not.toContain('MoreHorizontal');
    expect(source).not.toContain("setPanel('menu')");
    expect(source).not.toContain("panel === 'menu'");
    expect(source).toContain('aria-label="认输"');
    expect(source).toContain("setPanel('resign')");
    expect(source).toContain('确认认输');
  });
});
