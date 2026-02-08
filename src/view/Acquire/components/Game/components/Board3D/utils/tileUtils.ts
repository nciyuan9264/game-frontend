import { MeshBuilder, StandardMaterial, DynamicTexture, Color3, Scene, Mesh } from '@babylonjs/core';

export const createTileGeometry = (id: string, tileSize: number, scene: Scene): Mesh => {
  const tile = MeshBuilder.CreateBox(
    `tile_${id}`,
    {
      size: tileSize,
      height: 0.3,
    },
    scene
  );

  // 创建带背景图片的纹理
  const tileTexture = new DynamicTexture(`tileTexture_${id}`, { width: 512, height: 512 }, scene);
  const tileCtx = tileTexture.getContext();

  // 先加载背景图片
  const backgroundImage = new Image();
  backgroundImage.onload = () => {
    // 绘制背景图片
    tileCtx.drawImage(backgroundImage, 0, 0, 512, 512);

    // 添加半透明覆盖层
    const rowIndex = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'].indexOf(id.slice(-1));
    const colIndex = parseInt(id.slice(0, -1)) - 1;

    tileCtx.fillStyle = (rowIndex + colIndex) % 2 === 0 ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)';
    tileCtx.fillRect(0, 0, 512, 512);

    // 绘制边框和文字
    tileCtx.strokeStyle = '#404040';
    tileCtx.lineWidth = 8;
    tileCtx.strokeRect(4, 4, 504, 504);

    (tileCtx as any).font = 'bold 180px Arial';
    tileCtx.fillStyle = 'white';
    tileCtx.strokeStyle = 'black';
    tileCtx.lineWidth = 6;
    (tileCtx as any).textAlign = 'center';
    (tileCtx as any).textBaseline = 'middle';

    tileCtx.save();
    tileCtx.translate(256, 256);
    tileCtx.rotate(Math.PI / 2);
    tileCtx.strokeText(id, 0, 0);
    tileCtx.fillText(id, 0, 0);
    tileCtx.restore();

    tileTexture.update();
  };
  backgroundImage.src = '/cover/wood1.jpg'; // 你的背景图片路径

  // 创建材质
  const tileMaterial = new StandardMaterial(`mat_${id}`, scene);
  tileMaterial.diffuseTexture = tileTexture;
  tileMaterial.specularColor = new Color3(0.2, 0.2, 0.2);
  tileMaterial.emissiveColor = new Color3(0.05, 0.05, 0.1);

  tile.material = tileMaterial;
  return tile;
};

export const createBoardBorders = (scene: Scene, tileSize: number, boardOffsetX: number, boardOffsetZ: number) => {
  const borderWidth = 0.5;
  const boardWidth = 12 * tileSize;
  const boardHeight = 9 * tileSize;

  // 边框材质
  const borderMaterial = new StandardMaterial('borderMat', scene);
  borderMaterial.diffuseColor = new Color3(0.6, 0.6, 0.7);
  borderMaterial.emissiveColor = new Color3(0.1, 0.1, 0.15);

  // 创建四个边框
  const borders = [
    MeshBuilder.CreateBox(
      'borderTop',
      {
        width: boardWidth + borderWidth * 2,
        height: 0.4,
        depth: borderWidth,
      },
      scene
    ),
    MeshBuilder.CreateBox(
      'borderBottom',
      {
        width: boardWidth + borderWidth * 2,
        height: 0.4,
        depth: borderWidth,
      },
      scene
    ),
    MeshBuilder.CreateBox(
      'borderLeft',
      {
        width: borderWidth,
        height: 0.4,
        depth: boardHeight,
      },
      scene
    ),
    MeshBuilder.CreateBox(
      'borderRight',
      {
        width: borderWidth,
        height: 0.4,
        depth: boardHeight,
      },
      scene
    ),
  ];

  // 设置边框位置
  borders[0].position.set(boardOffsetX, 0.2, -boardHeight / 2 - borderWidth / 2 + boardOffsetZ);
  borders[1].position.set(boardOffsetX, 0.2, boardHeight / 2 + borderWidth / 2 + boardOffsetZ);
  borders[2].position.set(-boardWidth / 2 - borderWidth / 2 + boardOffsetX, 0.2, boardOffsetZ);
  borders[3].position.set(boardWidth / 2 + borderWidth / 2 + boardOffsetX, 0.2, boardOffsetZ);

  borders.forEach(border => {
    border.material = borderMaterial;
  });

  return borders;
};
