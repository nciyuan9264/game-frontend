import { useEffect, useState } from 'react';
import { Modal, Radio, message, Card, Button, Tabs } from 'antd';
import styles from './index.module.less';
import { createRoom, deleteRoom, getRoomList } from '@/api/room';
import RoomCard from '@/view/Acquire/GameBoard/components/RoomCard';
import { useThrottleFn, useRequest } from 'ahooks';
import EditUserID from './components/EditUserID';
import { getLocalStorageUserID, getLocalStorageUserName, validateUserName } from '@/util/user';
import { handleFullscreen } from '@/util/window';
import { useFullHeight } from '@/hooks/useFullHeight';

export default function GameMenu() {
  const [userID, setUserID] = useState('');
  const [isUserIDModalVisible, setIsUserIDModalVisible] = useState(false);
  const [createRoomCisible, setCreateRoomCisible] = useState(false);
  const [playerCount, setPlayerCount] = useState(2);
  const [onlinePlayer, setOnlinePlayer] = useState<number>(0)
  const [tabKey, setTabKey] = useState('user');
  const [aiCount, setAiCount] = useState(1);

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
    async ({ playerCount, aiCount }: {playerCount: number, aiCount: number }) => {
      await createRoom({
        MaxPlayers: playerCount,
        AiCount: aiCount,
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
      const sortList = res?.rooms?.sort((a: any, b: any) => {
        return a.roomID.localeCompare(b.roomID);
      }) ?? [];
      setOnlinePlayer(res?.onlinePlayer);
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
    if ((roomList?.length ?? 0) > 20) {
      message.error('房间数量已达上限');
      return;
    }
    handleCreateRoom({
      playerCount,
      aiCount,
    });
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

  useFullHeight(styles.gameMenu);
  return (
    <>
      <div className={styles.gameMenu} style={{ height: window.innerHeight }}>
        <div className={styles.title}>Acquire</div>
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
        <div className={styles.footer}>
          <div className={styles.left}>
            <div>
              <span className={styles.userId}>ID: {getLocalStorageUserName(userID)}</span>
              <Button
                type="primary"
                onClick={() => setIsUserIDModalVisible(true)}
                className={styles.button}
              >
                修改用户名
              </Button>
            </div>
            <span className={styles.userId}>当前在线人数: {onlinePlayer}</span>
          </div>
          <div className={styles.right}>
            <Button
              className={styles.button}
              onClick={() => {
                handleGetRoomList();
              }}
            >
              刷新
            </Button>
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
      <Modal
        title="选择对战模式"
        open={createRoomCisible}
        onOk={debouncedHandleOk}
        onCancel={() => {
          setPlayerCount(2);
          setCreateRoomCisible(false);
          setTabKey('user');
        }}
        okText="创建"
        cancelText="取消"
        centered
        className={styles.modal}
        styles={{
          body: { textAlign: 'center', minHeight: '150px', paddingTop: '20px' },
        }}
      >
        <Tabs
          centered
          activeKey={tabKey}
          onChange={(key) => {
            if (key === 'ai') {
              setPlayerCount(2);
            }
            setTabKey(key)
          }}
          items={[
            { key: 'user', label: '用户对战' },
            { key: 'ai', label: '人机对战' },
          ]}
        />

        {tabKey === 'user' ? (
          <Radio.Group
            onChange={(e) => setPlayerCount(e.target.value)}
            value={playerCount}
            size="large"
          >
            {[2, 3, 4, 5, 6].map((num) => (
              <Radio.Button key={num} value={num} className={styles.radio}>
                {num} 人
              </Radio.Button>
            ))}
          </Radio.Group>
        ) : (
          <>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 500, marginBottom: 8 }}>请选择总人数</div>
              <Radio.Group
                onChange={(e) => {
                  const newPlayerCount = e.target.value;
                  setPlayerCount(newPlayerCount);
                  // 🧠 限制 AI 数量不超过总人数
                  if (aiCount > newPlayerCount) {
                    setAiCount(newPlayerCount);
                  }
                }}
                value={playerCount}
                size="large"
              >
                {[2, 3, 4, 5, 6].map((num) => (
                  <Radio.Button key={num} value={num} className={styles.radio}>
                    {num} 人
                  </Radio.Button>
                ))}
              </Radio.Group>
            </div>

            <div>
              <div style={{ fontWeight: 500, marginBottom: 8 }}>请选择人机数量</div>
              <Radio.Group
                onChange={(e) => setAiCount(e.target.value)}
                value={aiCount}
                size="large"
              >
                {Array.from({ length: playerCount - 1 }, (_, i) => i + 1).map((num) => (
                  <Radio.Button key={num} value={num} className={styles.radio}>
                    {num} 个
                  </Radio.Button>
                ))}
              </Radio.Group>
            </div>
          </>
        )}
      </Modal>
      <EditUserID
        visible={isUserIDModalVisible}
        setVisible={setIsUserIDModalVisible}
        setUserID={setUserID}
      />
    </>
  );
}
