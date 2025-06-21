import React from 'react';
import styles from './index.module.less';
import { useNavigate } from 'react-router-dom';
import { Button, message, Popconfirm, Tag, Typography } from 'antd';
import { ListRoomInfo } from '@/types/room';
import { getLocalStorageUserID, getLocalStorageUserName, validateUserName } from '@/util/user';
import { DeleteOutlined } from '@ant-design/icons';
const { Text } = Typography;

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
        <div className={styles.homeId}>
          <div className={styles.label}>房间ID:</div>
          <Text ellipsis={{ tooltip: true }} style={{ color: userID === data.userID ? 'red' : 'black' }}>
            {data.roomID}
          </Text>
        </div>
        <Popconfirm
          title="确定删除这个房间？"
          onConfirm={handleDelete}
          okText="删除"
          cancelText="取消"
        >
          <div className={styles.delete}><DeleteOutlined /></div>
        </Popconfirm>
      </div>
      <div className={styles.roomAdmin}>
        <div className={styles.label}>房主ID:</div>
        <Text ellipsis={{ tooltip: true }} style={{ color: userID === data.userID ? 'red' : 'black' }}>
          {getLocalStorageUserName(data.userID)}
        </Text>
      </div>
      <div className={styles.label}>玩家列表:</div>
      <div className={styles.playerList}>
        {data.roomPlayer.length === 0 ? (
          <span>暂无玩家</span>
        ) : (
          <ul className={styles.list}>
            {data.roomPlayer.map((player) => (
              <li key={player.playerID} className={styles.playerItem}>
                <span className={styles.playerName}>
                  {getLocalStorageUserName(player.playerID)}
                </span>
                <Tag color={player.online ? 'green' : 'red'}>
                  {player.online ? '在线' : '掉线'}
                </Tag>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className={styles.body}>
        最多玩家: {data.maxPlayers}
        <Button
          type="primary"
          onClick={() => {
            if (data.roomPlayer.length >= data.maxPlayers && !data.roomPlayer.some(play => play.playerID === userId)) {
              message.error('房间已满');
              return;
            }
            if (!validateUserName(userID)) {
              message.error('请先设置用户名');
              return;
            }
            navigate(`/acquire/room/${data.roomID}?roomUserID=${data.userID}`)
          }}
          className={styles.enterBtn}>
          进入房间
        </Button>
      </div>
    </div>
  );
};

export default RoomCard;
