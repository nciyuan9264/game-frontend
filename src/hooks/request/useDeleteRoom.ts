import { useRequest } from 'ahooks';
import { useGameType } from '../useGameType';
import { deleteAcquireRoom, deleteSplendorRoom } from '@/api/room';
import { message } from 'antd';

export const useDeleteRoom = (handleGetRoomList: () => void) => {
  const gameType = useGameType();

  const { run: handleDeleteRoom } = useRequest(
    async (roomID: string) => {
      const deleteRoomFn = gameType === 'acquire' ? deleteAcquireRoom : deleteSplendorRoom;
      await deleteRoomFn({
        RoomID: roomID,
      });
    },
    {
      manual: true,
      onError: () => {
        message.error('删除失败，请重试');
      },
      onSuccess: () => {
        message.error('删除成功');
        handleGetRoomList();
      },
    }
  );
  return handleDeleteRoom;
};
