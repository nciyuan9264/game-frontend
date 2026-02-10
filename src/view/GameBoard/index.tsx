import { useEffect, useMemo } from 'react';
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
import { PlusCircleOutlined } from '@ant-design/icons';
import { Button } from '@/components/Button';

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
            <Header roomList={roomList} userProfile={userProfile} runLogout={runLogout} handleCreateRoom={handleCreateRoom} />
            {roomList?.length ? <div className={styles.roomGrid}>
              {roomList?.map(room => (
                <RoomCard
                  key={room.roomID}
                  data={room}
                  gameType={gameType}
                  userID={userID}
                />
              ))}
            </div> :
              <div className={styles.createRoomBtn}>
                <Button
                  style={{ width: '12rem', height: '4rem', fontSize: '1.6rem' }}
                  content="创建房间"
                  icon={<PlusCircleOutlined style={{ fontSize: '1.6rem' }} />}
                  onClick={() => {
                    handleCreateRoom();
                  }} />
              </div>}
            <div className={styles.footer}>
              <div className={styles.left}>
                当前在线人数: {onlinePlayer}
              </div>
              <div className={styles.right}>
                <Button
                  customType='primary'
                  content="全屏"
                  onClick={() => {
                    handleFullscreen();
                  }}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
