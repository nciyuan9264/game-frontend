import {
  CreateRoomReponse,
  CreateRoomRequest,
  DeleteRoomReponse,
  DeleteRoomRequest,
  GetRoomListReponse,
} from "@/types/room";
import APIClient from "./apiClient";

export const createAcquireRoom = async (params: CreateRoomRequest): Promise<CreateRoomReponse> => {
  return APIClient.post({
    url: "/acquire/room/create",
    data: params,
  });
};

export const deleteAcquireRoom = async (params: DeleteRoomRequest): Promise<DeleteRoomReponse> => {
  return APIClient.post({
    url: "/acquire/room/delete",
    data: params,
  });
};

export const getAcquireRoomList = async (): Promise<GetRoomListReponse> => {
  return APIClient.get({
    url: "/acquire/room/list",
  });
};

export const createSplendorRoom = async (params: CreateRoomRequest): Promise<CreateRoomReponse> => {
  return APIClient.post({
    url: "/splendor/room/create",
    data: params,
  });
};

export const getSplendorRoomList = async (): Promise<GetRoomListReponse> => {
  return APIClient.get({
    url: "/splendor/room/list",
  });
};

export const deleteSplendorRoom = async (params: DeleteRoomRequest): Promise<DeleteRoomReponse> => {
  return APIClient.post({
    url: "/splendor/splendor/room/delete",
    data: params,
  });
};

export const refreshToken = async (): Promise<void> => {
  return APIClient.post({
    url: "/auth/refresh",
  });
};