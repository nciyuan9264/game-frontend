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

export const refreshToken = async (): Promise<void> => {
  return APIClient.post({
    url: 'auth/refresh',
  });
};

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
