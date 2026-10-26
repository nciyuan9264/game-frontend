import { useLobbyRooms } from '@/features/game-core/hooks/useLobbyRooms';
import { listWarChestRooms } from '../api/room';
import { roomOwnerName } from '../adapters';
import type { WarChestRoom } from '../types';

const loadRooms = async (signal: AbortSignal) =>
  (await listWarChestRooms(signal)).rooms ?? [];

export function useWarChestLobby() {
  return useLobbyRooms<WarChestRoom>({ loadRooms, getOwnerName: roomOwnerName });
}
