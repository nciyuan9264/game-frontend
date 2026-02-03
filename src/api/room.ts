import { CreateRoomReponse, CreateRoomRequest, DeleteRoomReponse, DeleteRoomRequest, GetRoomListReponse } from '@/types/room';
import APIClient from './apiClient';

export const createAcquireRoom = async (params: CreateRoomRequest): Promise<CreateRoomReponse> => {
  return APIClient.post({
    url: 'api/acquire/room/create',
    data: params,
  });
};

export const deleteAcquireRoom = async (params: DeleteRoomRequest): Promise<DeleteRoomReponse> => {
  return APIClient.post({
    url: 'api/acquire/room/delete',
    data: params,
  });
};

export const getAcquireRoomList = async (): Promise<GetRoomListReponse> => {
  return APIClient.get({
    url: 'api/acquire/room/list',
  });
};

export const createSplendorRoom = async (params: CreateRoomRequest): Promise<CreateRoomReponse> => {
  return APIClient.post({
    url: 'api/splendor/room/create',
    data: params,
  });
};

export const getSplendorRoomList = async (): Promise<GetRoomListReponse> => {
  return APIClient.get({
    url: 'api/splendor/room/list',
  });
};

export const deleteSplendorRoom = async (params: DeleteRoomRequest): Promise<DeleteRoomReponse> => {
  return APIClient.post({
    url: 'api/splendor/room/delete',
    data: params,
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
