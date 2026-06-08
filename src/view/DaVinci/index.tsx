import { useMemo, useState } from 'react';
import { useProfile } from '@/hooks/request/useProfile';
import { useWebSocket } from '@/hooks/useWebSocket';
import {  WsMatchSyncData, WsRoomSyncData } from '@/types/DaVinicRoom';
import { profile2BackendName } from '@/util/user';
import { useUrlParams } from '@/hooks/useUrlParams';
import { message } from 'antd';
import { useAudio } from '@/hooks/useAudio';

import { Game } from './components/Game';
import { Match } from './components/Match';

import styles from './index.module.less';
import { wsUrl } from '@/const/env';
import { LoadingBlock } from '@/components/LoadingBlock';
import { useNavigate } from 'react-router-dom';

export default function DaVinci() {
  const { roomID } = useUrlParams();
  const { userProfile, profileLoading } = useProfile();
  const userID = profile2BackendName(userProfile);
  const [wsMatchSyncData, setWsMatchSyncData] = useState<WsMatchSyncData>();
  const [wsRoomSyncData, setWsRoomSyncData] = useState<WsRoomSyncData>();
  const [gameEndModalVisible, setGameEndModalVisible] = useState(false);
  const navigate = useNavigate();
  const { playAudio } = useAudio();
  const url: string = useMemo(() => {
    if (!roomID || !userID) return '';
    return `${wsUrl}ws?roomID=${roomID}&userID=${userID}`;
  }, [roomID, userID]);

  const { wsRef, sendMessage } = useWebSocket(url, (msg) => {
    const newData: WsMatchSyncData | WsRoomSyncData = JSON.parse(msg.data);
    if (newData.type === 'error') {
      message.error(newData.message);
      setWsMatchSyncData(undefined);
      setWsRoomSyncData(undefined);
      if(newData.message === '你已被移出房间'){
        navigate('/game/davinci');
      }
      return;
    }
    if (newData.type === 'audio') {
      const audioType = newData.message;
      if (audioType) {
        playAudio(audioType);
      }
      return;
    }
    if (newData.type === 'MATCH_SYNC') {
      const matchData: WsMatchSyncData = newData as WsMatchSyncData;
      setWsMatchSyncData(matchData)
      setWsRoomSyncData(undefined);
    }
    if (newData.type === 'ROOM_SYNC') {
      setWsMatchSyncData(undefined);
      const roomData: WsRoomSyncData = newData as WsRoomSyncData;
      setWsRoomSyncData(roomData);
      if (roomData.roomData.gameStatus === 'end') {
        setGameEndModalVisible(true);
      } else {
        setGameEndModalVisible(false);
      }
    }
  });

  return (
    <div className={styles.acquire}>
      {
        (!wsMatchSyncData && !wsRoomSyncData) || profileLoading && <LoadingBlock content="正在加载游戏房间列表，请稍候..." />
      }
      {
        wsMatchSyncData && <Match
          sendMessage={sendMessage}
          wsRef={wsRef}
          wsMatchSyncData={wsMatchSyncData}
          userID={userID}
        />}
      {
        wsRoomSyncData && <Game
          sendMessage={sendMessage}
          wsRef={wsRef}
          wsRoomSyncData={wsRoomSyncData}
          userID={userID}
          gameEndModalVisible={gameEndModalVisible}
          setGameEndModalVisible={setGameEndModalVisible}
        />
      }
    </div>
  );
}