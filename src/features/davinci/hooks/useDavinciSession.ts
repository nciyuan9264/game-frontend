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
  type CommandPayload,
  type CommandType,
  type ServerMessage,
  type Snapshot,
} from '../model/session';

const createEmptyPayload = (): CommandPayload => ({});
const getWaitingKey = (snapshot: Snapshot | undefined, epoch: number) =>
  snapshot?.type === 'ROOM_SYNC' && snapshot.roomData.gameStatus === 'waiting'
    ? `${snapshot.roomID}:${snapshot.seq}:${epoch}`
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
) => createClientCommand('davinci', matchID, commandID, type, payload);

export function useDavinciSession(
  roomID: string,
  matchID: string,
  onMatchChanged?: (matchID: string) => void,
) {
  return useAuthoritativeSession<
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
    onMatchChanged,
  });
}

export type DavinciSession = ReturnType<typeof useDavinciSession>;
