import { useEffect, useState } from 'react';
import { message, Card, Button, Dropdown, Modal } from 'antd';
import styles from './index.module.less';
import RoomCard from '@/view/GameBoard/components/RoomCard';
import { useThrottleFn } from 'ahooks';
import { handleFullscreen } from '@/util/window';
import { useGameType } from '@/hooks/useGameType';
import { useCreateRoom } from '@/hooks/request/useCreateRoom';
import { useDeleteRoom } from '@/hooks/request/useDeleteRoom';
import { useRoomList } from '@/hooks/request/useRoomList';
import CreateRoomModal from './components/CreateRoomModal';
import { useProfile } from '@/hooks/request/useProfile';
import { useLogout } from '@/hooks/request/useLogout';


export default function GameMenu() {
  const { userProfile } = useProfile();
  const [createRoomVisible, setCreateRoomVisible] = useState(false);
  const [playerCount, setPlayerCount] = useState(2);
  const [onlinePlayer, setOnlinePlayer] = useState<number>(0)
  const [tabKey, setTabKey] = useState('user');
  const [aiCount, setAiCount] = useState(1);
  const gameType = useGameType();
  const { roomList, handleGetRoomList } = useRoomList({ setOnlinePlayer });
  const { runLogout } = useLogout();

  const handleCreateRoom = useCreateRoom({ handleGetRoomList, setCreateRoomVisible });
  const handleDeleteRoom = useDeleteRoom(handleGetRoomList);
  const { run: debouncedHandleOk } = useThrottleFn(() => {
    handleCreateRoom({
      playerCount,
      aiCount: tabKey === 'user' ? 0 : aiCount,
      userProfile,
    });
  }, { wait: 1000 });

  useEffect(() => {
    handleGetRoomList();
    const timer = setInterval(handleGetRoomList, 10000);
    if (!(window as any).deleteAcquireRoom) {
      (window as any).deleteAcquireRoom = handleDeleteRoom;
    }
    return () => {
      clearInterval(timer);
      delete (window as any).deleteAcquireRoom;
    };
  }, [gameType, handleGetRoomList, handleDeleteRoom]);

  return (
    <>
      <div className={styles.gameMenu} style={{ height: window.innerHeight }}>
        <Dropdown
          menu={{
            items: [
              {
                key: 'profile',
                label: (
                  <a href="https://auth.gamebus.online/profile" target="_blank" rel="noopener noreferrer">
                    Profile
                  </a>
                ),
              },
              {
                key: 'logout',
                label: (
                  <span onClick={() => {
                    Modal.confirm({
                      title: '确定要退出登录吗？',
                      cancelText: '取消',
                      onOk: runLogout,
                    });
                  }}>
                    退出登录
                  </span>
                ),
              },
            ],
          }}
          trigger={['hover']}
        >
          <div className={styles['user-info']}>
            {userProfile?.avatar ? (
              <img
                className={styles['user-avatar']}
                src={userProfile.avatar}
                alt="user avatar"
                style={{ opacity: 1, transition: 'opacity 0.3s ease-in-out' }}
              />
            ) : (
              <div className={styles['avatar-skeleton']} />
            )}
          </div>
        </Dropdown>
        <div className={styles.title}>{gameType === 'acquire' ? 'Acquire' : 'Splendor'}</div>
        <div className={styles.roomGrid}>
          {roomList?.map(room => (
            <RoomCard
              key={room.roomID}
              data={room}
              onDelete={(roomID: string) => {
                handleDeleteRoom(roomID);
              }}
              userProfile={userProfile}
              gameType={gameType}
            />
          ))}
          <Card
            hoverable
            className={styles.createRoomCard}
            onClick={() => {
              if ((roomList?.length ?? 0) > 20) {
                message.error('房间数量已达上限');
                return;
              }
              setCreateRoomVisible(true)
            }}
          >
            <div className={styles.createRoomInner}>
              <div style={{ marginTop: 8 }}>创建房间</div>
            </div>
          </Card>
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
      <CreateRoomModal
        createRoomVisible={createRoomVisible}
        setCreateRoomVisible={setCreateRoomVisible}
        playerCount={playerCount}
        setPlayerCount={setPlayerCount}
        tabKey={tabKey}
        setTabKey={setTabKey}
        debouncedHandleOk={debouncedHandleOk}
        aiCount={aiCount}
        setAiCount={setAiCount}
      />
    </>
  );
}
