import APIClient from '@/api/apiClient';
import type { DavinciRoom } from '../model/types';

export async function createDavinciRoom(): Promise<{ roomID: string }> {
  return APIClient.post({ url: '/api/davinci/room/create', data: {} });
}

export async function listDavinciRooms(signal?: AbortSignal): Promise<{ rooms: DavinciRoom[] }> {
  return APIClient.get({ url: '/api/davinci/room/list', signal });
}
