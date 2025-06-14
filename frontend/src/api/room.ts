import { Result } from "@/types/http";
import { CreateRoomReponse, CreateRoomRequest, DeleteRoomReponse, DeleteRoomRequest, GetRoomListReponse } from "@/types/room";
import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL;
export const createRoom = async (params: CreateRoomRequest): Promise<Result<CreateRoomReponse>> => {
  return (await axios.post(`http://${baseURL}/room/create`, params)).data;
};

export const deleteRoom = async (params: DeleteRoomRequest): Promise<Result<DeleteRoomReponse>> => {
  const res = await axios.post(`http://${baseURL}/room/delete`, params);
  return res.data;
};

export const getRoomList = async (): Promise<Result<GetRoomListReponse>> => {
  return (await axios.get(`http://${baseURL}/room/list`)).data;
};
