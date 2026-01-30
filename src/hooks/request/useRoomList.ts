import { useRequest } from 'ahooks';
import { useGameType } from '../useGameType';
import { getAcquireRoomList, getSplendorRoomList } from '@/api/room';
import { message } from 'antd';

export const useRoomList = ({ setOnlinePlayer }: { setOnlinePlayer: (onlinePlayer: number) => void }) => {
  const gameType = useGameType();

  const {
    data: roomList,
    run: handleGetRoomList,
    loading: roomListLoading,
  } = useRequest(
    async () => {
      const getRoomListFn = gameType === 'acquire' ? getAcquireRoomList : getSplendorRoomList;
      const res = await getRoomListFn();
      const sortList =
        res?.rooms?.sort((a: any, b: any) => {
          return a.roomID.localeCompare(b.roomID);
        }) ?? [];
      setOnlinePlayer(res?.onlinePlayer);
      return sortList;
    },
    {
      manual: true,
      onError: () => {
        message.error('获取房间列表失败，请重试');
      },
    }
  );
  return {
    roomList,
    handleGetRoomList,
    roomListLoading,
  };
};
