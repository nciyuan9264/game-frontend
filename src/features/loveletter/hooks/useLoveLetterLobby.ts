import { useLobbyRooms } from '@/features/game-core/hooks/useLobbyRooms';
import { listLoveLetterRooms } from '../api/room';
import { roomOwnerName } from '../model/adapters';
import type { LoveLetterRoom } from '../model/types';

const loadRooms = async (signal: AbortSignal) =>
  (await listLoveLetterRooms(signal)).rooms ?? [];

const mapError = (reason: unknown, timedOut: boolean) => ({
  message: timedOut
    ? '大厅请求超时，正在尝试重新连接。'
    : reason instanceof Error ? reason.message : '暂时无法连接大厅',
  code: '',
});

export const useLoveLetterLobby = () => useLobbyRooms<LoveLetterRoom>({
  loadRooms,
  getOwnerName: roomOwnerName,
  mapError,
});
