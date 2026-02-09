import { useEffect, useMemo } from 'react';
import { Button } from 'antd';
import RoomCard from '@/view/GameBoard/components/RoomCard';
import { handleFullscreen } from '@/util/window';
import { useGameType } from '@/hooks/useGameType';
import { useCreateRoom } from '@/hooks/request/useCreateRoom';
import { useRoomList } from '@/hooks/request/useRoomList';
import { useProfile } from '@/hooks/request/useProfile';
import { useLogout } from '@/hooks/request/useLogout';
import { LoadingBlock } from '@/components/LoadingBlock';
import { Header } from '@/view/GameBoard/components/Header';
import { profile2BackendName } from '@/util/user';

import styles from './index.module.less';

export default function GameMenu() {
  const { userProfile, profileLoading } = useProfile();
  const userID = profile2BackendName(userProfile);
  const gameType = useGameType();
  const { roomList, handleGetRoomList, roomListLoading, hasLoaded } = useRoomList();
  const onlinePlayer = useMemo(() => roomList?.reduce((acc, cur) => acc + cur.roomPlayer.filter(player => player.online && !player.ai).length, 0) || 0, [roomList]);
  const showInitialLoading = (!hasLoaded && roomListLoading) || profileLoading;
  const { runLogout } = useLogout();

  const { handleCreateRoom } = useCreateRoom();

  useEffect(() => {
    handleGetRoomList();
    const timer = setInterval(handleGetRoomList, 3000);
    return () => {
      clearInterval(timer);
    };
  }, [gameType, handleGetRoomList]);

  return (
    <div style={{ minHeight: '100vh' }}>
      {showInitialLoading ? (
        <LoadingBlock content="正在加载游戏房间列表，请稍候..." />
      ) : (
        <>
          <div className={styles.gameMenu}>
            <Header userProfile={userProfile} runLogout={runLogout} handleCreateRoom={handleCreateRoom} />
            <div className={styles.roomGrid}>
              {roomList?.map(room => (
                <RoomCard
                  key={room.roomID}
                  data={room}
                  gameType={gameType}
                  userID={userID}
                />
              ))}
            </div>
            <div className={styles.footer}>
              <div className={styles.left}>
                <span className={styles.userId}>当前在线人数: {onlinePlayer}</span>
              </div>
              <div className={styles.right}>
                <Button
                  className={styles.button}
                  onClick={() => {
                    handleFullscreen();
                  }}
                >
                  全屏
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
