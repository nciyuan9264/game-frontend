import { useCallback } from 'react';
import { getPrevData } from '../../../utils/game';
import { CompanyColor } from '@/const/color';
import { hexToColor3 } from '../utils/colorUtils';
import { createFlashAnimation, sortTilesByDistance } from '../utils/animationUtils';

export const useMergerAnimation = (roomID: string, tilesRef?: React.MutableRefObject<Record<string, any>>, sceneRef?: React.MutableRefObject<any>) => {
  const detectAndAnimateMerger = useCallback((currentData: any) => {
    const prevData = getPrevData(roomID);
    if (!prevData || !currentData) return;

    // 比较公司数量，检测是否有合并发生
    const prevCompanies = Object.keys(prevData.roomData?.companyInfo || {}).filter(
      key => prevData.roomData.companyInfo[key].isActive
    );
    const currentCompanies = Object.keys(currentData.roomData?.companyInfo || {}).filter(
      key => currentData.roomData.companyInfo[key].isActive
    );

    if (prevCompanies.length > currentCompanies.length) {
      // 发生了合并，找出被合并的公司和存活的公司
      const mergedCompanies = prevCompanies.filter(company => !currentCompanies.includes(company));
      const survivingCompany = currentCompanies.find(company => {
        const prevTileCount = Object.values(prevData.roomData?.tiles || {}).filter(
          (tile: any) => tile.belong === company
        ).length;
        const currentTileCount = Object.values(currentData.roomData?.tiles || {}).filter(
          (tile: any) => tile.belong === company
        ).length;
        return currentTileCount > prevTileCount;
      });

      if (mergedCompanies.length > 0 && survivingCompany) {
        console.log(`检测到合并: ${mergedCompanies.join(', ')} 被 ${survivingCompany} 合并`);
        startMergeAnimation(mergedCompanies, survivingCompany, prevData.roomData?.tiles, currentData.roomData?.tiles);
      }
    }
  }, [roomID]);

  const startMergeAnimation = useCallback((mergedCompanies: string[], survivingCompany: string, prevTiles: any, currentTiles: any) => {
    if (!tilesRef?.current || !sceneRef?.current) return;

    // 找出所有需要变色的tiles
    const tilesToAnimate: string[] = [];
    let lastPlacedTile = '';

    Object.entries(currentTiles || {}).forEach(([tileId, tileData]: [string, any]) => {
      if (tileData.belong === survivingCompany) {
        const prevTileData = prevTiles?.[tileId];
        if (!prevTileData || prevTileData.belong !== survivingCompany) {
          // 这个tile是新加入存活公司的
          tilesToAnimate.push(tileId);
          lastPlacedTile = tileId; // 假设最后一个是触发合并的tile
        }
      }
    });

    if (tilesToAnimate.length > 0) {
      // 按距离排序，创建波浪效果
      const sortedTiles = sortTilesByDistance(tilesToAnimate, lastPlacedTile);
      animateTileColorChange(sortedTiles, survivingCompany);
    }
  }, [tilesRef, sceneRef]);

  const animateTileColorChange = useCallback((tileIds: string[], targetCompany: string) => {
    if (!tilesRef?.current || !sceneRef?.current) return;

    const targetColor = hexToColor3(CompanyColor[targetCompany] || '#ffffff');
    
    tileIds.forEach((tileId, index) => {
      setTimeout(() => {
        const tile = tilesRef.current[tileId];
        if (tile && tile.material) {
          const material = tile.material as any;
          createFlashAnimation(material, targetColor, sceneRef.current);
        }
      }, index * 100); // 每个tile间隔100ms
    });
  }, [tilesRef, sceneRef]);

  return {
    detectAndAnimateMerger,
    startMergeAnimation,
    animateTileColorChange
  };
};