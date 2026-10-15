import { useCallback, useEffect, useRef, useState, type MutableRefObject } from 'react';
import { AssetContainer, Mesh, Scene, SceneLoader, Vector3, Animation, CubicEase, EasingFunction } from '@babylonjs/core';
import type { WsRoomSyncData } from '@/types/AcquireRoom';
import { companyModels, companyModelsData } from '../constants/models';

interface ModelRequest { id: number; tileID: string; assets?: AssetContainer }
export function useCompanyModels(sceneRef: MutableRefObject<Scene | null>, tilesRef: MutableRefObject<Record<string, Mesh>>) {
  const requests = useRef(new Map<string, ModelRequest>());
  const sequence = useRef(0);
  const [modelError, setModelError] = useState('');
  useEffect(() => () => {
    requests.current.forEach(request => request.assets?.dispose());
    requests.current.clear();
  }, []);
  const checkAndLoadCompanyModels = useCallback((data?: WsRoomSyncData) => {
    const scene = sceneRef.current;
    if (!scene || scene.isDisposed || !data) return;
    const companies = new Map<string, string>();
    for (const [tileID, tile] of Object.entries(data.roomData.tiles)) {
      if (companyModels[tile.belong] && !companies.has(tile.belong)) companies.set(tile.belong, tileID);
    }
    for (const [company, request] of requests.current) {
      if (!companies.has(company) || data.roomData.tiles[request.tileID]?.belong !== company) {
        request.assets?.dispose();
        requests.current.delete(company);
      }
    }
    for (const [company, tileID] of companies) {
      if (requests.current.has(company)) continue;
      const tile = tilesRef.current[tileID];
      if (!tile) continue;
      const request: ModelRequest = { id: ++sequence.current, tileID };
      requests.current.set(company, request);
      const model = companyModels[company], settings = companyModelsData[model];
      void SceneLoader.LoadAssetContainerAsync(`/model/${model}/`, 'scene.gltf', scene).then(assets => {
        // A company may merge or a view may unmount while the model is loading.
        if (scene.isDisposed || requests.current.get(company)?.id !== request.id) { assets.dispose(); return; }
        request.assets = assets;
        const root = assets.createRootMesh();
        assets.addAllToScene();
        const target = new Vector3(tile.position.x + settings.xOffset, tile.position.y + settings.yOffset + .1, tile.position.z + settings.zOffset);
        const scale = new Vector3(settings.scale, settings.scale, settings.scale);
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        root.position.copyFrom(target);
        root.scaling.copyFrom(scale);
        if (!reduced) {
          const easing = new CubicEase();
          easing.setEasingMode(EasingFunction.EASINGMODE_EASEOUT);
          Animation.CreateAndStartAnimation(`build-${request.id}`, root, 'position', 30, 60, target.subtract(new Vector3(0, 2, 0)), target, Animation.ANIMATIONLOOPMODE_CONSTANT, easing, undefined, scene);
          assets.animationGroups.forEach(group => group.play(true));
        }
      }).catch(() => {
        if (!scene.isDisposed && requests.current.get(company)?.id === request.id) setModelError('部分建筑模型未能加载。你仍可操作手牌，或切回 2D 棋盘。');
      });
    }
  }, [sceneRef, tilesRef]);
  return { checkAndLoadCompanyModels, modelError };
}
