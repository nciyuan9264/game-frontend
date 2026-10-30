import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const sessionEntries = [
  '../../acquire/pages/Session/index.tsx',
  '../../cantstop/pages/Session/index.tsx',
  '../../davinci/pages/Session/index.tsx',
  '../../forsale/pages/Session.tsx',
  '../../fugitive/pages/Session/index.tsx',
  '../../hex/pages/Session/index.tsx',
  '../../hive/pages/Session/index.tsx',
  '../../loveletter/pages/Session/index.tsx',
  '../../onitama/pages/Session/index.tsx',
  '../../othello/pages/Session/index.tsx',
  '../../quoridor/pages/Session/index.tsx',
  '../../sixnimmt/pages/Session/index.tsx',
  '../../splendor/pages/Session/index.tsx',
  '../../warchest/pages/Session/index.tsx',
  '../../yinsh/pages/Session/index.tsx',
] as const;

describe('game Session takeover contract', () => {
  it.each(sessionEntries)('%s uses the shared terminal failure mapping', entry => {
    const source = readFileSync(new URL(entry, import.meta.url), 'utf8');

    expect(source).toContain('describeSessionConnectionFailure');
    expect(source).toContain(
      'describeSessionConnectionFailure(connection.fatalCode, connection.fatal)',
    );
    expect(source).toContain('connectionFailure.title');
    expect(source).toContain('connectionFailure.message');
    expect(source).not.toContain('identity_conflict');
  });
});
