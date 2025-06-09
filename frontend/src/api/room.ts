import { Result } from "@/types/http";
import { CreateRoomRequest, CreateRoomReponse, GetRoomListReponse } from "@/types/room";
import axios from "axios";



export const createRoom = async (params: CreateRoomRequest): Promise<Result<CreateRoomReponse>> => {
  return (await axios.post('/api/room/create', params)).data;
};

export const getRoomList = async (): Promise<Result<GetRoomListReponse>> => {
  return (await axios.get('/api/room/list')).data;
};