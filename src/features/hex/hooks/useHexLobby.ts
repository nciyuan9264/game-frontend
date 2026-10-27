import { useLobbyRooms } from '@/features/game-core/hooks/useLobbyRooms';
import { listHexRooms } from '../api/room';
import { roomOwnerName } from '../model/adapters';
import type { HexRoom } from '../model/types';

const loadRooms = async (signal: AbortSignal) =>
  (await listHexRooms(signal)).rooms ?? [];

export function useHexLobby() {
  return useLobbyRooms<HexRoom>({
    loadRooms,
    getOwnerName: roomOwnerName,
  });
}
