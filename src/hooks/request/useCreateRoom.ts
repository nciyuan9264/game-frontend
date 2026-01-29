import { useRequest } from 'ahooks';
import { useGameType } from '../useGameType';
import { createAcquireRoom, createSplendorRoom } from '@/api/room';
import { message } from 'antd';
import { UserProfile } from './useProfile';
import { profile2BackendName } from '@/util/user';

export const useCreateRoom = ({handleGetRoomList, setCreateRoomVisible}: {handleGetRoomList: () => void; setCreateRoomVisible: (visible: boolean) => void}) => {
  const gameType = useGameType();

  const { run: handleCreateRoom } = useRequest(
    async ({ playerCount, aiCount, userProfile }: { playerCount: number; aiCount: number; userProfile: UserProfile }) => {
      const createRoomFn = gameType === 'acquire' ? createAcquireRoom : createSplendorRoom;
      await createRoomFn({
        MaxPlayers: playerCount,
        AiCount: aiCount,
        UserID: profile2BackendName(userProfile),
      });
    },
    {
      manual: true,
      onError: () => {
        message.error('创建失败，请重试');
      },
      refreshDeps: [gameType],
      onSuccess: () => {
        handleGetRoomList();
        setCreateRoomVisible(false);
      },
    }
  );
  return handleCreateRoom;
};
