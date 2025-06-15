import React from 'react';
import styles from './index.module.less';
import { useNavigate } from 'react-router-dom';
import { message, Popconfirm, Tag } from 'antd';
import { ListRoomInfo } from '@/types/room';
import { getLocalStorageUserID, getLocalStorageUserName, validateUserName } from '@/util/user';


interface RoomCardProps {
  data: ListRoomInfo;
  onDelete: (roomID: string) => void;
  userID: string;
}

const RoomCard: React.FC<RoomCardProps> = ({ data, onDelete, userID }) => {
  const navigate = useNavigate();
  const userId = getLocalStorageUserID();

  const handleDelete = async () => {
    if (userId !== data.userID) {
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
      <span className={styles.title} style={{color: userID === data.userID ? 'red' : 'black'}}>房主ID: {getLocalStorageUserName(data.userID)}</span>
      <div>
        玩家列表：<br />
        {
          data.roomPlayer.map((player) => {
            return (
              <span key={player.playerID} className={styles.player}>
                {getLocalStorageUserName(player.playerID)} <Tag>{player.online ? '在线' : '掉线'}</Tag>
              </span>
            );
          })
        }
      </div>
      <div className={styles.body}>
        最多玩家: {data.maxPlayers}
        <button onClick={() => {
          if(data.roomPlayer.length >= data.maxPlayers && !data.roomPlayer.some(play => play.playerID === userId)){
            message.error('房间已满');
            return;
          }
          if(!validateUserName(userID)){
            message.error('请先设置用户名');
            return;
          }
          navigate(`/room/${data.roomID}`)
        }} className={styles.enterBtn}>
          进入房间
        </button>
      </div>
    </div>
  );
};

export default RoomCard;
