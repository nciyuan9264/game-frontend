import { Result } from "@/types/http";
import { CreateRoomReponse, CreateRoomRequest, GetRoomListReponse } from "@/types/room";
import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL;
export const createRoom = async (params: CreateRoomRequest): Promise<Result<CreateRoomReponse>> => {
  return (await axios.post(`${baseURL}/api/room/create`, params)).data;
};

export const getRoomList = async (): Promise<Result<GetRoomListReponse>> => {
  return (await axios.get(`${baseURL}/api/room/list`)).data;
};
