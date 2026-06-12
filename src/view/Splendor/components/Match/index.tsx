import { FC, useEffect, useMemo } from 'react';
import styles from './index.module.less';
import { Header } from './components/Header';
import PlayerCard from './components/PlayerCard';
import { SplendorWsMatchSyncData } from '@/types/SplendorRoom';
import { Role, Seat } from './types';
import { useNavigate } from 'react-router-dom';

interface IMatchProps {
  sendMessage: (msg: string) => void;
  wsRef: React.RefObject<WebSocket>;
  wsMatchSyncData?: SplendorWsMatchSyncData;
  userID: string;
}

const TOTAL_SEATS = 4;

export const Match: FC<IMatchProps> = ({ sendMessage, wsRef, wsMatchSyncData, userID }: IMatchProps) => {
  const isOwner = useMemo(() => wsMatchSyncData?.ownerID === userID, [wsMatchSyncData, userID]);
  const currentPlayerData = useMemo(() => wsMatchSyncData?.players?.[userID], [wsMatchSyncData, userID]);
  const isAllReady = useMemo(
    () =>
      Object.values(wsMatchSyncData?.players || {}).every((player) => player.ready) &&
      Object.values(wsMatchSyncData?.players || {}).length > 1,
    [wsMatchSyncData]
  );
  const navigate = useNavigate();

  useEffect(() => {
    if (!wsMatchSyncData?.players?.[userID]) {
      navigate('/game/splendor');
    }
  }, [wsMatchSyncData, navigate, userID]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      return '';
    };

    if (isOwner && wsMatchSyncData?.status === 'match') {
      window.addEventListener('beforeunload', handler);
    }

    return () => {
      window.removeEventListener('beforeunload', handler);
    };
  }, []);

  const seats = useMemo(() => {
    if (!wsMatchSyncData?.players) {
      return [];
    }
    const players = wsMatchSyncData.players;
    const seatList: Seat[] = [];

    const realPlayers = Object.values(players).filter((player) => !player.ai);
    const aiPlayers = Object.values(players).filter((player) => player.ai);

    realPlayers.forEach((player, index) => {
      seatList.push({
        id: `player-${index}`,
        label: player.playerID,
        role: player.playerID === wsMatchSyncData.ownerID ? Role.Host : Role.Player,
        isReady: player.ready,
      });
    });

    aiPlayers.forEach((player, index) => {
      seatList.push({
        id: `ai-${index}`,
        label: player.playerID,
        role: Role.Player,
        isReady: player.ready,
      });
    });

    const emptySeatsNeeded = TOTAL_SEATS - Object.values(players).length;
    for (let i = 0; i < emptySeatsNeeded; i++) {
      seatList.push({
        id: `empty-${i}`,
        label: '',
        role: Role.Empty,
        isReady: false,
      });
    }

    return seatList;
  }, [wsMatchSyncData]);

  const firstEmptySeatIndex = useMemo(() => seats.findIndex((seat) => !seat.label), [seats]);

  return (
    <div className={styles.match}>
      <Header
        isHostView={isOwner}
        wsRef={wsRef}
        currentPlayerData={currentPlayerData}
        isAllReady={isAllReady}
        sendMessage={sendMessage}
      />
      <div className={styles.seatGrid}>
        {seats?.map((player, index) => (
          <PlayerCard
            key={index}
            data={player}
            userID={userID}
            wsMatchSyncData={wsMatchSyncData}
            sendMessage={sendMessage}
            canAddAI={index === firstEmptySeatIndex}
          />
        ))}
      </div>
    </div>
  );
};
