import { useLobbyRooms } from '@/features/game-core/hooks/useLobbyRooms';
import { listFugitiveRooms } from '../api/room';
import { roomOwnerName } from '../model/adapters';
import type { FugitiveRoom } from '../model/types';

const loadRooms = async (signal: AbortSignal) =>
  (await listFugitiveRooms(signal)).rooms ?? [];

export function useFugitiveLobby() {
  return useLobbyRooms<FugitiveRoom>({
    loadRooms,
    getOwnerName: roomOwnerName,
  });
}
