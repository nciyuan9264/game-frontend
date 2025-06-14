import React from 'react';
import styles from './index.module.less';
import { useNavigate } from 'react-router-dom';
import { message, Popconfirm } from 'antd';
import { ListRoomInfo } from '@/types/room';
import { getOrCreateUserId } from '@/util/user';

interface RoomCardProps {
  data: ListRoomInfo;
  onDelete: (roomID: string) => void;
}

const RoomCard: React.FC<RoomCardProps> = ({ data, onDelete }) => {
  const navigate = useNavigate();
  const userId = getOrCreateUserId();

  const handleDelete = async () => {
    if(userId !== data.userID) {
      message.error('您不是房主，无法删除房间');
      return;
    }
    onDelete(data.roomID);
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.title}>房间ID: {data.roomID}</span>
        <Popconfirm
          title="确定删除这个房间？"
          onConfirm={handleDelete}
          okText="删除"
          cancelText="取消"
        >
          <span className={styles.delete}>🗑️</span>
        </Popconfirm>
      </div>
      <span className={styles.title}>用户ID: {data.userID}</span>
      <div className={styles.body}>
        最多玩家: {data.maxPlayers}
        <button onClick={() => navigate(`/room/${data.roomID}`)} className={styles.enterBtn}>
          进入房间
        </button>
      </div>
    </div>
  );
};

export default RoomCard;
