import { useRequest } from 'ahooks';
import { useGameType } from '../useGameType';
import { createRoom } from '@/api/room';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';

export const useCreateRoom = () => {
  const gameType = useGameType();
  const navigate = useNavigate();

  const { run: handleCreateRoom, loading: createRoomLoading } = useRequest(
    async () => {
      return await createRoom(gameType);
    },
    {
      manual: true,
      onError: () => {
        message.error('创建失败，请重试');
      },
      refreshDeps: [gameType],
      onSuccess: (data) => {
        navigate(`/game/${gameType}/match?roomID=${data.roomID}`)
        message.success('创建成功');
      },
    }
  );
  return {handleCreateRoom, createRoomLoading};
};
