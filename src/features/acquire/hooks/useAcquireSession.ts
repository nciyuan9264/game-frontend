import { useCallback, useState } from 'react';
import { gameWsUrl } from '@/const/env';
import { useAuthoritativeSession } from '@/features/game-core/hooks/useAuthoritativeSession';
import { useGameConnection } from '@/features/game-core/hooks/useGameConnection';
import {
  createClientCommand,
  createGameWebSocketURL,
} from '@/features/game-core/model/realtime';
import { confirmsCommand } from '../model/selectors';
import {
  parseServerMessage,
  phaseKey,
  playerName,
  type CommandPayload,
  type CommandType,
  type ServerMessage,
  type Snapshot,
} from '../model/session';

const createEmptyPayload = (): CommandPayload => ({});
const getWaitingKey = (snapshot: Snapshot | undefined, epoch: number) =>
  snapshot?.type === 'ROOM_SYNC' && snapshot.roomData.gameStatus === 'waiting'
    ? `${phaseKey(snapshot)}:${epoch}`
    : '';
const useConnection = (
  url: string,
  receive: (message: ServerMessage, epoch: number) => void,
) => useGameConnection(url, receive, parseServerMessage);
const createCommand = (
  matchID: string,
  commandID: string,
  type: CommandType,
  payload: CommandPayload,
) => createClientCommand('acquire', matchID, commandID, type, payload);

export function useAcquireSession(
  roomID: string,
  matchID: string,
  onMatchChanged?: (matchID: string) => void,
) {
  const [activity, setActivity] = useState<string[]>([]);
  const onAcceptedSnapshot = useCallback(({
    previous,
    next,
    epoch,
    previousEpoch,
  }: {
    previous?: Snapshot;
    next: Snapshot;
    epoch: number;
    previousEpoch?: number;
  }) => {
    if (previousEpoch === epoch && previous?.type === 'ROOM_SYNC' && next.type === 'ROOM_SYNC') {
      const changes: string[] = [];
      const placed = Object.keys(next.roomData.tiles).find(key =>
        !previous.roomData.tiles[key]?.belong && next.roomData.tiles[key].belong);
      if (placed) {
        changes.push(`${playerName(previous.roomData.currentPlayer, next.roomData.players)} 落地 ${placed}`);
      }
      for (const [name, company] of Object.entries(next.roomData.companyInfo)) {
        if (company.tiles > 0 && !previous.roomData.companyInfo[name as keyof typeof previous.roomData.companyInfo]?.tiles)
          changes.push(`${name} 成立`);
      }
      if (next.roomData.gameStatus === 'end' && previous.roomData.gameStatus !== 'end') {
        changes.push('对局结束，结算已生成');
      }
      if (changes.length) setActivity(items => [...changes.reverse(), ...items].slice(0, 8));
    } else if (next.type === 'MATCH_SYNC') {
      setActivity([]);
    }
  }, []);
  const session = useAuthoritativeSession<
    Snapshot,
    ServerMessage,
    CommandType,
    CommandPayload,
    ReturnType<typeof useConnection>
  >({
    roomID,
    url: createGameWebSocketURL(gameWsUrl, roomID, matchID),
    useConnection,
    confirmsCommand,
    createEmptyPayload,
    getWaitingKey,
    readyCommand: 'game_ready',
    createCommand,
    confirmationOrder: 'snapshot-first',
    onAcceptedSnapshot,
    onMatchChanged,
  });
  return { ...session, activity };
}
export type AcquireSession = ReturnType<typeof useAcquireSession>;
