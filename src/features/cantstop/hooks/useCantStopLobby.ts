import { useLobbyRooms } from '@/features/game-core/hooks/useLobbyRooms';
import { listCantStopRooms } from '../api/room';
import { roomOwnerName } from '../model/adapters';
import type { CantStopRoom } from '../model/types';

const loadRooms = async (signal: AbortSignal) =>
  (await listCantStopRooms(signal)).rooms ?? [];

const mapError = (reason: unknown, timedOut: boolean) => ({
  message: timedOut
    ? '大厅请求超时，正在尝试重新连接。'
    : reason instanceof Error ? reason.message : '暂时无法连接大厅',
  code: '',
});

export const useCantStopLobby = () => useLobbyRooms<CantStopRoom>({
  loadRooms,
  getOwnerName: roomOwnerName,
  mapError,
});
