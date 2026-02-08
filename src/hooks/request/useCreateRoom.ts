import { useRequest } from 'ahooks';
import { useGameType } from '../useGameType';
import { createAcquireRoom } from '@/api/room';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';

export const useCreateRoom = () => {
  const gameType = useGameType();
  const navigate = useNavigate();

  const { run: handleCreateRoom, loading: createRoomLoading } = useRequest(
    async () => {
      const createRoomFn = createAcquireRoom;
      return await createRoomFn();
    },
    {
      manual: true,
      onError: () => {
        message.error('创建失败，请重试');
      },
      refreshDeps: [gameType],
      onSuccess: (data) => {
        navigate(`/game/acquire/match?roomID=${data.roomID}`)
        message.success('创建成功');
      },
    }
  );
  return {handleCreateRoom, createRoomLoading};
};
