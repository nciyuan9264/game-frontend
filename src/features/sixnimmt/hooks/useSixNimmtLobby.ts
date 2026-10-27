import { useLobbyRooms } from '@/features/game-core/hooks/useLobbyRooms';
import { listSixNimmtRooms } from '../api/room';
import { roomOwnerName } from '../model/adapters';
import type { SixNimmtRoom } from '../model/types';

const loadRooms = async (signal: AbortSignal) =>
  (await listSixNimmtRooms(signal)).rooms ?? [];

export const useSixNimmtLobby = () => useLobbyRooms<SixNimmtRoom>({
  loadRooms,
  getOwnerName: roomOwnerName,
  mapError: (reason, timedOut) => ({
    message: timedOut
      ? '大厅请求超时，正在尝试重新连接。'
      : reason instanceof Error ? reason.message : '暂时无法连接大厅',
    code: '',
  }),
});
