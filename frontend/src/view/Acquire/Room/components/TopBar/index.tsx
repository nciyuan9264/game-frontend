import React, { useMemo } from 'react';
import { WsRoomSyncData } from '@/types/room';
import styles from './index.module.less';
import { getLocalStorageUserID, getLocalStorageUserName } from '@/util/user';
import { Button, Modal, Typography } from 'antd';
import { LeftOutlined } from '@ant-design/icons';
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
const Settlement: React.FC<SettlementProps> = ({
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

  const renderButton = () => {
    if (!data) {
      return;
    }
    if (canCreateCompany(data, userID)) {
      return (
        <Button
          type="primary"
          disabled={!canCreateCompany(data, userID)}
          onClick={() => {
            setCreateCompanyModalVisible(true);
          }}
        >
          创建公司
        </Button>
      )
    }
    if (canBuyStock(data, userID)) {
      return (
        <Button
          type="primary"
          disabled={!canBuyStock(data, userID)}
          onClick={() => {
            setBuyStockModalVisible(true);
          }}
        >
          购买股票
        </Button>
      )
    }
    if (getMergingModalAvailible(data, userID)) {
      return (
        <Button
          type="primary"
          disabled={!getMergingModalAvailible(data, userID)}
          onClick={() => {
            setMergeCompanyModalVisible(true);
          }}
        >
          合并清算
        </Button>
      )
    }
    if (getMergeSelection(data, userID)) {
      return (
        <Button
          type="primary"
          disabled={!getMergeSelection(data, userID)}
          onClick={() => {
            setMergeSelectionModalVisible(true);
          }}
        >
          选择留下的公司
        </Button>
      )
    }
  }

  return (
    <div className={styles.topBar}>
      <div className={styles.left}>
        <Button
          className={styles.backButton}
          type="text"
          icon={<LeftOutlined style={{ fontSize: 20 }} />}
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
        >
        </Button>
        <div className={styles.IDs}>
          <div className={styles.ID}><Text ellipsis={{ tooltip: true }}>房间号：{roomID}</Text></div>
          <div className={styles.ID}><Text ellipsis={{ tooltip: true }}>用户ID：{getLocalStorageUserName(userID)}</Text></div>
        </div>
        <Button
          type="primary"
          onClick={() => {
            setCompanyInfoVisible(true);
          }}
        >
          公司面板
        </Button>
        <Button
          type="primary"
          style={{ zIndex: 9999 }}
          disabled={!isGameEnd}
          onClick={() => {
            setGameEndModalVisible(true);
          }}
        >
          结束清算
        </Button>
      </div>
      <div className={styles.middle}>
        {data?.roomData.roomInfo.roomStatus ? (
          data?.roomData.currentPlayer === userID ? (
            <span className={styles.yourTurn}>你的回合</span>
          ) : (
            <>
              请等待
              <span className={styles.playerName}>{getLocalStorageUserName(data.roomData.currentPlayer)}</span>
              操作
            </>
          )
        ) : (
          '等待其他玩家进入'
        )}
      </div>
      <div className={styles.right}>
        {data?.tempData.last_tile_key && <div>上一个放置的地块：<span className={styles.playerName}>{data?.tempData.last_tile_key}</span></div>}
        <div>当前阶段：{currentStep}</div>
        <div>{renderButton()}</div>
      </div>
    </div>
  );
};

export default Settlement;
