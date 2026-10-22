import { useLobbyRooms } from '@/features/game-core/hooks/useLobbyRooms';
import { AcquireRequestError, listRooms } from '../api/room';
import { roomOwnerName } from '../model/adapters';
import type { AcquireRoom } from '../model/types';

const loadRooms = async (signal: AbortSignal) => (await listRooms(signal)).rooms ?? [];
const mapError = (reason: unknown, timedOut: boolean) => ({
  message: timedOut
    ? '大厅请求超时，正在尝试重新连接。'
    : reason instanceof Error ? reason.message : '暂时无法连接大厅',
  code: reason instanceof AcquireRequestError ? reason.code ?? String(reason.status) : '',
});

export function useAcquireLobby() {
  return useLobbyRooms<AcquireRoom>({
    loadRooms,
    getOwnerName: roomOwnerName,
    mapError,
  });
}
