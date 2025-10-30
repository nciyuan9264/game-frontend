import { useRef, useCallback } from 'react';
import { Mesh, StandardMaterial, DynamicTexture, Color3, ActionManager, ExecuteCodeAction, GlowLayer, Texture, MeshBuilder } from '@babylonjs/core';
import { CompanyColor } from '@/const/color';
import { createBoardBorders, createTileGeometry } from '../utils/tileUtils';
import { hexToColor3 } from '../utils/colorUtils';

export const useTiles = (sceneRef: React.MutableRefObject<any>, glowLayer?: GlowLayer) => {
  const tilesRef = useRef<Record<string, Mesh>>({});

  const createTiles = useCallback(() => {
    if (!sceneRef.current) return;

    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
    const columns = Array.from({ length: 12 }, (_, i) => `${i + 1}`);
    const tileSize = 1.5;
    const boardOffsetX = 0;
    const boardOffsetZ = 2.6;

    // createBoardBorders(sceneRef.current, 1.5, 0, boardOffsetZ);
    rows.forEach((row, rowIndex) => {
      columns.forEach((col, colIndex) => {
        const id = `${col}${row}`;
        const tile = createTileGeometry(id, tileSize, sceneRef.current);

        // 设置位置
        tile.position.x = (colIndex - (columns.length - 1) / 2) * tileSize + boardOffsetX;
        tile.position.z = (rowIndex - (rows.length - 1) / 2) * tileSize + boardOffsetZ;
        tile.position.y = 0.15;

        // 添加交互
        tile.actionManager = new ActionManager(sceneRef.current);
        tile.actionManager.registerAction(
          new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
            console.log(`Clicked tile: ${id}`);
          })
        );

        tilesRef.current[id] = tile;

        // 添加到发光层
        if (glowLayer) {
          glowLayer.addIncludedOnlyMesh(tile);
        }
      });
    });

    // 创建棋盘底座并添加图片贴图
    const boardBase = MeshBuilder.CreateBox(
      'boardBase',
      {
        width: 12 * tileSize + 3,
        height: 0.5,
        depth: 9 * tileSize + 3,
      },
      sceneRef.current
    );

    const baseMaterial = new StandardMaterial('baseMat', sceneRef.current);

    // 加载图片贴图
    const backgroundTexture = new Texture('/cover/wood.jpg', sceneRef.current);
    backgroundTexture.uScale = 1; // 控制水平重复
    backgroundTexture.vScale = 1; // 控制垂直重复

    baseMaterial.diffuseTexture = backgroundTexture;
    baseMaterial.specularColor = new Color3(0.1, 0.1, 0.1); // 降低反光
    boardBase.material = baseMaterial;
    boardBase.position.set(boardOffsetX, -0.25, boardOffsetZ);
  }, [sceneRef, glowLayer]);

  const updateTileColor = useCallback(
    (id: string, tileData: any, hoveredTile?: string) => {
      const tile = tilesRef.current[id];
      if (!tile || !sceneRef.current) return;

      const material = tile.material as StandardMaterial;
      const isHovered = hoveredTile === id;

      if (tileData?.belong && CompanyColor[tileData.belong]) {
        // 更新公司颜色
        const tileTexture = new DynamicTexture(`tileTexture_${id}_updated`, { width: 512, height: 512 }, sceneRef.current);
        const ctx = tileTexture.getContext();

        ctx.fillStyle = CompanyColor[tileData.belong];
        ctx.fillRect(0, 0, 512, 512);

        // 绘制边框和文字
        ctx.strokeStyle = '#404040';
        ctx.lineWidth = 8;
        ctx.strokeRect(4, 4, 504, 504);

        (ctx as any).font = 'bold 180px Arial';
        ctx.fillStyle = 'black';
        (ctx as any).textAlign = 'center';
        (ctx as any).textBaseline = 'middle';

        ctx.save();
        ctx.translate(256, 256);
        ctx.rotate(Math.PI / 2);
        ctx.fillText(id, 0, 0);
        ctx.restore();

        tileTexture.update();
        material.diffuseTexture = tileTexture;

        // 设置发光效果
        const companyColor = hexToColor3(CompanyColor[tileData.belong]);
        const maxComponent = Math.max(companyColor.r, companyColor.g, companyColor.b);
        const scale = isHovered ? 0.2 / maxComponent : 0.6 / maxComponent;
        material.emissiveColor = new Color3(companyColor.r * scale, companyColor.g * scale, companyColor.b * scale);
      } else {
        // 默认状态
        material.emissiveColor = isHovered ? new Color3(0.2, 0.8, 1.0) : new Color3(0.05, 0.05, 0.1);
      }
    },
    [sceneRef]
  );

  return { tilesRef, createTiles, updateTileColor };
};
