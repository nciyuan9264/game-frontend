import {
  CreateRoomReponse,
  CreateRoomRequest,
  DeleteRoomRequest,
  DeleteRoomReponse,
  GetRoomListReponse,
} from '@/types/AcquireRoom';
import APIClient from './apiClient';
import type { GameType } from '@/hooks/useGameType';

export const createRoom = async (
  gameType: GameType,
  params?: CreateRoomRequest
): Promise<CreateRoomReponse> => {
  return APIClient.post({
    url: `/api/${gameType}/room/create`,
    data: params,
  });
};

export const deleteRoom = async (
  gameType: GameType,
  params: DeleteRoomRequest
): Promise<DeleteRoomReponse> => {
  return APIClient.post({
    url: `/api/${gameType}/room/delete`,
    data: params,
  });
};

export const getRoomList = async (
  gameType: GameType
): Promise<GetRoomListReponse> => {
  return APIClient.get({
    url: `/api/${gameType}/room/list`,
  });
};

export async function refreshToken() {
  // 使用 fetch 而不是 axios 实例
  const res = await fetch(`https://api.gamebus.online/auth/refresh`, {
    method: 'POST',
    credentials: 'include', // 保持 cookies
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    throw new Error('刷新 token 失败');
  }

  const data = await res.json();
  return data; // 返回新的 token 或者成功标识
}
export const getProfile = async () => {
  return APIClient.post({
    url: 'auth/verify-token',
  });
};

export const logout = async () => {
  return APIClient.post({
    url: 'auth/logout',
  });
};
