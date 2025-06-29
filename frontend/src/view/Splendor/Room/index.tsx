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
import WaitingModal from '../../../components/Waiting';
import { SplendorGameStatus } from '@/enum/game';
import GameEnd from './components/GameEnd';
import { AudioTypeEnum, useAudio } from '@/hooks/useAudio';

export default function Room() {
  const { roomID } = useParams();
  const userID = getLocalStorageUserID();
  const [data, setData] = useState<SplendorWsRoomSyncData>();
  const [gameEndModalVisible, setGameEndModalVisible] = useState(false);
  const [selectedCard, setSelectedCard] = useState<SplendorCard | undefined>();
  const audioMapRef = useRef<Record<string, HTMLAudioElement>>({});
  const navigate = useNavigate();
  const { playAudio } = useAudio();
  const waitingModalComtent = useMemo(() => {
    if (data?.roomData.roomInfo.roomStatus === false) {
      return '请等待其他玩家加入';
    }
    return '';
  }, [data]);

  useEffect(() => {
    if (data?.roomData.currentPlayer === userID) {
      playAudio(AudioTypeEnum.YourTurn);
    }
  }, [data?.roomData.currentPlayer, userID]);

  const { sendMessage, wsRef } = useWebSocket(`${wsUrl}/ws?roomID=${roomID}&userID=${userID}`, (msg) => {
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
      if (data.roomData.roomInfo.gameStatus === SplendorGameStatus.END) {
        setGameEndModalVisible(true);
      }
      setSelectedCard(undefined)
      setData(data);
    }
  });

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
                    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                      wsRef.current.close(); // ✅ 主动关闭连接
                    }
                    setTimeout(() => {
                      navigate('/game/splendor');
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
              disabled={data?.roomData.roomInfo.gameStatus !== SplendorGameStatus.END}
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
                <span className={styles.yourTurn}>你的回合{`${data.roomData.roomInfo.gameStatus === SplendorGameStatus.LAST_TURN ? '(最后一回合)' : ''}`}</span>
              ) : (
                <>
                  请等待
                  <span className={styles.playerName}>{getLocalStorageUserName(data.roomData.currentPlayer)}</span>
                  操作
                  {`${data.roomData.roomInfo.gameStatus === SplendorGameStatus.LAST_TURN ? '(最后一回合)' : ''}`}
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
      <WaitingModal content={waitingModalComtent} />
      <GameEnd
        data={data}
        visible={gameEndModalVisible}
        setGameEndModalVisible={setGameEndModalVisible}
        sendMessage={sendMessage}
        userID={userID} />
    </>
  );
}
