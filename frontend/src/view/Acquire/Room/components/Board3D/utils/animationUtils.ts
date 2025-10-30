import { Animation, Color3, StandardMaterial, Scene } from '@babylonjs/core';
import { CompanyColor } from '@/const/color';
import { hexToColor3 } from './colorUtils';

export const createFlashAnimation = (material: StandardMaterial, targetColor: Color3, scene: Scene) => {
  // 创建闪光动画
  const flashAnimation = Animation.CreateAndStartAnimation(
    'flash',
    material,
    'emissiveColor',
    30, // fps
    60, // 总帧数 (2秒)
    material.emissiveColor,
    new Color3(1, 1, 1), // 白色闪光
    0, // 不循环
    undefined,
    () => {
      // 闪光结束后，变为目标颜色
      Animation.CreateAndStartAnimation(
        'colorChange',
        material,
        'emissiveColor',
        30,
        30,
        new Color3(1, 1, 1),
        targetColor,
        0
      );
    }
  );
  
  return flashAnimation;
};

export const calculateTileDistance = (tile1: string, tile2: string): number => {
  // 计算两个tile之间的曼哈顿距离
  const getCoords = (tileId: string) => {
    const col = parseInt(tileId.slice(0, -1)) - 1;
    const row = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'].indexOf(tileId.slice(-1));
    return { col, row };
  };

  const coords1 = getCoords(tile1);
  const coords2 = getCoords(tile2);
  
  return Math.abs(coords1.col - coords2.col) + Math.abs(coords1.row - coords2.row);
};

export const sortTilesByDistance = (tiles: string[], centerTile: string): string[] => {
  return tiles.sort((a, b) => {
    const distA = calculateTileDistance(a, centerTile);
    const distB = calculateTileDistance(b, centerTile);
    return distA - distB;
  });
};