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

  const isGameEnd = useMemo(() => {
    if (!data) {
      return false;
    }
    return !Object.entries(data?.roomData.companyInfo ?? {}).some(([_, val]) => {
      return Number(val.tiles ?? 0) < 11
    }) || Object.entries(data?.roomData.companyInfo ?? {}).some(([_, val]) => {
      return Number(val.tiles ?? 0) >= 41
    }) || data?.roomData?.roomInfo?.gameStatus === GameStatus.END || (!Object.entries(data?.roomData.companyInfo ?? {}).some(([_, val]) => {
      return Number(val.tiles ?? 0) < 11 && Number(val.tiles ?? 0) !== 0
    }) && !Object.entries(data?.roomData.companyInfo ?? {}).every(([_, val]) => {
      return Number(val.tiles ?? 0) === 0
    }));
  }, [data]);

  // const currentStep = useMemo(() => {
  //   if (!data?.roomData.roomInfo.roomStatus) {
  //     return '等待其他玩家进入';
  //   }
  //   if (data?.roomData.roomInfo.gameStatus === GameStatus.END) {
  //     return '游戏结束';
  //   }
  //   if (data?.roomData.currentPlayer === userID) {
  //     return GameStatusMap[data?.roomData.roomInfo.gameStatus];
  //   } else {
  //     return '请等待其他玩家操作';
  //   }
  // }, [data, data?.roomData.currentPlayer])

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
      <div className={styles['top-content']}>
        <div className={styles.left}>
          <Button
            icon={<ArrowLeftOutlined />}
            style={{ height: '2rem' }}
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
          <div className={styles.content}>
            <div className={styles.titleRow}>Acquire 线上棋盘</div>
          </div>
        </div>
        <div className={styles.middle}>
          {data?.roomData.roomInfo.roomStatus ? (
            data?.roomData.currentPlayer === userID ? (
              <Button content="你的回合" customType="primary" style={{ minWidth: '12rem', height: '2rem', fontSize: '1.2rem' }} />
            ) : (
              <Button content={
                `请等待
                  ${backendName2FrontendName(data.roomData.currentPlayer)}
                  操作`
              }
                customType='primary'
                style={{ minWidth: '12rem', height: '2rem', fontSize: '1.2rem' }}
              />
            )
          ) : (
            '等待其他玩家进入'
          )}
        </div>
        <div className={styles.right}>
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
          {isGameEnd && (
            <Button
              content="玩家排名"
              onClick={() => {
                setGameEndModalVisible(true);
              }}
            >
            </Button>
          )}
          <div className={styles.renderButton}>{renderButton()}</div>
        </div>
      </div>
      <div className={styles['bottom-content']}><HomeOutlined /> 房间 {roomID}  <UserOutlined /> 玩家ID {backendName2FrontendName(userID)}</div>
      {/*
      <div className={styles.right}>
        {data?.tempData.last_tile_key && <div>上一个放置的地块：<span className={styles.playerName}>{data?.tempData.last_tile_key}</span></div>}
        <div>当前阶段：{currentStep}</div>
      </div> */}
    </div>
  );
};

export default Settlement;
