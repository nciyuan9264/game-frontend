import React, { useMemo } from 'react';
import { WsRoomSyncData } from '@/types/room';
import styles from './index.module.less';
import { getLocalStorageUserID, getLocalStorageUserName } from '@/util/user';
import { Button, Modal, Typography, Space, Divider } from 'antd';
import { LeftOutlined, HomeOutlined, InfoCircleOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { GameStatus } from '@/enum/game';
import { GameStatusMap } from '@/const/game';
import { canBuyStock, canCreateCompany, getMergeSelection, getMergingModalAvailible } from '../../utils/game';
const { Text } = Typography;

interface SettlementProps {
  wsRef: React.MutableRefObject<WebSocket | null>
  data?: WsRoomSyncData;
  setCompanyInfoVisible: React.Dispatch<React.SetStateAction<boolean>>,
  setGameEndModalVisible: React.Dispatch<React.SetStateAction<boolean>>,
  setCreateCompanyModalVisible: React.Dispatch<React.SetStateAction<boolean>>,
  setBuyStockModalVisible: React.Dispatch<React.SetStateAction<boolean>>,
  setMergeCompanyModalVisible: React.Dispatch<React.SetStateAction<boolean>>,
  setMergeSelectionModalVisible: React.Dispatch<React.SetStateAction<boolean>>,
}

const TopBar3D: React.FC<SettlementProps> = ({
  wsRef,
  data,
  setCompanyInfoVisible,
  setGameEndModalVisible,
  setCreateCompanyModalVisible,
  setBuyStockModalVisible,
  setMergeCompanyModalVisible,
  setMergeSelectionModalVisible
}) => {
  const navigate = useNavigate();
  const { roomID } = useParams();
  const userID = getLocalStorageUserID();

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

  const currentStep = useMemo(() => {
    if (!data?.roomData.roomInfo.roomStatus) {
      return '等待其他玩家进入';
    }
    if (data?.roomData.roomInfo.gameStatus === GameStatus.END) {
      return '游戏结束';
    }
    if (data?.roomData.currentPlayer === userID) {
      return GameStatusMap[data?.roomData.roomInfo.gameStatus];
    } else {
      return '请等待其他玩家操作';
    }
  }, [data, data?.roomData.currentPlayer])

  const renderActionButton = () => {
    if (!data) return null;

    const buttonProps = {
      size: 'large' as const,
      className: styles.actionButton
    };

    if (canCreateCompany(data, userID)) {
      return (
        <Button
          {...buttonProps}
          type="primary"
          icon={<PlayCircleOutlined />}
          onClick={() => setCreateCompanyModalVisible(true)}
        >
          创建公司
        </Button>
      );
    }
    if (canBuyStock(data, userID)) {
      return (
        <Button
          {...buttonProps}
          type="primary"
          icon={<PlayCircleOutlined />}
          onClick={() => setBuyStockModalVisible(true)}
        >
          购买股票
        </Button>
      );
    }
    if (getMergingModalAvailible(data, userID)) {
      return (
        <Button
          {...buttonProps}
          type="primary"
          icon={<PlayCircleOutlined />}
          onClick={() => setMergeCompanyModalVisible(true)}
        >
          合并清算
        </Button>
      );
    }
    if (getMergeSelection(data, userID)) {
      return (
        <Button
          {...buttonProps}
          type="primary"
          icon={<PlayCircleOutlined />}
          onClick={() => setMergeSelectionModalVisible(true)}
        >
          选择留下的公司
        </Button>
      );
    }
    return null;
  };

  return (
    <div className={styles.topBar}>
      <div className={styles.leftSection}>
        <Button
          className={styles.backButton}
          type="text"
          size="large"
          icon={<LeftOutlined />}
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
            });
          }}
        />

        <Divider type="vertical" className={styles.divider} />

        <div className={styles.gameInfo}>
          <div className={styles.infoItem}>
            <HomeOutlined className={styles.infoIcon} />
            <Text className={styles.infoText} ellipsis={{ tooltip: true }}>房间 {roomID}</Text>
          </div>
          <div className={styles.infoItem}>
            <InfoCircleOutlined className={styles.infoIcon} />
            <Text className={styles.infoText} ellipsis={{ tooltip: true }}>{getLocalStorageUserName(userID)}</Text>
          </div>
        </div>

        <Divider type="vertical" className={styles.divider} />

        <Space size="middle">
          <Button
            className={styles.utilButton}
            type="default"
            size="large"
            onClick={() => setCompanyInfoVisible(true)}
          >
            公司面板
          </Button>
          <Button
            className={styles.utilButton}
            type="default"
            size="large"
            disabled={!isGameEnd}
            onClick={() => setGameEndModalVisible(true)}
          >
            结束清算
          </Button>
        </Space>
      </div>

      <div className={styles.centerSection}>
        <div className={styles.gameStatus}>
          {data?.roomData.roomInfo.roomStatus ? (
            data?.roomData.currentPlayer === userID ? (
              <div className={styles.yourTurn}>
                <PlayCircleOutlined className={styles.turnIcon} />
                你的回合
              </div>
            ) : (
              <div className={styles.waitingTurn}>
                等待 <span className={styles.playerName}>{getLocalStorageUserName(data.roomData.currentPlayer)}</span> 操作
              </div>
            )
          ) : (
            <div className={styles.waitingPlayers}>等待其他玩家进入</div>
          )}
        </div>
      </div>

      <div className={styles.rightSection}>
        <div className={styles.gameDetails}>
          {data?.tempData.last_tile_key && (
            <div className={styles.lastTile}>
              上次放置：<span className={styles.tileKey}>{data?.tempData.last_tile_key}</span>
            </div>
          )}
          <div className={styles.currentStep}>
            当前阶段：<span className={styles.stepName}>{currentStep}</span>
          </div>
        </div>

        <div className={styles.actionArea}>
          {renderActionButton()}
        </div>
      </div>
    </div>
  );
};

export default TopBar3D;
