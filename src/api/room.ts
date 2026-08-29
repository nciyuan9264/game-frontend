import {
  CreateRoomReponse,
  CreateRoomRequest,
  DeleteRoomRequest,
  DeleteRoomReponse,
  GetRoomListReponse,
} from '@/types/room';
import { authApiBaseURL } from '@/const/env';
import APIClient from './apiClient';
import type { GameType } from '@/hooks/useGameType';

interface AuthProfile {
  user_id: string;
  email?: string;
  name?: string;
  avatar?: string;
}

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
  const res = await fetch(`${authApiBaseURL}/refresh`, {
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
  const profile = await APIClient.get<AuthProfile>({
    url: `${authApiBaseURL}/profile`,
  });
  return {
    id: profile.user_id,
    email: profile.email ?? '',
    name: profile.name ?? '',
    avatar: profile.avatar ?? '',
  };
};

export const logout = async () => {
  return APIClient.post({
    url: `${authApiBaseURL}/logout`,
  });
};
