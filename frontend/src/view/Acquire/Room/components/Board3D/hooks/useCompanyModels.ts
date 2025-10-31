import { useRef, useCallback } from 'react';
import { Mesh, SceneLoader, TransformNode, Vector3, Animation, CubicEase, EasingFunction } from '@babylonjs/core';
import { companyModels } from '../constants/models';

export const useCompanyModels = (sceneRef: React.MutableRefObject<any>, tilesRef: React.MutableRefObject<Record<string, Mesh>>) => {
  const buildingsRef = useRef<Record<string, { meshes: Mesh[]; company: string }>>({});
  const prevCompaniesRef = useRef<Record<string, string>>({});

  // 播放建造动画
  const playConstructionAnimation = useCallback(
    (container: TransformNode, targetPosition: Vector3, scale: number) => {
      const animationDuration = 60; // 2秒动画

      // 位置动画：从地下升起到正确位置
      const positionAnimation = new Animation('positionAnimation', 'position', 30, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT);

      const positionKeys = [
        { frame: 0, value: new Vector3(targetPosition.x, targetPosition.y - 2, targetPosition.z) },
        { frame: animationDuration, value: targetPosition }, // 使用传入的精确目标位置
      ];
      positionAnimation.setKeys(positionKeys);

      // 缩放动画：从0放大到目标大小
      const scaleAnimation = new Animation('scaleAnimation', 'scaling', 30, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT);

      const scaleKeys = [
        { frame: 0, value: Vector3.Zero() },
        { frame: animationDuration, value: new Vector3(scale, scale, scale) },
      ];
      scaleAnimation.setKeys(scaleKeys);

      // 添加缓动函数
      const easingFunction = new CubicEase();
      easingFunction.setEasingMode(EasingFunction.EASINGMODE_EASEOUT);
      positionAnimation.setEasingFunction(easingFunction);
      scaleAnimation.setEasingFunction(easingFunction);

      // 播放动画
      container.animations = [positionAnimation, scaleAnimation];
      sceneRef.current.beginAnimation(container, 0, animationDuration, false);
    },
    [sceneRef]
  );

  const loadCompanyModel = useCallback(
    (company: string, tileId: string, withAnimation: boolean = false) => {
      if (!sceneRef.current || !tilesRef.current[tileId]) return;

      const tile = tilesRef.current[tileId];
      const modelName = companyModels[company] || 'Sackson';
      const positionKey = `${company}_${tileId}`;

      // 检查是否已经加载过该公司的模型
      if (buildingsRef.current[positionKey]) {
        return;
      }

      SceneLoader.ImportMesh(
        '',
        `/model/${modelName}/`,
        'scene.gltf',
        sceneRef.current,
        (meshes, __, _, animationGroups) => {
          if (meshes.length === 0) return;

          // 创建一个父容器来统一管理所有mesh
          const container = new TransformNode(`container_${company}_${tileId}`, sceneRef.current);

          // 将所有mesh设为container的子节点并增亮材质
          meshes.forEach(mesh => {
            if (mesh.parent === null) {
              mesh.setParent(container);
            }

            // 增亮模型材质
            if (mesh.material) {
              // 增加环境光反射
              if ((mesh.material as any).ambientColor) {
                (mesh.material as any).ambientColor.scaleInPlace(1.5); // 增加环境光
              }

              // 增加漫反射亮度
              if ((mesh.material as any).diffuseColor) {
                (mesh.material as any).diffuseColor.scaleInPlace(1.3); // 增加漫反射
              }

              // 添加自发光效果
              if ((mesh.material as any).emissiveColor) {
                (mesh.material as any).emissiveColor.scaleInPlace(0.2); // 轻微自发光
              }

              // 如果是PBR材质，调整金属度和粗糙度
              if ((mesh.material as any).metallicFactor !== undefined) {
                (mesh.material as any).metallicFactor = Math.min((mesh.material as any).metallicFactor * 0.8, 1.0);
              }
              if ((mesh.material as any).roughnessFactor !== undefined) {
                (mesh.material as any).roughnessFactor = Math.max((mesh.material as any).roughnessFactor * 0.7, 0.1);
              }

              // 增加整体亮度
              if ((mesh.material as any).albedoColor) {
                (mesh.material as any).albedoColor.scaleInPlace(1.4);
              }
            }
          });

          // 计算整个模型的边界框
          let min = new Vector3(Infinity, Infinity, Infinity);
          let max = new Vector3(-Infinity, -Infinity, -Infinity);

          meshes.forEach(mesh => {
            if (mesh.getBoundingInfo) {
              const boundingInfo = mesh.getBoundingInfo();
              const meshMin = boundingInfo.minimum;
              const meshMax = boundingInfo.maximum;

              min = Vector3.Minimize(min, meshMin);
              max = Vector3.Maximize(max, meshMax);
            }
          });

          // 计算模型的实际尺寸和中心点偏移
          const size = max.subtract(min);
          const maxDimension = Math.max(size.x, size.y, size.z);
          const center = min.add(max).scale(0.5); // 计算模型的几何中心

          // 目标大小（适合tile大小）
          const targetSize = 2.6;
          const scale = targetSize / maxDimension;

          console.log(`Model ${modelName} dimensions:`, size);
          console.log(`Model center offset:`, center);
          console.log(`Max dimension: ${maxDimension}, calculated scale: ${scale}`);

          // 计算正确的位置偏移，确保模型底部贴合tile表面，中心对齐
          const yOffset = -center.y * scale; // 补偿模型中心点偏移，让底部贴合tile
          const xOffset = -center.x * scale; // 补偿X轴中心点偏移
          const zOffset = -center.z * scale; // 补偿Z轴中心点偏移

          // 设置容器的位置和缩放
          if (withAnimation) {
            // 新增公司：带动画效果
            container.position = new Vector3(tile.position.x + xOffset, tile.position.y - 2, tile.position.z + zOffset);
            container.scaling = new Vector3(0, 0, 0);

            // 修改动画目标位置
            const finalPosition = new Vector3(
              tile.position.x + xOffset,
              tile.position.y + yOffset + 1.4, // 稍微抬高0.01避免Z-fighting
              tile.position.z + zOffset
            );
            playConstructionAnimation(container, finalPosition, scale);
          } else {
            // 已有公司：直接展示
            container.position = new Vector3(
              tile.position.x + xOffset,
              tile.position.y + yOffset + 1.4, // 贴合tile表面，稍微抬高避免Z-fighting
              tile.position.z + zOffset
            );
            container.scaling = new Vector3(scale, scale, scale);
          }

          // 播放动画组
          if (animationGroups && animationGroups.length > 0) {
            animationGroups.forEach(ag => ag.play(true));
          }

          // 添加到发光层
          const glowLayer = sceneRef.current?.getGlowLayerByName('glow1');
          if (glowLayer) {
            meshes.forEach(mesh => {
              if (mesh.material) {
                glowLayer.addIncludedOnlyMesh(mesh as Mesh);
              }
            });
          }

          // 存储建筑物信息
          buildingsRef.current[positionKey] = {
            meshes: [container as any, ...meshes] as Mesh[],
            company: company,
          };

          console.log(`Successfully loaded model ${modelName} for company ${company}`);
        },
        progress => {
          console.log(`Loading ${modelName}: ${((progress.loaded / progress.total) * 100).toFixed(1)}%`);
        },
        error => {
          console.error(`Failed to load model ${modelName} for company ${company}:`);
          console.error('Error details:', error);
          console.error('Attempted path:', `/model/${modelName}/scene.gltf`);

          // 尝试检查文件是否存在
          fetch(`/model/${modelName}/scene.gltf`, { method: 'HEAD' })
            .then(response => {
              if (!response.ok) {
                console.error(`File not found: /model/${modelName}/scene.gltf (Status: ${response.status})`);
              } else {
                console.error('File exists but failed to load as 3D model');
              }
            })
            .catch(fetchError => {
              console.error('Cannot access file:', fetchError);
            });
        }
      );
    },
    [sceneRef, tilesRef, playConstructionAnimation]
  );

  const removeCompanyModel = useCallback((company: string) => {
    Object.keys(buildingsRef.current).forEach(key => {
      const building = buildingsRef.current[key];
      if (building.company === company) {
        building.meshes.forEach(mesh => {
          if (mesh && !mesh.isDisposed()) {
            mesh.dispose();
          }
        });
        delete buildingsRef.current[key];
        console.log(`Removed model for company ${company}`);
      }
    });
  }, []);

  // 根据模型名称获取合适的缩放比例
  const getModelScale = useCallback((modelName: string): number => {
    const scaleMap: Record<string, number> = {
      American: 0.3,
      Continental: 0.3,
      Festival: 0.3,
      Imperial: 0.3,
      Sackson: 0.3,
      Tower: 0.3,
      Worldwide: 0.3,
    };
    return scaleMap[modelName] || 0.3;
  }, []);

  const checkAndLoadCompanyModels = useCallback(
    (data: any) => {
      if (!sceneRef.current || !data?.roomData?.tiles) return;

      const currentCompanies: Record<string, string> = {};

      // 收集当前所有公司及其位置
      Object.entries(data.roomData.tiles).forEach(([tileId, tileData]: [string, any]) => {
        if (tileData.belong && tileData.belong !== 'Blank' && tileData.belong !== 'undefined') {
          if (!currentCompanies[tileData.belong]) {
            currentCompanies[tileData.belong] = tileId; // 记录该公司的第一个tile
          }
        }
      });
      console.log('currentCompanies', currentCompanies);

      // 检测新增的公司和已有公司
      Object.entries(currentCompanies).forEach(([company, tileId]) => {
        const isNewCompany = !prevCompaniesRef.current[company];

        if (isNewCompany) {
          // 这是新增的公司，带动画加载模型
          loadCompanyModel(company, tileId, true);
        } else {
          // 已有公司，检查是否已加载模型，如果没有则直接加载（不带动画）
          const positionKey = `${company}_${tileId}`;
          if (!buildingsRef.current[positionKey]) {
            loadCompanyModel(company, tileId, false);
          }
        }
      });

      // 检测移除的公司
      Object.keys(prevCompaniesRef.current).forEach(company => {
        if (!currentCompanies[company]) {
          // 公司被移除，删除对应模型
          removeCompanyModel(company);
        }
      });

      prevCompaniesRef.current = currentCompanies;
    },
    [sceneRef, loadCompanyModel, removeCompanyModel]
  );

  return {
    buildingsRef,
    loadCompanyModel,
    removeCompanyModel,
    checkAndLoadCompanyModels,
    getModelScale,
    playConstructionAnimation,
  };
};
