import { baseURL } from "@/const/env";
import { Result } from "@/types/http";
import { CreateRoomRequest, CreateRoomReponse, GetRoomListReponse } from "@/types/room";
import axios from "axios";



export const createRoom = async (params: CreateRoomRequest): Promise<Result<CreateRoomReponse>> => {
  return (await axios.post(`http:${baseURL}:8000/api/room/create`, params)).data;
};

export const getRoomList = async (): Promise<Result<GetRoomListReponse>> => {
  return (await axios.get(`http:${baseURL}:8000/api/room/list`)).data;
};