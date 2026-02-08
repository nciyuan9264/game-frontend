import { useMemo, useState } from 'react';
import { useProfile } from '@/hooks/request/useProfile';
import { useWebSocket } from '@/hooks/useWebSocket';
import { WsMatchSyncData, WsRoomSyncData } from '@/types/room';
import { profile2BackendName } from '@/util/user';
import { useUrlParams } from '@/hooks/useUrlParams';
import { message } from 'antd';
import { useAudio } from '@/hooks/useAudio';
import { getMergingModalAvailible, isDataEqual } from './components/Game/utils/game';
import { GameStatus } from '@/enum/game';

import { Game } from './components/Game';
import { Match } from './components/Match';

import styles from './index.module.less';
import { wsUrl } from '@/const/env';
import { LoadingBlock } from '@/components/LoadingBlock';

export const Acquire: React.FC = () => {
  const { roomID } = useUrlParams();
  const { userProfile, profileLoading } = useProfile();
  const userID = profile2BackendName(userProfile);
  const [wsMatchSyncData, setWsMatchSyncData] = useState<WsMatchSyncData>();
  const [wsRoomSyncData, setWsRoomSyncData] = useState<WsRoomSyncData>();
  const [buyStockModalVisible, setBuyStockModalVisible] = useState(false);
  const [mergeCompanyModalVisible, setMergeCompanyModalVisible] = useState(false);
  const [mergeSelectionModalVisible, setMergeSelectionModalVisible] = useState(false);
  const [createCompanyModalVisible, setCreateCompanyModalVisible] = useState(false);
  const { playAudio } = useAudio();
  const url: string = useMemo(() => {
    if (!roomID || !userID) return '';
    return `${wsUrl}/acquire/ws?roomID=${roomID}&userID=${userID}`;
  }, [roomID, userID]);

  const { wsRef, sendMessage } = useWebSocket(url, (msg) => {
    const newData: WsMatchSyncData | WsRoomSyncData = JSON.parse(msg.data);
    if (newData.type === 'error') {
      message.error(newData.message);
      setWsMatchSyncData(undefined);
      setWsRoomSyncData(undefined);
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
      console.log('newData', matchData);
      setWsMatchSyncData(matchData)
      setWsRoomSyncData(undefined);
    }
    if (newData.type === 'ROOM_SYNC') {
      setWsMatchSyncData(undefined);
      const roomData: WsRoomSyncData = newData as WsRoomSyncData;
      // 只有当数据真正发生变化时，才保存上一次的数据
      if (wsRoomSyncData && !isDataEqual(wsRoomSyncData, roomData)) {
        localStorage.setItem(`room_${roomID}_prevData`, JSON.stringify(roomData));
        console.log('数据发生变化，保存上一次数据到localStorage');
      }

      setWsRoomSyncData(roomData);

      // ... 其他逻辑保持不变
      if (getMergingModalAvailible(roomData, userID)) {
        setMergeCompanyModalVisible(true);
      } else {
        setMergeCompanyModalVisible(false);
      }
      if (userID === roomData.roomData.currentPlayer) {
        if (roomData.roomData.roomInfo.gameStatus === GameStatus.CREATE_COMPANY) {
          setCreateCompanyModalVisible(true);
        } else {
          setCreateCompanyModalVisible(false);
        }
        if (roomData.roomData.roomInfo.gameStatus === GameStatus.BUY_STOCK) {
          setBuyStockModalVisible(true);
        } else {
          setBuyStockModalVisible(false);
        }
        if (roomData.roomData.roomInfo.gameStatus === GameStatus.MergingSelection) {
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
  });;

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
          buyStockModalVisible={buyStockModalVisible}
          setBuyStockModalVisible={setBuyStockModalVisible}
          mergeCompanyModalVisible={mergeCompanyModalVisible}
          setMergeCompanyModalVisible={setMergeCompanyModalVisible}
          mergeSelectionModalVisible={mergeSelectionModalVisible}
          setMergeSelectionModalVisible={setMergeSelectionModalVisible}
          createCompanyModalVisible={createCompanyModalVisible}
          setCreateCompanyModalVisible={setCreateCompanyModalVisible}
        />
      }
    </div>
  );
}