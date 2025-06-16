import { useEffect, useState } from 'react';
import { Modal, Radio, message, Card, Button } from 'antd';
import styles from './index.module.less';
import { createRoom, deleteRoom, getRoomList } from '@/api/room';
import RoomCard from '@/view/Game/components/RoomCard';
import { useThrottleFn, useRequest } from 'ahooks';
import FullscreenButton from '@/component/FullScreen';
import EditUserID from './components/EditUserID';
import { getLocalStorageUserID, getLocalStorageUserName, validateUserName } from '@/util/user';

export default function GameMenu() {
  const [userID, setUserID] = useState('');
  const [isUserIDModalVisible, setIsUserIDModalVisible] = useState(false);
  const [createRoomCisible, setCreateRoomCisible] = useState(false);
  const [playerCount, setPlayerCount] = useState(2);
  const showModal = () => setCreateRoomCisible(true);

  useEffect(() => {
    const storageUserID = getLocalStorageUserID()
    if (storageUserID && validateUserName(storageUserID)) {
      setUserID(storageUserID);
    } else {
      setIsUserIDModalVisible(true);
    }
  }, []);

  const { run: handleCreateRoom } = useRequest(
    async (MaxPlayers: number) => {
      await createRoom({
        MaxPlayers: MaxPlayers,
        UserID: userID,
      }
      );
    },
    {
      manual: true,
      onError: () => {
        message.error('创建失败，请重试');
      },
      onSuccess: () => {
        handleGetRoomList();
        setCreateRoomCisible(false);
      }
    },
  );

  const { run: handleDeleteRoom } = useRequest(
    async (roomID: string) => {
      await deleteRoom({
        RoomID: roomID,
      }
      );
    },
    {
      manual: true,
      onError: () => {
        message.error('删除失败，请重试');
      },
      onSuccess: () => {
        handleGetRoomList();
      }
    },
  );

  const { data: roomList, run: handleGetRoomList } = useRequest(
    async () => {
      const res = await getRoomList();
      const sortList = res.data.rooms.sort((a: any, b: any) => {
        return a.roomID - b.roomID;
      });
      return sortList;
    },
    {
      manual: false,
      onError: () => {
        message.error('获取房间列表失败，请重试');
      },
    },
  );
  const { run: debouncedHandleOk } = useThrottleFn(() => {
    if ((roomList?.length ?? 0) > 25) {
      message.error('房间数量已达上限');
      return;
    }
    handleCreateRoom(playerCount);
  }, { wait: 1000 });
  useEffect(() => {
    const timer = setInterval(handleGetRoomList, 10000);
    if (!(window as any).deleteRoom) {
      (window as any).deleteRoom = handleDeleteRoom;
    }
    return () => {
      clearInterval(timer);
      delete (window as any).deleteRoom;
    };
  }, []);

  return (
    <div className={styles.gameMenu}>
      <div className={styles.titleWrapper}>
        <div className={styles.titleCenter}>
          <h1>Acquire（并购）</h1>
        </div>
        <div className={styles.titleRight}>
          <span className={styles.userId}>ID: {getLocalStorageUserName(userID)}</span>
          <Button
            type="primary"
            onClick={() => setIsUserIDModalVisible(true)}
            size="small"
          >
            修改用户名
          </Button>
        </div>
      </div>

      <div className={styles.roomGrid}>
        {roomList?.map(room => (
          <RoomCard
            key={room.roomID}
            data={room}
            onDelete={(roomID: string) => {
              handleDeleteRoom(roomID);
            }}
            userID={userID}
          />
        ))}
        <Card
          hoverable
          className={styles.createRoomCard}
          onClick={showModal}
        >
          <div className={styles.createRoomInner}>
            <div style={{ marginTop: 8 }}>创建房间</div>
          </div>
        </Card>
      </div>
      <FullscreenButton />
      <button onClick={() => {
        handleGetRoomList();
      }}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '100px',
          padding: '10px 14px',
          fontSize: '14px',
          borderRadius: '8px',
          backgroundColor: '#1890ff',
          color: '#fff',
          border: 'none',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          zIndex: 9999
        }}>
        刷新
      </button>
      <Modal
        title="选择房间人数"
        open={createRoomCisible}
        onOk={debouncedHandleOk}
        onCancel={() => {
          setPlayerCount(2);
          setCreateRoomCisible(false)
        }}
        okText="创建"
        cancelText="取消"
        centered
        className={styles.modal}
        styles={{ body: { textAlign: 'center', height: '100px', paddingTop: '30px' } }}
      >
        <Radio.Group onChange={(e) => setPlayerCount(e.target.value)} value={playerCount} size="large">
          {[2, 3, 4, 5, 6].map((num) => (
            <Radio.Button key={num} value={num} className={styles.radio}>
              {num} 人
            </Radio.Button>
          ))}
        </Radio.Group>
      </Modal>
      <EditUserID
        visible={isUserIDModalVisible}
        setVisible={setIsUserIDModalVisible}
        setUserID={setUserID}
      />
    </div>
  );
}
