import { useEffect, useState } from 'react';
import {  Modal, Radio, message, Typography, Card } from 'antd';
import styles from './index.module.less';
import { createRoom, deleteRoom, getRoomList } from '@/api/room';
import RoomCard from '@/component/RoomCard';
import { Status } from '@/enum/http';
import { getOrCreateUserId } from '@/util/user';
import {  ListRoomInfo } from '@/types/room';
// import FullscreenButton from '@/component/FullScreen';

const { Title } = Typography;

export default function GameMenu() {
  const userId = getOrCreateUserId();

  const [visible, setVisible] = useState(false);
  const [playerCount, setPlayerCount] = useState(2);
  const [rooms, setRooms] = useState<ListRoomInfo[]>([]);
  const showModal = () => setVisible(true);
  const handleCancel = () => setVisible(false);

  const handleOk = async () => {
    try {
      const res = await createRoom({ MaxPlayers: playerCount, UserID: userId  });
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

  useEffect(() => {
    (window as any).deleteRoom = handleDeleteRoom;
  }, [])

  const handleDeleteRoom = async (roomID: string) => {
    try {
      const res = await deleteRoom({RoomID: roomID});
      if (res.status_code === Status.Succeed) {
        message.success(`模拟删除房间成功，房间ID：${roomID}`);
        updateRoomList();
      }
    } catch {
      message.error('删除失败，请重试');
    }
  };

  useEffect(() => {
    updateRoomList();
  }, [])
  const onChange = (e: any) => setPlayerCount(e.target.value);
  return (
    <div className={styles.gameMenu}>
      <Title level={2} className={styles.titleTop}>并购</Title>

      <div className={styles.roomGrid}>
        {rooms?.map(room => (
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
            {/* <PlusOutlined style={{ fontSize: 24 }} /> */}
            <div style={{ marginTop: 8 }}>创建房间</div>
          </div>
        </Card>
      </div>

      {/* 弹窗 */}
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
    </div>

  );
}
