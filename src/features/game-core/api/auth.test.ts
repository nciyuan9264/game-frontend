import { describe, expect, it } from 'vitest';
import { hasAdminRole } from './auth';

describe('hasAdminRole', () => {
  it.each(['admin', 'Admin', 'ADMIN'])(
    'accepts the %s role without case sensitivity',
    role => {
      expect(hasAdminRole({ roles: ['player', role] })).toBe(true);
    },
  );

  it('rejects profiles without an admin role', () => {
    expect(hasAdminRole({ roles: ['player'] })).toBe(false);
    expect(hasAdminRole()).toBe(false);
  });
});
