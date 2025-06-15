import { useEffect, useMemo, useState } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import styles from './index.module.less';
import { useParams } from 'react-router-dom';
import Board from './components/Board';
import { Button, message, Modal, Tag } from 'antd';
import HotelSelectorModal from './components/CreateCompany';
import { GameStatus } from '@/enum/game';
import { CompanyKey, WsRoomSyncData } from '@/types/room';
import BuyStock from './components/BuyStock';
import CompanyStockActionModal from './components/MergeCompany';
import MergeSelection from './components/MergeSelection';
import WaitingModal from './components/Waiting';
import { baseURL } from '@/const/env';
import { CompanyColor } from '@/const/color';
import GameEnd from './components/GameEnd';
import CompanyStockInfoModal from './components/StockInfo';
import { GameStatusMap } from '@/const/game';
import { getLocalStorageUserID, getLocalStorageUserName } from '@/util/user';

export default function Room() {
  const { roomID } = useParams(); // 获取 URL 参数中的 roomID
  const [createCompanyModalVisible, setCreateCompanyModalVisible] = useState(false);
  const [buyStockModalVisible, setBuyStockModalVisible] = useState(false);
  const [gameEndModalVisible, setGameEndModalVisible] = useState(false);
  const [companyInfoVisible, setCompanyInfoVisible] = useState(false);
  const [data, setData] = useState<WsRoomSyncData>();
  const [hoveredTile, setHoveredTile] = useState<string | undefined>(undefined);
  const userId = getLocalStorageUserID();
  const mergingModalVisible = useMemo(() => {
    const firstHoders = Object.entries(data?.tempData.mergeSettleData || {}).find(([_, val]) => {
      return val.hoders.length > 0;
    });
    const needSettle = firstHoders?.[1].hoders[0] === userId;
    return data?.roomData.roomInfo.gameStatus === GameStatus.MergingSettle && needSettle;
  }, [data]);

  const waitingModalComtent = useMemo(() => {
    if (data?.roomData.roomInfo.roomStatus === false) {
      return '请等待其他玩家加入';
    }
    if (data?.roomData.roomInfo.gameStatus === GameStatus.MergingSettle) {
      return '请等待其他玩家结算';
    }
    return '';
  }, [data]);

  const mergingSelectionModalVisible = useMemo(() => {
    return data?.roomData.roomInfo.gameStatus === GameStatus.MergingSelection && userId === data.roomData.currentPlayer;
  }, [data?.roomData.roomInfo.gameStatus, userId, data?.roomData.currentPlayer])
  const { sendMessage } = useWebSocket(`ws://${baseURL}/ws?roomID=${roomID}&userId=${userId}`, (msg) => {
    const data: WsRoomSyncData = JSON.parse(msg.data);
    if (data.type === 'error') {
      message.error(data.message);
      return;
    }
    if (data.type === 'sync') {
      console.log('收到数据：', data);
      setData(data);
      if (userId === data.roomData.currentPlayer) {
        if (data.roomData.roomInfo.gameStatus === GameStatus.CREATE_COMPANY) {
          setCreateCompanyModalVisible(true);
        } else {
          setCreateCompanyModalVisible(false);
        }
        if (data.roomData.roomInfo.gameStatus === GameStatus.BUY_STOCK) {
          setBuyStockModalVisible(true);
        } else {
          setBuyStockModalVisible(false);
        }
      } else {
        setBuyStockModalVisible(false);
        setCreateCompanyModalVisible(false);
      }
    }
  });

  const placeTile = (tileKey: string) => {
    Modal.confirm({
      title: '确认操作',
      content: (
        <div>
          你确定要放置这个 tile 吗？
          <div style={{ fontWeight: 'bold', marginTop: 8 }}>{tileKey}</div>
        </div>
      ),
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        sendMessage(JSON.stringify({
          type: 'place_tile',
          payload: tileKey,
        }));
      },
    });
  };

  const isGameEnd = useMemo(() => {
    return !Object.entries(data?.roomData.companyInfo ?? {}).some(([_, val]) => {
      return Number(val.tiles ?? 0) < 11
    }) || Object.entries(data?.roomData.companyInfo ?? {}).some(([_, val]) => {
      return Number(val.tiles ?? 0) >= 41
    })
  }, [data]);

  const currentPlayer = useMemo(() => {
    return data?.roomData.currentPlayer;
  }, [data?.roomData.currentPlayer])

  const currentStep = useMemo(() => {
    if (!data?.roomData.roomInfo.roomStatus) {
      return '等待其他玩家进入';
    }
    if (currentPlayer === userId) {
      return GameStatusMap[data?.roomData.roomInfo.gameStatus];
    } else {
      return '请等待其他玩家操作';
    }
  }, [data, currentPlayer])

  useEffect(() => {
    if (currentPlayer === userId) {
      const audio = new Audio("/your-turn.mp3");
      audio.play().catch((err) => {
        console.warn("音效播放失败（可能是用户未交互）", err);
      });
    }
  }, [currentPlayer, userId]);

  return (
    <>
      <div className={styles.roomContainer}>
        <div className={styles.topBar}>
          <div className={styles.left}>
            <div>房间号：{roomID}</div>
            <div>用户ID：{getLocalStorageUserName(userId)}</div>
            <Button
              type="primary"
              className={styles.buyStockBtn}
              onClick={() => {
                setCompanyInfoVisible(true);
              }}
            >
              公司面板
            </Button>
          </div>
          <div className={styles.middle}>
            <div className={styles.currentPlayer}>{data?.roomData.roomInfo.roomStatus ? currentPlayer === userId ? '你的回合' : '请等待其他玩家操作' : '等待其他玩家进入'}</div>
            <Button
              type="primary"
              className={styles.buyStockBtn}
              disabled={!isGameEnd}
              onClick={() => {
                sendMessage(JSON.stringify({
                  type: 'game_end',
                }));
                setGameEndModalVisible(true);
              }}
            >
              结束清算
            </Button>
          </div>
          <div>当前阶段：{currentStep}</div>
        </div>
        <div className={styles.gameBoard}>
          <Board tilesData={data?.roomData.tiles} hoveredTile={hoveredTile} />
          <div className={styles.companyInfo}>
            <div className={styles.header}>
              <div className={styles.title}>市场信息</div>
              <Button
                type="primary"
                className={styles.buyStockBtn}
                disabled={!(currentPlayer === userId && data?.roomData.roomInfo.gameStatus === GameStatus.BUY_STOCK)}
                onClick={() => {
                  setBuyStockModalVisible(true);
                }}
              >
                购买股票
              </Button>
            </div>
            <table className={styles.marketTable}>
              <thead>
                <tr>
                  <th>公司</th>
                  <th>股价</th>
                  <th>剩余股票</th>
                  <th>土地数</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(data?.roomData.companyInfo || {}).map((company, index) => (
                  <tr key={company.name}>
                    <td className={`${styles.companyName} ${styles[`bgColor${index % 5}`]}`}>{company.name}</td>
                    <td>${company.stockPrice}</td>
                    <td>{company.stockTotal}</td>
                    <td>{company.tiles}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className={styles.assets}>
          <div className={styles.commonAssets}>
            <div className={styles.header}>
              <div className={styles.title}>市场信息</div>
              <Button
                type="primary"
                className={styles.buyStockBtn}
                disabled={!(currentPlayer === userId && data?.roomData.roomInfo.gameStatus === GameStatus.BUY_STOCK)}
                onClick={() => {
                  setBuyStockModalVisible(true);
                }}
              >
                购买股票
              </Button>
            </div>
            <table className={styles.marketTable}>
              <thead>
                <tr>
                  <th>公司</th>
                  <th>股价</th>
                  <th>剩余股票</th>
                  <th>土地数</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(data?.roomData.companyInfo || {}).map((company, index) => (
                  <tr key={company.name}>
                    <td className={`${styles.companyName} ${styles[`bgColor${index % 5}`]}`}
                      style={{
                        backgroundColor: CompanyColor[company.name as CompanyKey]
                      }}
                    >{company.name}</td>
                    <td>${company.stockPrice}</td>
                    <td>{company.stockTotal}</td>
                    <td>{company.tiles}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={styles.playerAssets}>
            <div className={styles.header}>
              <div className={styles.title}>你的资产</div>
            </div>
            <ul className={styles.playerInfo}>
              <li className={styles.money}>
                💰 现金：
                <span className={styles.moneyAmount}>${data?.playerData.info.money}</span>
              </li>
              <li className={styles.stocks}>
                📈 股票：


                <ul className={styles.stockList}>
                  {Object.entries(data?.playerData.stocks || {})
                    .filter(([_, count]) => Number(count) > 0)
                    .map(([company, count]) => (
                      <li key={company} className={styles.stockItem}>
                        <Tag
                          color={CompanyColor[company as CompanyKey]}
                          style={{ padding: '4px 8px', fontSize: 14, borderRadius: 8 }}
                        >
                          <b>{company}</b> × <span className={styles.stockCount}>{count}</span>
                        </Tag>
                      </li>
                    ))}
                </ul>
              </li>
              <li>
                🧱 Tiles：
                <div className={styles.tileList}>
                  {(data?.playerData.tiles || []).sort().map((tileKey: string) => (
                    <span
                      className={styles.tile}
                      key={tileKey}
                      onMouseEnter={() =>
                        currentPlayer === userId &&
                        data?.roomData.roomInfo.gameStatus === GameStatus.SET_Tile &&
                        setHoveredTile(tileKey)
                      }
                      onMouseOut={() => {
                        currentPlayer === userId && setHoveredTile(undefined);
                      }}
                      onClick={() =>
                        currentPlayer === userId &&
                        data?.roomData.roomInfo.gameStatus === GameStatus.SET_Tile &&
                        placeTile(tileKey)
                      }
                    >
                      {tileKey}
                    </span>
                  ))}
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <WaitingModal content={waitingModalComtent} />
      <GameEnd
        data={data}
        visible={gameEndModalVisible}
        setGameEndModalVisible={setGameEndModalVisible}
      />
      <CompanyStockInfoModal
        visible={companyInfoVisible}
        setCompanyInfoVisible={setCompanyInfoVisible}
      />
      <BuyStock
        visible={buyStockModalVisible}
        setBuyStockModalVisible={setBuyStockModalVisible}
        onSubmit={(modalData) => {
          sendMessage(JSON.stringify({
            type: 'buy_stock',
            payload: modalData,
          }));
          setBuyStockModalVisible(false);
        }}
        data={data} />

      <MergeSelection
        visible={mergingSelectionModalVisible}
        data={data}
        onOk={(modalData) => {
          sendMessage(JSON.stringify({
            type: 'merging_selection',
            payload: modalData,
          }));
          setBuyStockModalVisible(false);
        }}
      />
      <CompanyStockActionModal
        visible={mergingModalVisible}
        data={data}
        onOk={(modalData) => {
          sendMessage(JSON.stringify({
            type: 'merging_settle',
            payload: modalData,
          }));
        }}
        onCancel={function (): void {
          throw new Error('Function not implemented.');
        }} />
      <HotelSelectorModal visible={createCompanyModalVisible} company={data?.roomData.companyInfo} onSelect={(company) => {
        sendMessage(JSON.stringify({
          type: 'create_company',
          payload: company,
        }));
      }} />
    </>
  );
}
