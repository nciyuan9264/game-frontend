import { useRequest } from 'ahooks';
import { useRef } from 'react';
import { useGameType } from '../useGameType';
import { getAcquireRoomList, getSplendorRoomList } from '@/api/room';
import { message } from 'antd';

export const useRoomList = () => {
  const gameType = useGameType();
  const hasLoadedRef = useRef(false); // ⭐ 关键

  const {
    data: roomList,
    run: handleGetRoomList,
    loading: roomListLoading,
  } = useRequest(
    async () => {
      const getRoomListFn =
        gameType === 'acquire'
          ? getAcquireRoomList
          : getSplendorRoomList;

      const res = await getRoomListFn();

      const sortList =
        res?.rooms?.sort((a: any, b: any) =>
          a.roomID.localeCompare(b.roomID)
        ) ?? [];
      return sortList;
    },
    {
      manual: true,
      onSuccess: () => {
        hasLoadedRef.current = true; // ⭐ 成功一次就够
      },
      onError: () => {
        message.error('获取房间列表失败，请重试');
      },
    }
  );

  return {
    roomList,
    handleGetRoomList,
    roomListLoading,
    hasLoaded: hasLoadedRef.current, // ⭐ 暴露给组件
  };
};
