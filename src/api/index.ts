import { initialAuthServiceOptions } from './generated/auth';
import { initialGamePlatformServiceOptions } from './generated/game-platform';
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
}
