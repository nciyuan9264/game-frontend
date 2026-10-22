import { useLobbyRooms } from '@/features/game-core/hooks/useLobbyRooms';
import { listSplendorRooms } from '../api/room';
import { roomOwnerName } from '../model/adapters';
import type { SplendorRoom } from '../model/types';

const loadRooms = async (signal: AbortSignal) => (await listSplendorRooms(signal)).rooms ?? [];

export function useSplendorLobby() {
  return useLobbyRooms<SplendorRoom>({
    loadRooms,
    getOwnerName: roomOwnerName,
  });
}
