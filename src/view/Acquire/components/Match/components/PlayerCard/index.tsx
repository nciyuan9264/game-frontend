import React from 'react';
import {
  PlusCircleOutlined,
  UserOutlined,
  CloseOutlined,
  CheckOutlined,
  LoadingOutlined,
} from '@ant-design/icons';

import StatusTag, { Status } from './components/StatusTag';
import { Role, Seat } from '../../types';
import { WsMatchSyncData } from '@/types/room';
import { useSeatUIState } from './hooks/useSeatUIState';
import { useSeatAction } from './hooks/useSeatAction';

import styles from './index.module.less';

interface PlayerCardProps {
  data: Seat;
  userID: string;
  wsMatchSyncData?: WsMatchSyncData;
  sendMessage: (message: string) => void;
  canAddAI: boolean;
}

const PlayerCard: React.FC<PlayerCardProps> = ({
  data,
  userID,
  wsMatchSyncData,
  sendMessage,
  canAddAI,
}) => {
  const hasPlayer = Boolean(data.label);

  const {
    uiState,
    setAdding,
    setSuccess,
  } = useSeatUIState();

  const {
    canOperate,
    isRemove,
    handleClick,
  } = useSeatAction({
    data,
    userID,
    wsMatchSyncData,
    uiState,
    sendMessage,
    onAddAIStart: setAdding,
    onAddAISuccess: setSuccess,
    canAddAI,
  });

  return (
    <article
      className={`
        ${styles['seat-card']}
        ${!hasPlayer ? styles['seat-card-empty'] : ''}
        ${canOperate ? styles['seat-card-operable'] : ''}
        ${uiState !== 'idle' ? styles['seat-card-disabled'] : ''}
      `}
      onClick={handleClick}
    >
      {data.label === userID && (
        <div className={styles['seat-you-badge']}>你</div>
      )}

      {/* 头像 */}
      <div className={styles['seat-avatar']}>
        <div className={styles['default-content']}>
          {hasPlayer ? <UserOutlined /> : <PlusCircleOutlined />}
        </div>

        {canOperate && (
          <div className={styles['hover-content']}>
            {isRemove ? <CloseOutlined /> : <PlusCircleOutlined />}
          </div>
        )}

        {uiState === 'adding' && (
          <div className={styles['add-animation']}>
            <LoadingOutlined />
          </div>
        )}

        {uiState === 'success' && (
          <div className={styles['add-animation']}>
            <CheckOutlined />
          </div>
        )}
      </div>

      {/* 玩家信息 */}
      <div className={styles['seat-players']}>
        <div className={styles['seat-player']}>
          <span className={styles['seat-player-name']}>
            <span className={styles['default-content']}>
              {data.label || '空位'}
            </span>
            {canOperate && (
              <span className={styles['hover-content']}>
                {isRemove ? '移除玩家' : '添加人机'}
              </span>
            )}
          </span>

          {hasPlayer && (
            <StatusTag
              status={
                data.isReady ? Status.Ready : Status.Waiting
              }
            />
          )}
        </div>

        <div className={styles['seat-role']}>
          <span className={styles['seat-role-text']}>
            <span className={styles['default-content']}>
              {hasPlayer
                ? data.role === Role.Host
                  ? '身份 · 房主'
                  : '身份 · 玩家'
                : '等待玩家加入'}
            </span>
            {canOperate && (
              <span className={styles['hover-content']}>
                {isRemove ? '点击移除玩家' : '点击添加人机'}
              </span>
            )}
          </span>
        </div>
      </div>
    </article>
  );
};

export default PlayerCard;
