import { useLobbyRooms } from '@/features/game-core/hooks/useLobbyRooms';
import { listHiveRooms } from '../api/room';
import { roomOwnerName } from '../model/adapters';
import type { HiveRoom } from '../model/types';

const loadRooms = async (signal: AbortSignal) =>
  (await listHiveRooms(signal)).rooms ?? [];

export function useHiveLobby() {
  return useLobbyRooms<HiveRoom>({
    loadRooms,
    getOwnerName: roomOwnerName,
  });
}
