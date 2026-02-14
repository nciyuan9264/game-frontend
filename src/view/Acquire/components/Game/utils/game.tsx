import { GameStatus } from '@/enum/game';
import { WsRoomSyncData } from '@/types/room';
import { isEqual } from 'lodash-es';

export const canCreateCompany = (data: WsRoomSyncData, userID: string) => {
  return data?.roomData.roomInfo.gameStatus === GameStatus.CREATE_COMPANY && userID === data.roomData.currentPlayer;
};

export const getMergingModalAvailible = (data: WsRoomSyncData, userID: string) => {
  const firstHoders = Object.entries(data?.tempData.mergeSettleData || {}).find(([_, val]) => {
    return val.hoders.length > 0;
  });
  const needSettle = firstHoders?.[1].hoders[0] === userID;
  return data?.roomData.roomInfo.gameStatus === GameStatus.MergingSettle && needSettle;
};

export const getMergeSelection = (data: WsRoomSyncData, userID: string) => {
  return data?.roomData.roomInfo.gameStatus === GameStatus.MergingSelection && data?.roomData.currentPlayer === userID;
};

export const canBuyStock = (data: WsRoomSyncData, userID: string) => {
  return data?.roomData.roomInfo.gameStatus === GameStatus.BUY_STOCK && data?.roomData.currentPlayer === userID;
};

export const isDataEqual = (data1: WsRoomSyncData | undefined, data2: WsRoomSyncData) => {
  if (!data1) return false;
  return isEqual(data1, data2);
};

export const getPrevData = (roomID: string) => {
  const prevData = localStorage.getItem(`room_${roomID}_prevData`);
  return prevData ? JSON.parse(prevData) : null;
};
