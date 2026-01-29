import React from 'react';
import styles from './index.module.less';
import { useNavigate } from 'react-router-dom';
import { Button, message, Popconfirm, Tag, Typography } from 'antd';
import { ListRoomInfo } from '@/types/room';
import { DeleteOutlined } from '@ant-design/icons';
import { UserProfile } from '@/hooks/request/useProfile';
import { profile2BackendName, backendName2FrontendName } from '@/util/user';
import { GameType } from '@/hooks/useGameType';
const { Text } = Typography;

interface RoomCardProps {
  data: ListRoomInfo;
  onDelete: (roomID: string) => void;
  userProfile: UserProfile;
  gameType: GameType;
}

const RoomCard: React.FC<RoomCardProps> = ({ data, onDelete, userProfile, gameType }) => {
  const navigate = useNavigate();

  const handleDelete = async () => {
    if (profile2BackendName(userProfile) !== data.userID) {
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
          <Text ellipsis={{ tooltip: true }}>
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
        <Text ellipsis={{ tooltip: true }} style={{
          border: profile2BackendName(userProfile) === data.userID ? '1px solid #61d7f2' : 'unset',
          borderRadius: profile2BackendName(userProfile) === data.userID? '5px' : 'unset',
          padding: profile2BackendName(userProfile) === data.userID? '2px 5px' : 'unset',
          color: profile2BackendName(userProfile) === data.userID? '#1e7fbd' : 'unset',
          backgroundColor: profile2BackendName(userProfile) === data.userID? '#e8ffff' : 'unset',
        }}>
          {backendName2FrontendName(data.userID)}
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
                  {backendName2FrontendName(player.playerID)}
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
            if (data.roomPlayer.length >= data.maxPlayers && !data.roomPlayer.some(play => play.playerID === profile2BackendName(userProfile))) {
              message.error('房间已满');
              return;
            }
            navigate(`/${gameType}/room/${data.roomID}?roomUserID=${data.userID}`)
          }}
          className={styles.enterBtn}>
          进入房间
        </Button>
      </div>
    </div>
  );
};

export default RoomCard;
