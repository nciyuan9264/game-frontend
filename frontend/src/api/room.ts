import {
  CreateRoomReponse,
  CreateRoomRequest,
  DeleteRoomReponse,
  DeleteRoomRequest,
  GetRoomListReponse,
} from "@/types/room";
import APIClient from "./apiClient"; // 这里路径按你的项目结构修改

export const createRoom = async (params: CreateRoomRequest): Promise<CreateRoomReponse> => {
  return APIClient.post({
    url: "/room/create",
    data: params,
  });
};

export const deleteRoom = async (params: DeleteRoomRequest): Promise<DeleteRoomReponse> => {
  return APIClient.post({
    url: "/room/delete",
    data: params,
  });
};

export const getRoomList = async (): Promise<GetRoomListReponse> => {
  return APIClient.get({
    url: "/room/list",
  });
};
