import React, { useEffect } from 'react';
import classNames from 'classnames';
import {
  PlusCircleOutlined,
  UserOutlined,
  CloseOutlined,
  CheckOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import { Tooltip } from 'antd';

import StatusTag, { Status } from './components/StatusTag';
import { Role, Seat } from '../../types';
import { SplendorWsMatchSyncData } from '@/types/SplendorRoom';
import { useSeatUIState } from './hooks/useSeatUIState';
import { useSeatAction } from './hooks/useSeatAction';

import styles from './index.module.less';
import { backendName2FrontendName } from '@/util/user';
import { useConfirmDialog } from '@/components/ConfirmDialog/useConfirmDialog';

interface PlayerCardProps {
  data: Seat;
  userID: string;
  wsMatchSyncData?: SplendorWsMatchSyncData;
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
  const { confirm, ConfirmDialogHolder } = useConfirmDialog();

  const { uiState, setAdding, setSuccess } = useSeatUIState();

  useEffect(() => {
    if (uiState === 'adding' && hasPlayer) {
      setSuccess();
    }
  }, [data.label, uiState, hasPlayer, setSuccess]);

  const { canOperate, isRemove, handleClick } = useSeatAction({
    data,
    userID,
    wsMatchSyncData,
    uiState,
    sendMessage,
    onAddAIStart: setAdding,
    onAddAISuccess: setSuccess,
    canAddAI,
    confirm,
  });
  const actionHintText = isRemove ? '点击移除玩家' : '点击添加人机';

  return (
    <>
      <article
        className={classNames(styles['seat-card'], {
          [styles['seat-card-empty']]: !hasPlayer,
          [styles['seat-card-operable']]: canOperate,
          [styles['seat-card-disabled']]: uiState !== 'idle',
        })}
        onClick={handleClick}
      >
        {data.label === userID && <div className={styles['seat-you-badge']}>你</div>}

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
              <LoadingOutlined className={styles['loading-icon']} />
            </div>
          )}

          {uiState === 'success' && (
            <div className={styles['add-animation']}>
              <CheckOutlined className={styles['success-icon']} />
            </div>
          )}
        </div>

        <div className={styles['seat-players']}>
          <div className={styles['seat-player']}>
            <span className={styles['seat-player-name']}>
              <Tooltip title={data.label} placement="top" arrow={{ pointAtCenter: true }}>
                <span className={styles['default-content']}>
                  {backendName2FrontendName(data.label) || '空位'}
                </span>
              </Tooltip>
              {canOperate && (
                <span className={styles['hover-content']}>{isRemove ? '移除玩家' : '添加人机'}</span>
              )}
            </span>

            {hasPlayer && <StatusTag status={data.isReady ? Status.Ready : Status.Waiting} />}
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
        {canOperate && (
          <div
            className={`${styles['tap-hint']} ${
              isRemove ? styles['tap-hint-remove'] : styles['tap-hint-add']
            }`}
          >
            {isRemove ? <CloseOutlined /> : <PlusCircleOutlined />}
            <span>{actionHintText}</span>
          </div>
        )}
      </article>
      {ConfirmDialogHolder}
    </>
  );
};

export default PlayerCard;
