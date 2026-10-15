import { baseURL } from '@/const/env';
import { refreshToken } from '@/api/room';
import { Status } from '@/enum/http';
import type { AcquireRoom, Visibility } from '../model/types';

export class AcquireRequestError extends Error {
  constructor(message: string, public status: number, public code?: string) { super(message); }
}
async function request<T>(path: string, options: RequestInit = {}, refreshed = false): Promise<T> {
  const response = await fetch(`${baseURL.replace(/\/$/, '')}/api/acquire/room/${path}`, {
    ...options, credentials: 'include', headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  if (response.status === 401 && !refreshed) {
    try {
      await refreshToken();
    } catch {
      throw new AcquireRequestError('登录状态已失效，请重新登录后再进入大厅。', 401, 'unauthorized');
    }
    return request<T>(path, options, true);
  }
  const result = await response.json().catch(() => {
    throw new AcquireRequestError(
      response.status === 401 ? '登录状态已失效，请重新登录后再进入大厅。'
        : response.status === 403 ? '请求被拒绝，请稍后重试或联系管理员' : '服务暂时不可用，请稍后重试',
      response.status,
      response.status === 401 ? 'unauthorized' : undefined,
    );
  });
  if (!response.ok || result.status_code !== Status.Succeed) {
    throw new AcquireRequestError(
      response.status === 401 ? '登录状态已失效，请重新登录后再进入大厅。' : result.message || '请求失败，请重试',
      response.status,
      response.status === 401 ? 'unauthorized' : result.code,
    );
  }
  return result.data as T;
}
export const listRooms = (signal: AbortSignal) => request<{ rooms: AcquireRoom[]; onlinePlayer: number }>('list', { signal });
export const createAcquireRoom = (visibility: Visibility) => request<{ roomID: string }>('create', {
  method: 'POST', body: JSON.stringify({ visibility }),
});
export const lookupRoom = (roomID: string, signal?: AbortSignal) => request<AcquireRoom>(`lookup?roomID=${encodeURIComponent(roomID)}`, { signal });
