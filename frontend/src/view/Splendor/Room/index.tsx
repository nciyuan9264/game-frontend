import { useEffect, useMemo, useRef, useState } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import styles from './index.module.less';
import { useNavigate, useParams } from 'react-router-dom';
import CardBoard from './components/CardBoard';
import { Button, message, Modal } from 'antd';
import { wsUrl } from '@/const/env';
import { getLocalStorageUserID, getLocalStorageUserName } from '@/util/user';
import MessageSender from './components/MessageSender';
import { useFullHeight } from '@/hooks/useFullHeight';
import { LeftOutlined } from '@ant-design/icons';
import PlayerData from './components/PlayerData';
import UserData from './components/UserData';
import GemSelect from './components/GemSelect';

export default function Room() {
  const { roomID } = useParams(); // 获取 URL 参数中的 roomID
  const [data, setData] = useState<SplendorWsRoomSyncData>();
  const [selectedCard, setSelectedCard] = useState<SplendorCard | undefined>();
  const userID = getLocalStorageUserID();
  const audioMapRef = useRef<Record<string, HTMLAudioElement>>({});
  const navigate = useNavigate();
  const audioTypes = ['quickily', 'quickily1', 'quickily2', 'your-turn', 'create-company', 'buy-stock']; // 你可以继续扩展

  // const waitingModalComtent = useMemo(() => {
  //   if (data?.roomData.roomInfo.roomStatus === false) {
  //     return '请等待其他玩家加入';
  //   }
  //   if (data?.roomData.roomInfo.gameStatus === GameStatus.MergingSettle && !getMergingModalAvailible(data, userID)) {
  //     const firstHoders = Object.entries(data?.tempData.mergeSettleData || {}).find(([_, val]) => {
  //       return val.hoders.length > 0;
  //     });
  //     return (
  //       <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
  //         <Alert
  //           message={`请等待 ${getLocalStorageUserName(firstHoders?.[1].hoders[0] ?? '')} 结算`}
  //           type="info"
  //           showIcon
  //         />
  //         {
  //           <div className={styles.settlementContainer}>
  //             <div className={styles.sectionTitle}>破产清算：被<CompanyTag company={data?.tempData?.merge_main_company_temp as CompanyKey} />合并的公司：</div>
  //             <div className={styles.companyList}>
  //               {
  //                 Object.entries(data?.tempData?.mergeSettleData ?? {}).map(([company, value]) => {
  //                   const companyName = company as CompanyKey;
  //                   const dividends = value.dividends;
  //                   return (
  //                     <div key={company} className={styles.companyCard} style={{ borderLeft: `4px solid ${CompanyColor[companyName]}` }}>
  //                       <CompanyTag company={companyName as CompanyKey} />
  //                       {
  //                         Object.entries(dividends)
  //                           .sort(([, a], [, b]) => Number(b) - Number(a)) // 按金额降序排列
  //                           .map(([key, value]) => (
  //                             <div key={key} className={styles.dividendRow}>
  //                               <div className={styles.name}>{getLocalStorageUserName(key)} 获得现金：</div>
  //                               <div className={styles.amount}>${value}</div>
  //                             </div>
  //                           ))
  //                       }
  //                     </div>
  //                   )
  //                 })
  //               }
  //             </div>
  //           </div>
  //         }
  //       </div>)
  //   }
  //   return '';
  // }, [data]);

  useEffect(() => {
    const map: Record<string, HTMLAudioElement> = {};
    audioTypes.forEach((type) => {
      const audio = new Audio(`/${type}.mp3`);
      audio.load();
      map[type] = audio;
    });
    audioMapRef.current = map;
  }, []);

  const { sendMessage, wsRef } = useWebSocket(`${wsUrl}/splendor/ws?roomID=${roomID}&userID=${userID}`, (msg) => {
    const data: SplendorWsRoomSyncData = JSON.parse(msg.data);
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
      setSelectedCard(undefined)
      setData(data);
    }
  });

  const currentPlayer = useMemo(() => {
    return data?.roomData.currentPlayer;
  }, [data?.roomData.currentPlayer])

  useFullHeight(styles.roomContainer);

  return (
    <>
      <div className={styles.roomContainer}>
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
                    // 假设 ws 是你的 WebSocket 实例
                    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                      wsRef.current.close(); // ✅ 主动关闭连接
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
              <div>房间号：{roomID}</div>
              <div>用户ID：{getLocalStorageUserName(userID)}</div>
            </div>
            <Button
              type="primary"
              style={{ zIndex: 9999 }}
              disabled={!true}
              onClick={() => {
                // setGameEndModalVisible(true);
              }}
            >
              结束清算
            </Button>
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
        </div>
        <div className={styles.gameBoard}>
          <CardBoard
            data={data}
            sendMessage={sendMessage}
            selectedCard={selectedCard}
            setSelectedCard={setSelectedCard}
          />
          <PlayerData data={data} userID={userID} />
        </div>
        <div className={styles.gemSelect}>
          <GemSelect data={data}
            sendMessage={sendMessage}
            selectedCard={selectedCard}
            setSelectedCard={setSelectedCard}
          />
        </div>
        <div className={styles.assets}>
          <div className={styles.bottomRight}>
            <div className={styles.playerAssets}>
              <UserData
                data={data}
                userID={userID}
                selectedCard={selectedCard}
                setSelectedCard={setSelectedCard}
              />
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
      </div>
      {/* <WaitingModal content={waitingModalComtent} /> */}
    </>
  );
}
