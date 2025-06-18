import { useEffect, useMemo, useRef, useState } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import styles from './index.module.less';
import { useParams, useSearchParams } from 'react-router-dom';
import Board from './components/Board';
import { Button, message, Modal, Tag } from 'antd';
import CreateCompanyModal from './components/CreateCompany';
import { GameStatus } from '@/enum/game';
import { CompanyKey, WsRoomSyncData } from '@/types/room';
import BuyStock from './components/BuyStock';
import CompanyStockActionModal from './components/MergeCompany';
import MergeSelection from './components/MergeSelection';
import WaitingModal from './components/Waiting';
import { wsUrl } from '@/const/env';
import { CompanyColor } from '@/const/color';
import GameEnd from './components/GameEnd';
import CompanyStockInfoModal from './components/StockInfo';
import { GameStatusMap } from '@/const/game';
import { getLocalStorageUserID, getLocalStorageUserName } from '@/util/user';
import CompanyInfo from './components/CompanyInfo';
import { isTabletLandscape } from '@/util/window';
import MessageSender from './components/MessageSender';
import { playAudio } from '@/util/audio';
export const getMergingModalAvailible = (data: WsRoomSyncData, userID: string) => {
  const firstHoders = Object.entries(data?.tempData.mergeSettleData || {}).find(([_, val]) => {
    return val.hoders.length > 0;
  });
  const needSettle = firstHoders?.[1].hoders[0] === userID;
  return data?.roomData.roomInfo.gameStatus === GameStatus.MergingSettle && needSettle;
};

export const getMergeSelection = (data: WsRoomSyncData, userID: string) => {
  return data?.roomData.roomInfo.gameStatus === GameStatus.MergingSelection && data?.roomData.currentPlayer === userID;

};

