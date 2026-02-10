import { FC, useEffect, useMemo } from 'react';
import styles from './index.module.less';
import { Header } from './components/Header';
import PlayerCard from './components/PlayerCard';
import { WsMatchSyncData } from '@/types/room';
import { Role, Seat } from './types';
import { useNavigate } from 'react-router-dom';
import { GameStatus } from '@/enum/game';

interface IGameProps {
  sendMessage: (msg: string) => void;
  wsRef: React.RefObject<WebSocket>;
  wsMatchSyncData?: WsMatchSyncData;
  userID: string;
}

export const Match: FC<IGameProps> = ({ sendMessage, wsRef, wsMatchSyncData, userID }: IGameProps) => {
  const isOwner = useMemo(() => wsMatchSyncData?.room?.ownerID === userID, [wsMatchSyncData, userID])
  const currentPlayerData = useMemo(() => wsMatchSyncData?.room?.players?.[userID], [wsMatchSyncData, userID])
  const isAllReady = useMemo(() => Object.values(wsMatchSyncData?.room?.players || {}).every((player) => player.ready) && Object.values(wsMatchSyncData?.room?.players || {}).length > 1, [wsMatchSyncData])
  const navigate = useNavigate();

  useEffect(() => {
    if (!wsMatchSyncData?.room.players?.[userID]) {
      navigate('/game/acquire');
      return;
    }
  }, [wsMatchSyncData, navigate])

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // 现代浏览器中无需设置 e.returnValue，直接调用 preventDefault 即可
      return '';
    };

    if (isOwner && wsMatchSyncData?.room?.status === GameStatus.MATCH) {
      window.addEventListener('beforeunload', handler);
    }

    return () => {
      window.removeEventListener('beforeunload', handler);
    };
  }, []);

  const seats = useMemo(() => {
    if (!wsMatchSyncData?.room?.players) {
      return [];
    }
    const players = wsMatchSyncData.room.players;
    const totalSeats = 6;
    const seatList: Seat[] = [];

    // Separate players into real players and AI players
    const realPlayers = Object.values(players).filter(player => !player.ai);
    const aiPlayers = Object.values(players).filter(player => player.ai);

    // Add real players first (keeping host at index 0)
    realPlayers.forEach((player, index) => {
      seatList.push({
        id: `player-${index}`,
        label: player.playerID,
        role: player.playerID === wsMatchSyncData.room.ownerID ? Role.Host : Role.Player,
        isReady: player.ready,
      });
    });

    // Add AI players after real players
    aiPlayers.forEach((player, index) => {
      seatList.push({
        id: `ai-${index}`,
        label: player.playerID,
        role: Role.Player,
        isReady: player.ready,
      });
    });

    // Add empty seats for remaining slots
    const emptySeatsNeeded = totalSeats - Object.values(players).length;
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

  const firstEmptySeatIndex = useMemo(() => {
    return seats.findIndex(seat => !seat.label);
  }, [seats]);

  return (
    <div className={styles.match}>
      <Header isHostView={isOwner} wsRef={wsRef} currentPlayerData={currentPlayerData} isAllReady={isAllReady} sendMessage={sendMessage} />
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
}