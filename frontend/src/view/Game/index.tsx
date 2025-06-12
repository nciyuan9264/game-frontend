import { useEffect, useState } from 'react';
import { Button, Modal, Radio, message, Typography, Space, Card } from 'antd';
import styles from './index.module.less';
import { createRoom, getRoomList } from '@/api/room';
import RoomCard from '@/composables/RoomCard';
import { Status } from '@/enum/http';
import FullscreenButton from '@/composables/FullScreen';

const { Title } = Typography;

export default function GameMenu() {
  const [visible, setVisible] = useState(false);
  const [playerCount, setPlayerCount] = useState(2);
  const [rooms, setRooms] = useState<{ roomID: string, maxPlayers: number }[]>([]);
  const showModal = () => setVisible(true);
  const handleCancel = () => setVisible(false);

  const handleOk = async () => {
    try {
      const res = await createRoom({ MaxPlayers: playerCount });
      if (res.status_code === Status.Succeed) {
        message.success(`模拟创建房间成功，人数：${playerCount}`);
        updateRoomList();
        setVisible(false);
      }
    } catch {
      message.error('创建失败，请重试');
    }
  };

  const updateRoomList = async () => {
    const res = await getRoomList();
    if (res.status_code === Status.Succeed) {
      setRooms(res.data.rooms);
    }
  };

  useEffect( () => {
    updateRoomList();
    // const interval = setInterval(() => {
    //   updateRoomList();
    // }, 1000);
    // return () => {
    //   clearInterval(interval);
    // };
  },[])

  const onChange = (e: any) => setPlayerCount(e.target.value);

  return (
    <div className={styles.gameMenu}>
      <Card className={styles.card}>
        <Title level={2} className={styles.title}>
          并购桌游
        </Title>
        <FullscreenButton />
        <Space direction="vertical" size="large" className={styles.space}>
          <Button
            type="primary"
            size="large"
            onClick={showModal}
            className={styles.button}
            block
          >
            创建房间
          </Button>
        </Space>
        <Modal
          title="选择房间人数"
          open={visible}
          onOk={handleOk}
          onCancel={handleCancel}
          okText="创建"
          cancelText="取消"
          centered
          className={styles.modal}
          styles={{ body: { textAlign: 'center', height: '100px', paddingTop: '30px' } }}
        >
          <Radio.Group onChange={onChange} value={playerCount} size="large">
            {[2, 3, 4, 5, 6].map((num) => (
              <Radio.Button key={num} value={num} className={styles.radio}>
                {num} 人
              </Radio.Button>
            ))}
          </Radio.Group>
        </Modal>
      </Card>
        <div className="roomList">
          {rooms?.map(room => (
            <RoomCard
              key={room.roomID}
              roomID={room.roomID}
              maxPlayers={room.maxPlayers}
              onDelete={() => { }}
            />
          ))}
        </div>
    </div>
  );
}
