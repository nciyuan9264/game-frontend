import React, { useMemo } from 'react';
import { WsRoomSyncData } from '@/types/room';
import { backendName2FrontendName } from '@/util/user';
import { Modal } from 'antd';
import { ArrowLeftOutlined, HomeOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { canBuyStock, canCreateCompany, getMergeSelection, getMergingModalAvailible } from '../../utils/game';
import { Button } from '@/components/Button';
import { useUrlParams } from '@/hooks/useUrlParams';
import { GameStatus } from '@/enum/game';

import styles from './index.module.less';

interface SettlementProps {
  wsRef: React.MutableRefObject<WebSocket | null>
  data?: WsRoomSyncData;
  setCompanyInfoVisible: React.Dispatch<React.SetStateAction<boolean>>,
  setGameEndModalVisible: React.Dispatch<React.SetStateAction<boolean>>,
  setCreateCompanyModalVisible: React.Dispatch<React.SetStateAction<boolean>>,
  setBuyStockModalVisible: React.Dispatch<React.SetStateAction<boolean>>,
  setMergeCompanyModalVisible: React.Dispatch<React.SetStateAction<boolean>>,
  setMergeSelectionModalVisible: React.Dispatch<React.SetStateAction<boolean>>,
  userID: string;
  is3DVersion: boolean;
  setIs3DVersion: React.Dispatch<React.SetStateAction<boolean>>;
}
const Settlement: React.FC<SettlementProps> = ({
  wsRef,
  data,
  setCompanyInfoVisible,
  setGameEndModalVisible,
  setCreateCompanyModalVisible,
  setBuyStockModalVisible,
  setMergeCompanyModalVisible,
  setMergeSelectionModalVisible,
  userID,
}) => {
  const navigate = useNavigate();
  const { roomID } = useUrlParams();

  const currentStatus = useMemo(() => {
    const roomData = data?.roomData;
    if (!roomData) return '';

    const { roomInfo, currentPlayer, players } = roomData;

    // 1. 游戏结束优先级最高
    if (roomInfo.roomStatus === GameStatus.END) {
      return '游戏结束';
    }

    // 2. 房间未开始
    if (!roomInfo.roomStatus) {
      return '等待其他玩家进入';
    }

    // 3. 当前是自己回合
    if (currentPlayer === userID) {
      return '你的回合';
    }

    // 4. 其他玩家回合
    const player = players[currentPlayer];
    const name = backendName2FrontendName(currentPlayer);

    return `请等待${name}${player?.ai ? '（AI玩家）' : ''}操作`;

  }, [data, userID, backendName2FrontendName]);

  const renderButton = () => {
    if (!data) {
      return;
    }
    if (canCreateCompany(data, userID)) {
      return (
        <Button
          content='创建公司'
          style={{ height: '2rem' }}
          disabled={!canCreateCompany(data, userID)}
          onClick={() => {
            setCreateCompanyModalVisible(true);
          }}
        />
      )
    }
    if (canBuyStock(data, userID)) {
      return (
        <Button
          content='购买股票'
          style={{ height: '2rem' }}
          disabled={!canBuyStock(data, userID)}
          onClick={() => {
            setBuyStockModalVisible(true);
          }}
        />
      )
    }
    if (getMergingModalAvailible(data, userID)) {
      return (
        <Button
          content='合并清算'
          style={{ height: '2rem' }}
          disabled={!getMergingModalAvailible(data, userID)}
          onClick={() => {
            setMergeCompanyModalVisible(true);
          }}
        />
      )
    }
    if (getMergeSelection(data, userID)) {
      return (
        <Button
          style={{ height: '2rem' }}
          content='选择留下的公司'
          disabled={!getMergeSelection(data, userID)}
          onClick={() => {
            setMergeSelectionModalVisible(true);
          }}
        />
      )
    }
  }

  return (
    <div className={styles['top-bar']}>
      <div className={styles['top-bar__header']}>
        <div className={styles['top-bar__left']}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => {
              Modal.confirm({
                title: '确认操作',
                content: '你确定要离开房间吗？',
                okText: '确认',
                cancelText: '取消',
                onOk: () => {
                  if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                    wsRef.current.close();
                  }
                  setTimeout(() => {
                    navigate('/game/acquire');
                  }, 200);
                }
              })
            }}
          />
          <div className={styles['top-bar__brand']}>
            <div className={styles['top-bar__title']}>Acquire 线上棋盘</div>
          </div>
        </div>
        <div className={styles['top-bar__status']}>
          <Button
            content={currentStatus}
            customType='primary'
            style={{ minWidth: '12rem', height: '2rem', fontSize: '1.2rem' }}
          />
        </div>
        <div className={styles['top-bar__right']}>
          {/* <Button
            content={is3DVersion ? '切换到2D' : '切换到3D'}
            onClick={() => setIs3DVersion(!is3DVersion)}
          >
          </Button> */}
          <Button
            content="公司面板"
            onClick={() => {
              setCompanyInfoVisible(true);
            }}
          >
          </Button>
          {data?.roomData.roomInfo.roomStatus === GameStatus.END && (
            <Button
              content="玩家排名"
              onClick={() => {
                setGameEndModalVisible(true);
              }}
            >
            </Button>
          )}
          <div className={styles['top-bar__dynamic-action']}>{renderButton()}</div>
        </div>
      </div>
      <div className={styles['top-bar__footer']}>
        <div><HomeOutlined /> 房间 {roomID}  <UserOutlined /> 玩家ID {backendName2FrontendName(userID)}</div>
        {data?.tempData.last_tile_key && <div>上一个放置的地块：{data?.tempData.last_tile_key}</div>}
      </div>
    </div>
  );
};

export default Settlement;
