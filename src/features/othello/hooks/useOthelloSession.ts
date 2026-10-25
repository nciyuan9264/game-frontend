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
  type CommandType,
  type ServerMessage,
  type Snapshot,
} from '../model/session';

const createEmptyPayload = (): unknown => ({});
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
  payload: unknown,
) => createClientCommand('othello', matchID, commandID, type, payload);

export function useOthelloSession(roomID: string, matchID: string) {
  return useAuthoritativeSession<
    Snapshot,
    ServerMessage,
    CommandType,
    unknown,
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
  });
}

export type OthelloSession = ReturnType<typeof useOthelloSession>;
