import React from 'react';
import styles from './index.module.less';
import { PlusCircleOutlined, UserOutlined, CloseOutlined } from '@ant-design/icons';

import StatusTag, { Status } from './components/StatusTag';
import { Role, Seat } from '../../types';
import { WsMatchSyncData } from '@/types/room';
import { Modal } from 'antd';

interface PlayerCardProps {
  data: Seat;
  userID: string;
  wsMatchSyncData?: WsMatchSyncData;
  sendMessage: (message: string) => void;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ data, userID, wsMatchSyncData, sendMessage }) => {
  const hasPlayer = !!data.label;
  const isCurrentPlayerOwner = wsMatchSyncData?.playerID === wsMatchSyncData?.room.ownerID;
  const canOperate = isCurrentPlayerOwner && (!data.label || data.label !== userID);

  return (
    <article
      className={`
        ${styles['seat-card']}
        ${hasPlayer ? '' : styles['seat-card-empty']}
        ${canOperate ? styles['seat-card-operable'] : ''}
      `}
      onClick={() => {
        if (canOperate) {
          if (hasPlayer) {
            Modal.confirm({
              title: '确认操作',
              content: '你确定要移除玩家吗？',
              okText: '确认',
              cancelText: '取消',
              onOk: () => {
                sendMessage(JSON.stringify({
                  type: 'match_remove_player',
                  playerID: data.label,
                }));
              }
            })
          } else {
            sendMessage(JSON.stringify({
              type: 'match_add_ai',
            }));
          }
        }
      }}
    >
      {data.label === userID && <div className={styles['seat-you-badge']}>你</div>}

      {/* 头像 */}
      <div className={styles['seat-avatar']}>
        <div className={styles['default-content']}>
          {hasPlayer ? <UserOutlined /> : <PlusCircleOutlined />}
        </div>
        {canOperate && <div className={styles['hover-content']}>
          {hasPlayer ? <CloseOutlined /> : <PlusCircleOutlined />}
        </div>}
      </div>

      {/* 玩家信息 */}
      <div className={styles['seat-players']}>
        <div className={styles['seat-player']}>
          <span className={styles['seat-player-name']}>
            <span className={styles['default-content']}>{data.label || '空位'}</span>
            {canOperate && <span className={styles['hover-content']}>
              {hasPlayer ? '移除玩家' : '添加人机'}
            </span>}
          </span>
          {hasPlayer && <StatusTag status={data.isReady ? Status.Ready : Status.Waiting} />}
        </div>
        <div className={styles['seat-role']}>
          <span className={styles['seat-role-text']}>
            <span className={styles['default-content']}>
              {hasPlayer ? (data.role === Role.Host ? '身份 · 房主' : '身份 · 玩家') : '等待玩家加入'}
            </span>
            {canOperate && <span className={styles['hover-content']}>
              {hasPlayer ? '点击移除玩家' : '点击添加人机'}
            </span>}
          </span>
        </div>
      </div>
    </article>
  );
};

export default PlayerCard;
