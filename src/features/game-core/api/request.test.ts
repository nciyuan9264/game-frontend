import { describe, expect, it } from 'vitest';
import { apiInstance } from '@/api/request';

describe('generated API request URL', () => {
  it('applies the PAM gateway prefix exactly once', () => {
    const url = apiInstance.getUri({
      url: '/pam-api/platform/rooms',
    });

    expect(url.match(/\/pam-api/g)).toHaveLength(1);
    expect(url).toMatch(/\/pam-api\/platform\/rooms$/);
  });
});
