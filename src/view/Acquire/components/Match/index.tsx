import { FC, useMemo } from 'react';
import styles from './index.module.less';
import { Header } from './components/Header';
import PlayerCard from './components/PlayerCard';
import { WsMatchSyncData } from '@/types/room';
import { Role, Seat } from './types';

interface IGameProps {
  sendMessage: (msg: string) => void;
  wsRef: React.RefObject<WebSocket>;
  wsMatchSyncData?: WsMatchSyncData;
  userID: string;
}

export const Match: FC<IGameProps> = ({ sendMessage, wsRef, wsMatchSyncData, userID }: IGameProps) => {
  const isHostView = useMemo(() => wsMatchSyncData?.room?.ownerID === userID, [wsMatchSyncData, userID])
  const currentPlayerData = useMemo(() => wsMatchSyncData?.room?.players?.find((player) => player.playerID === userID), [wsMatchSyncData, userID])
  const isAllReady = useMemo(() => wsMatchSyncData?.room?.players?.every((player) => player.ready) && wsMatchSyncData?.room?.players?.length > 1, [wsMatchSyncData])

  const seats = useMemo(() => {
    if (!wsMatchSyncData?.room?.players) {
      return [];
    }
    const players = wsMatchSyncData.room.players;
    const totalSeats = 6;
    const seatList: Seat[] = [];

    // Add player seats
    players.forEach((player, index) => {
      seatList.push({
        id: `player-${index}`,
        label: player.playerID,
        role: index === 0 ? Role.Host : Role.Player,
        isReady: player.ready,
      });
    });

    // Add empty seats for remaining slots
    const emptySeatsNeeded = totalSeats - players.length;
    for (let i = 0; i < emptySeatsNeeded; i++) {
      seatList.push({
        id: `empty-${i}`,
        label: '',
        role: Role.Empty,
        isReady: false,
      });
    }

    return seatList;
  }, [wsMatchSyncData])

  return (
    <div className={styles.match}>
      <Header isHostView={isHostView} wsRef={wsRef} currentPlayerData={currentPlayerData} isAllReady={isAllReady} sendMessage={sendMessage} />
      <div className={styles.seatGrid}>
        {seats?.map(player => (
          <PlayerCard
            key={player.id}
            data={player}
            userID={userID}
            wsMatchSyncData={wsMatchSyncData}
            sendMessage={sendMessage}
          />
        ))}
      </div>
    </div>
  );
}