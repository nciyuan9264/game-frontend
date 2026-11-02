import { initialAuthServiceOptions } from './generated/auth';
import { initialGamePlatformServiceOptions } from './generated/game-platform';
import { initialGameAdminServiceOptions } from './generated/game-admin';
import { generatedRequest } from './request';

export function initApi(): void {
  initialAuthServiceOptions({
    baseURL: '/pam-api',
    request: generatedRequest,
  });
  initialGamePlatformServiceOptions({
    baseURL: '/pam-api',
    request: generatedRequest,
  });
  initialGameAdminServiceOptions({
    baseURL: '/pam-api',
    request: generatedRequest,
  });
}
