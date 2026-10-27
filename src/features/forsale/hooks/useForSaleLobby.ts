import { useLobbyRooms } from '@/features/game-core/hooks/useLobbyRooms';
import { listForSaleRooms } from '../api/room';
import { roomOwnerName } from '@/features/game-core/model/room';
import type { ForSaleRoom } from '../model/types';

const loadRooms = async (signal: AbortSignal) =>
  (await listForSaleRooms(signal)).rooms ?? [];

export const useForSaleLobby = () => useLobbyRooms<ForSaleRoom>({
  loadRooms,
  getOwnerName: roomOwnerName,
});