export const canBuyStock = (data: WsRoomSyncData, userID: string) => {
  return data?.roomData.roomInfo.gameStatus === GameStatus.BUY_STOCK && data?.roomData.currentPlayer === userID;
};
export default function Room() {
  const { roomID } = useParams(); // 获取 URL 参数中的 roomID
  const [createCompanyModalVisible, setCreateCompanyModalVisible] = useState(false);
  const [buyStockModalVisible, setBuyStockModalVisible] = useState(false);
  const [gameEndModalVisible, setGameEndModalVisible] = useState(false);
  const [companyInfoVisible, setCompanyInfoVisible] = useState(false);
  const [mergeCompanyModalVisible, setMergeCompanyModalVisible] = useState(false);
  const [mergeSelectionModalVisible, setMergeSelectionModalVisible] = useState(false);
  const [data, setData] = useState<WsRoomSyncData>();
  const [hoveredTile, setHoveredTile] = useState<string | undefined>(undefined);
  const userID = getLocalStorageUserID();
  const audioMapRef = useRef<Record<string, HTMLAudioElement>>({});
  const [searchParams] = useSearchParams();
  const roomUserID = searchParams.get('roomUserID');
  const audioTypes = ['quickily', 'quickily1', 'quickily2', 'your-turn', 'create-company', 'buy-stock']; // 你可以继续扩展

  const waitingModalComtent = useMemo(() => {
    if (data?.roomData.roomInfo.roomStatus === false) {
      return '请等待其他玩家加入';
    }
    if (data?.roomData.roomInfo.gameStatus === GameStatus.MergingSettle && !getMergingModalAvailible(data, userID)) {
      const firstHoders = Object.entries(data?.tempData.mergeSettleData || {}).find(([_, val]) => {
        return val.hoders.length > 0;
      });
      return `请等待 ${getLocalStorageUserName(firstHoders?.[1].hoders[0] ?? '')} 结算`;
    }
    return '';
  }, [data]);

  useEffect(() => {
    const map: Record<string, HTMLAudioElement> = {};
    audioTypes.forEach((type) => {
      const audio = new Audio(`/${type}.mp3`);
      audio.load();
      map[type] = audio;
    });
    audioMapRef.current = map;
  }, []);

  const { sendMessage } = useWebSocket(`${wsUrl}/ws?roomID=${roomID}&userID=${userID}`, (msg) => {
    const data: WsRoomSyncData = JSON.parse(msg.data);
    if (data.type === 'error') {
      message.error(data.message);
      return;
    }
    if (data.type === 'audio') {
      const audioType = data.message;
      if (audioType) {
        const audio = audioMapRef.current[audioType];
        if (audio) {
          audio.currentTime = 0; // 重置到开头
          audio.play().catch((err: any) => {
            console.warn('音效播放失败（可能是用户未交互）', err);
          });
        }
      }
      return;
    }
    if (data.type === 'sync') {
      console.log('收到数据：', data);
      setData(data);
      if (getMergingModalAvailible(data, userID)) {
        setMergeCompanyModalVisible(true);
      } else {
        setMergeCompanyModalVisible(false);
      }
      if (userID === data.roomData.currentPlayer) {
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
        if (data.roomData.roomInfo.gameStatus === GameStatus.MergingSelection) {
          setMergeSelectionModalVisible(true);
        } else {
          setMergeSelectionModalVisible(false);
        }
      } else {
        setBuyStockModalVisible(false);
        setCreateCompanyModalVisible(false);
        setMergeSelectionModalVisible(false);
      }
    }
  });
  const canCreateCompany = () => {
    return data?.roomData.roomInfo.gameStatus === GameStatus.CREATE_COMPANY && userID === data.roomData.currentPlayer;
  }

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
    }) || data?.roomData?.roomInfo?.gameStatus === GameStatus.END || !Object.entries(data?.roomData.companyInfo ?? {}).some(([_, val]) => {
      return Number(val.tiles ?? 0) < 11 && Number(val.tiles ?? 0) !== 0
    });
  }, [data]);

  const currentPlayer = useMemo(() => {
    return data?.roomData.currentPlayer;
  }, [data?.roomData.currentPlayer])

  const currentStep = useMemo(() => {
    if (!data?.roomData.roomInfo.roomStatus) {
      return '等待其他玩家进入';
    }
    if (data?.roomData.roomInfo.gameStatus === GameStatus.END) {
      return '游戏结束';
    }
    if (currentPlayer === userID) {
      return GameStatusMap[data?.roomData.roomInfo.gameStatus];
    } else {
      return '请等待其他玩家操作';
    }
  }, [data, currentPlayer])

  useEffect(() => {
    if (currentPlayer === userID) {
      playAudio(audioMapRef, 'your-turn');
    }
  }, [currentPlayer, userID]);

  const renderButton = () => {
    if (!data) {
      return;
    }
    if (canCreateCompany()) {
      return (
        <Button
          type="primary"
          className={styles.buyStockBtn}
          disabled={!canCreateCompany()}
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
          className={styles.buyStockBtn}
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
          className={styles.buyStockBtn}
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
          className={styles.buyStockBtn}
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
    <>
      <div className={styles.roomContainer}>
        <div className={styles.topBar}>
          <div className={styles.left}>
            <div className={styles.IDs}>
              <div>房间号：{roomID}</div>
              <div>用户ID：{getLocalStorageUserName(userID)}</div>
            </div>
            <Button
              type="primary"
              className={styles.buyStockBtn}
              onClick={() => {
                setCompanyInfoVisible(true);
              }}
            >
              公司面板
            </Button>
            <Button
              type="primary"
              className={styles.buyStockBtn}
              style={{zIndex: 9999}}
              disabled={!isGameEnd}
              onClick={() => {
                setGameEndModalVisible(true);
              }}
            >
              结束清算
            </Button>
            {userID === roomUserID && <Button
              type="primary"
              className={styles.buyStockBtn}
              onClick={() => {
                Modal.confirm({
                  title: '确认操作',
                  content: '你确定要结束游戏吗？',
                  okText: '确认',
                  cancelText: '取消',
                  onOk: () => {
                    sendMessage(JSON.stringify({
                      type: 'game_end',
                    }));
                  },
                });
              }}
            >
              强制结束清算
            </Button>}
          </div>
          <div className={styles.middle}>
            {data?.roomData.roomInfo.roomStatus ? (
              currentPlayer === userID ? (
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
        <div className={styles.gameBoard}>
          <Board tilesData={data?.roomData.tiles} hoveredTile={hoveredTile} />
          {isTabletLandscape && <CompanyInfo
            setBuyStockModalVisible={setBuyStockModalVisible}
            setMergeCompanyModalVisible={setMergeCompanyModalVisible}
            data={data}
            userID={userID}
          />}
        </div>
        <div className={styles.assets}>
          {!isTabletLandscape && <CompanyInfo
            setBuyStockModalVisible={setBuyStockModalVisible}
            setMergeCompanyModalVisible={setMergeCompanyModalVisible}
            data={data}
            userID={userID}
          />}
          <div className={styles.bottomRight}>
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
                    {(data?.playerData.tiles || []).sort((a, b) => {
                      const [aRow, aCol] = a.match(/^(\d+)([A-Z])$/)!.slice(1);
                      const [bRow, bCol] = b.match(/^(\d+)([A-Z])$/)!.slice(1);
                      const rowDiff = Number(aRow) - Number(bRow);
                      if (rowDiff !== 0) return rowDiff;
                      return aCol.charCodeAt(0) - bCol.charCodeAt(0);
                    }).map((tileKey: string) => (
                      <span
                        className={styles.tile}
                        key={tileKey}
                        onMouseEnter={() =>
                          currentPlayer === userID &&
                          data?.roomData.roomInfo.gameStatus === GameStatus.SET_Tile &&
                          setHoveredTile(tileKey)
                        }
                        onMouseOut={() => {
                          currentPlayer === userID && setHoveredTile(undefined);
                        }}
                        onClick={() =>
                          currentPlayer === userID &&
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
            <div className={styles.message}>
              <MessageSender
                onMessageSend={(msg) => {
                  console.log("用户发送消息:", msg);
                  sendMessage(JSON.stringify({
                    type: 'play_audio',
                    payload: msg,
                  }));
                }}
              />
            </div>
          </div>
        </div>
      </div>
      <WaitingModal content={waitingModalComtent} />
      <GameEnd
        data={data}
        visible={gameEndModalVisible}
        setGameEndModalVisible={setGameEndModalVisible}
        sendMessage={sendMessage}
        userID={userID}
      />
      <CompanyStockInfoModal
        visible={companyInfoVisible}
        setCompanyInfoVisible={setCompanyInfoVisible}
      />
      <BuyStock
        visible={buyStockModalVisible}
        setBuyStockModalVisible={setBuyStockModalVisible}
        onSubmit={(modalData) => {
          // playAudio(audioMapRef, 'buy-stock');
          sendMessage(JSON.stringify({
            type: 'buy_stock',
            payload: modalData,
          }));
          setBuyStockModalVisible(false);
        }}
        data={data} />

      <MergeSelection
        visible={mergeSelectionModalVisible}
        data={data}
        onOk={(modalData) => {
          sendMessage(JSON.stringify({
            type: 'merging_selection',
            payload: modalData,
          }));
          setBuyStockModalVisible(false);
        }}
        onCancel={() => {
          setMergeSelectionModalVisible(false);
        }}
      />
      <CompanyStockActionModal
        visible={mergeCompanyModalVisible}
        data={data}
        onOk={(modalData) => {
          sendMessage(JSON.stringify({
            type: 'merging_settle',
            payload: modalData,
          }));
          setMergeCompanyModalVisible(false);
        }}
        onCancel={function (): void {
          setMergeCompanyModalVisible(false);
        }} />
      <CreateCompanyModal
        visible={createCompanyModalVisible}
        company={data?.roomData.companyInfo}
        onSelect={(company) => {
          playAudio(audioMapRef, 'create-company');
          sendMessage(JSON.stringify({
            type: 'create_company',
            payload: company,
          }));
          setCreateCompanyModalVisible(false);
        }}
        onCancel={() => {
          setCreateCompanyModalVisible(false);
        }}
      />
    </>
  );
}
