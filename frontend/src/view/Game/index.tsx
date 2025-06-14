import { useEffect, useState } from 'react';
import { Modal, Radio, message, Typography, Card } from 'antd';
import styles from './index.module.less';
import { createRoom, deleteRoom, getRoomList } from '@/api/room';
import RoomCard from '@/component/RoomCard';
import { getOrCreateUserId } from '@/util/user';
import { useRequest } from 'ahooks';
import FullscreenButton from '@/component/FullScreen';

const { Title } = Typography;
export default function GameMenu() {
  const userId = getOrCreateUserId();

  const [visible, setVisible] = useState(false);
  const [playerCount, setPlayerCount] = useState(2);
  const showModal = () => setVisible(true);

  const { run: handleCreateRoom } = useRequest(
    async (MaxPlayers: number) => {
      await createRoom({
        MaxPlayers: MaxPlayers,
        UserID: userId,
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
        setVisible(false);
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
      return res.data.rooms
    },
    {
      manual: false,
      onError: () => {
        message.error('获取房间列表失败，请重试');
      },
    },
  );
  const handleOk = async () => {
    if (Number(roomList?.length ?? 0) > 25) {
      message.error('房间数量已达上限');
      return;
    }
    handleCreateRoom(playerCount);
  };

  useEffect(() => {
    const timeFlag = setInterval(() => {
      handleGetRoomList();
    }, 3000);

    (window as any).deleteRoom = handleDeleteRoom;

    return () => {
      clearInterval(timeFlag);
    };
  }, [])

  return (
    <div className={styles.gameMenu}>
      <Title level={2} className={styles.titleTop}>并购</Title>

      <div className={styles.roomGrid}>
        {roomList?.map(room => (
          <RoomCard
            key={room.roomID}
            data={room}
            onDelete={(roomID: string) => {
              handleDeleteRoom(roomID);
            }}
          />
        ))}

        {/* 创建房间卡片 */}
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

      {/* 弹窗 */}
      <Modal
        title="选择房间人数"
        open={visible}
        onOk={handleOk}
        onCancel={() => {
          setPlayerCount(2);
          setVisible(false)
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
    </div>

  );
}
