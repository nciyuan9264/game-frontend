import { useLobbyRooms } from '@/features/game-core/hooks/useLobbyRooms';
import { listOthelloRooms } from '../api/room';
import { roomOwnerName } from '../model/adapters';
import type { OthelloRoom } from '../model/types';

const loadRooms = async (signal: AbortSignal) =>
  (await listOthelloRooms(signal)).rooms ?? [];

export function useOthelloLobby() {
  return useLobbyRooms<OthelloRoom>({
    loadRooms,
    getOwnerName: roomOwnerName,
  });
}
