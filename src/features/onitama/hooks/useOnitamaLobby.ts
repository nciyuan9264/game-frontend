import { useLobbyRooms } from '@/features/game-core/hooks/useLobbyRooms';
import { listOnitamaRooms } from '../api/room';
import { roomOwnerName } from '../model/adapters';
import type { OnitamaRoom } from '../model/types';

const loadRooms = async (signal: AbortSignal) =>
  (await listOnitamaRooms(signal)).rooms ?? [];

export function useOnitamaLobby() {
  return useLobbyRooms<OnitamaRoom>({
    loadRooms,
    getOwnerName: roomOwnerName,
  });
}
