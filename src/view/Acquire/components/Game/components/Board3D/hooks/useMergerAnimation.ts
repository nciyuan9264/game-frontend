import { useCallback, useEffect, useRef, type MutableRefObject } from 'react';
import { Mesh, Scene, StandardMaterial } from '@babylonjs/core';
import type { WsRoomSyncData } from '@/types/AcquireRoom';
import { CompanyColor } from '@/const/color';
import { hexToColor3 } from '../utils/colorUtils';
import { createFlashAnimation, sortTilesByDistance } from '../utils/animationUtils';

type BoardState = Pick<WsRoomSyncData['roomData'], 'tiles' | 'companyInfo'>;
export function useMergerAnimation(roomID: string, tilesRef: MutableRefObject<Record<string, Mesh>>, sceneRef: MutableRefObject<Scene | null>) {
  const previous = useRef<BoardState>();
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => {
    previous.current = undefined;
    return () => { timers.current.forEach(clearTimeout); timers.current = []; };
  }, [roomID]);
  const detectAndAnimateMerger = useCallback(({ roomData }: { roomData: BoardState }) => {
    const before = previous.current;
    previous.current = roomData;
    if (!before || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const merged = Object.keys(before.companyInfo).filter(key => {
      const company = key as keyof BoardState['companyInfo'];
      return before.companyInfo[company].tiles > 0 && !roomData.companyInfo[company]?.tiles;
    });
    if (!merged.length) return;
    const changed = Object.keys(roomData.tiles).filter(id => merged.includes(before.tiles[id]?.belong) && roomData.tiles[id]?.belong !== before.tiles[id]?.belong);
    timers.current.forEach(clearTimeout);
    timers.current = [];
    sortTilesByDistance(changed, changed[0] || '1A').forEach((id, index) => {
      const company = roomData.tiles[id].belong;
      timers.current.push(setTimeout(() => {
        const tile = tilesRef.current[id];
        if (!sceneRef.current?.isDisposed && tile && !tile.isDisposed() && tile.material instanceof StandardMaterial && previous.current?.tiles[id]?.belong === company) {
          createFlashAnimation(tile.material, hexToColor3(CompanyColor[company] || '#ffffff'));
        }
      }, index * 60));
    });
  }, [tilesRef, sceneRef]);
  return { detectAndAnimateMerger };
}
