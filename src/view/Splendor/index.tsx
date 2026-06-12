import { useMemo, useState } from 'react';
import { useProfile } from '@/hooks/request/useProfile';
import { useWebSocket } from '@/hooks/useWebSocket';
import { SplendorWsMatchSyncData, SplendorWsRoomSyncData } from '@/types/SplendorRoom';
import { profile2BackendName } from '@/util/user';
import { useUrlParams } from '@/hooks/useUrlParams';
import { message } from 'antd';
import { useAudio } from '@/hooks/useAudio';
import { SplendorGameStatus } from '@/enum/game';

import { Game } from './components/Game';
import { Match } from './components/Match';

import styles from './index.module.less';
import { splendorWsUrl } from '@/const/env';
import { LoadingBlock } from '@/components/LoadingBlock';
import { useNavigate } from 'react-router-dom';

export default function Splendor() {
  const { roomID } = useUrlParams();
  const { userProfile, profileLoading } = useProfile();
  const userID = profile2BackendName(userProfile);
  const [wsMatchSyncData, setWsMatchSyncData] = useState<SplendorWsMatchSyncData>();
  const [wsRoomSyncData, setWsRoomSyncData] = useState<SplendorWsRoomSyncData>();
  const [gameEndModalVisible, setGameEndModalVisible] = useState(false);
  const navigate = useNavigate();
  const { playAudio } = useAudio();

  const url: string = useMemo(() => {
    if (!roomID || !userID) return '';
    return `${splendorWsUrl}/ws?roomID=${roomID}&userID=${userID}`;
  }, [roomID, userID]);

  const { wsRef, sendMessage } = useWebSocket(url, (msg) => {
    const newData: SplendorWsMatchSyncData | SplendorWsRoomSyncData = JSON.parse(msg.data);
    if (newData.type === 'error') {
      message.error(newData.message);
      setWsMatchSyncData(undefined);
      setWsRoomSyncData(undefined);
      if (newData.message === '你已被移出房间') {
        navigate('/game/splendor');
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
      setWsMatchSyncData(newData as SplendorWsMatchSyncData);
      setWsRoomSyncData(undefined);
      return;
    }
    if (newData.type === 'sync') {
      setWsMatchSyncData(undefined);
      const roomData = newData as SplendorWsRoomSyncData;
      setWsRoomSyncData(roomData);
      if (roomData.roomData.roomInfo.gameStatus === SplendorGameStatus.END) {
        setGameEndModalVisible(true);
      } else {
        setGameEndModalVisible(false);
      }
    }
  });

  return (
    <div className={styles.splendor}>
      {
        ((!wsMatchSyncData && !wsRoomSyncData) || profileLoading) && (
          <LoadingBlock content="正在加载游戏房间数据，请稍候..." />
        )
      }
      {
        wsMatchSyncData && (
          <Match
            sendMessage={sendMessage}
            wsRef={wsRef}
            wsMatchSyncData={wsMatchSyncData}
            userID={userID}
          />
        )
      }
      {
        wsRoomSyncData && (
          <Game
            sendMessage={sendMessage}
            wsRef={wsRef}
            wsRoomSyncData={wsRoomSyncData}
            userID={userID}
            gameEndModalVisible={gameEndModalVisible}
            setGameEndModalVisible={setGameEndModalVisible}
          />
        )
      }
    </div>
  );
}
