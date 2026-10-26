import { useLobbyRooms } from '@/features/game-core/hooks/useLobbyRooms';
import { listQuoridorRooms } from '../api/room';
import { roomOwnerName } from '../model/adapters';
import type { QuoridorRoom } from '../model/types';

const loadRooms = async (signal: AbortSignal) =>
  (await listQuoridorRooms(signal)).rooms ?? [];

export function useQuoridorLobby() {
  return useLobbyRooms<QuoridorRoom>({
    loadRooms,
    getOwnerName: roomOwnerName,
  });
}
