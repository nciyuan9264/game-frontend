import { useRequest } from 'ahooks';
import { useGameType } from '../useGameType';
import { deleteRoom } from '@/api/room';
import { message } from 'antd';

export const useDeleteRoom = (handleGetRoomList: () => void) => {
  const gameType = useGameType();

  const { run: handleDeleteRoom } = useRequest(
    async (roomID: string) => {
      await deleteRoom(gameType, { RoomID: roomID });
    },
    {
      manual: true,
      onError: () => {
        message.error('删除失败，请重试');
      },
      onSuccess: () => {
        message.success('删除成功');
        handleGetRoomList();
      },
    }
  );
  return handleDeleteRoom;
};
