import { useLobbyRooms } from '@/features/game-core/hooks/useLobbyRooms';
import { listDavinciRooms } from '../api/room';
import { roomOwnerName } from '../model/adapters';
import type { DavinciRoom } from '../model/types';

const loadRooms = async (signal: AbortSignal) => (await listDavinciRooms(signal)).rooms ?? [];

export function useDavinciLobby() {
  return useLobbyRooms<DavinciRoom>({
    loadRooms,
    getOwnerName: roomOwnerName,
  });
}
