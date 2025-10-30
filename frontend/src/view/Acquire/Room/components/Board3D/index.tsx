import { useEffect } from 'react';
import { WsRoomSyncData } from '@/types/room';
import styles from './index.module.less';
import { useScene } from './hooks/useScene';
import { useTiles } from './hooks/useTiles';
import { useCompanyModels } from './hooks/useCompanyModels';
import { useMergerAnimation } from './hooks/useMergerAnimation';

// Add this import for glTF loader
import '@babylonjs/loaders/glTF';

type Props = {
  hoveredTile?: string;
  data?: WsRoomSyncData;
  roomID: string;
};

export default function Board3D({ roomID, hoveredTile, data }: Props) {
  const { canvasRef, sceneRef } = useScene();
  const { tilesRef, createTiles, updateTileColor } = useTiles(sceneRef);
  const { checkAndLoadCompanyModels } = useCompanyModels(sceneRef, tilesRef);
  const { detectAndAnimateMerger } = useMergerAnimation(roomID);

  // 初始化棋盘
  useEffect(() => {
    if (sceneRef.current) {
      createTiles();
    }
  }, [sceneRef.current, createTiles]);

  // 更新tile颜色
  useEffect(() => {
    if (!data?.roomData?.tiles) return;

    Object.keys(tilesRef.current).forEach(id => {
      const tileData = data.roomData.tiles[id];
      updateTileColor(id, tileData, hoveredTile);
    });
  }, [data?.roomData?.tiles, hoveredTile, updateTileColor]);

  // 检查并加载公司模型
  useEffect(() => {
    checkAndLoadCompanyModels(data);
  }, [data?.roomData?.tiles, checkAndLoadCompanyModels]);

  // 检测合并动画
  useEffect(() => {
    if (data?.roomData?.tiles) {
      detectAndAnimateMerger({
        roomData: {
          companyInfo: data?.roomData.companyInfo,
          tiles: data?.roomData.tiles
        }
      });
    }
  }, [data?.roomData?.tiles, detectAndAnimateMerger]);

  return (
    <canvas
      ref={canvasRef}
      className={styles.canvas}
      style={{ width: '100vw', height: '100vh' }}
    />
  );
}