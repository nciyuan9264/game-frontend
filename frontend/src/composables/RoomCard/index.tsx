import React from 'react';
import styles from './index.module.less';
import { useNavigate } from 'react-router-dom';
import { Popconfirm } from 'antd';
// import { deleteRoom } from '@/api/room';

interface RoomCardProps {
  roomID: string;
  maxPlayers: number;
  onDelete: (roomID: string) => void;
}

const RoomCard: React.FC<RoomCardProps> = ({ roomID, maxPlayers, onDelete }) => {
  const navigate = useNavigate();

  const handleDelete = async () => {
    // await deleteRoom(roomID);
    // onDelete(roomID);
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.title}>房间ID: {roomID}</span>
        <Popconfirm
          title="确定删除这个房间？"
          onConfirm={handleDelete}
          okText="删除"
          cancelText="取消"
        >
          <span className={styles.delete}>🗑️</span>
        </Popconfirm>
      </div>
      <div className={styles.body}>
        最多玩家: {maxPlayers}
        <button onClick={() => navigate(`/room/${roomID}`)} className={styles.enterBtn}>
          进入房间
        </button>
      </div>
    </div>
  );
};

export default RoomCard;
