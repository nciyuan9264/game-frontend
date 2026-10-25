import { useLobbyRooms } from '@/features/game-core/hooks/useLobbyRooms';
import { listYinshRooms } from '../api/room';
import { roomOwnerName } from '../model/adapters';
import type { YinshRoom } from '../model/types';

const loadRooms = async (signal: AbortSignal) =>
  (await listYinshRooms(signal)).rooms ?? [];

export function useYinshLobby() {
  return useLobbyRooms<YinshRoom>({
    loadRooms,
    getOwnerName: roomOwnerName,
  });
}
