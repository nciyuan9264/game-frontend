import { useRef, useEffect } from 'react';
import { Engine, Scene, ArcRotateCamera, HemisphericLight, Vector3, CubeTexture, MeshBuilder, BackgroundMaterial, Texture, GlowLayer } from '@babylonjs/core';

export const useScene = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<Scene | null>(null);
  const engineRef = useRef<Engine | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // 创建引擎和场景
    const engine = new Engine(canvasRef.current, true);
    const scene = new Scene(engine);

    // 设置天空盒环境贴图
    scene.environmentTexture = CubeTexture.CreateFromPrefilteredData('/environment1.env', scene);
    // 创建天空盒
    const skydome = MeshBuilder.CreateBox(
      'sky',
      {
        size: 100,
        sideOrientation: 1, 
      },
      scene
    );
    skydome.position.y = 15;
    skydome.isPickable = false;
    skydome.receiveShadows = true;

    // 添加这行来上下颠倒天空盒
    skydome.scaling.y = -1;

    // 设置天空盒材质
    const sky = new BackgroundMaterial('skyMaterial', scene);
    sky.reflectionTexture = scene.environmentTexture.clone();
    if (sky.reflectionTexture) {
      sky.reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE;
      sky.reflectionTexture.level = 0.2;
    }
    sky.reflectionBlur = 0.8;
    sky.projectedGroundRadius = 20;
    sky.projectedGroundHeight = 3;
    skydome.material = sky;

    engineRef.current = engine;
    sceneRef.current = scene;

    // 设置相机
    const camera = new ArcRotateCamera('camera', -Math.PI / 2, Math.PI / 5.6, 21, new Vector3(0, 0, 0), scene);

    camera.attachControl(canvasRef.current, true);
    camera.inputs.addMouseWheel();

    camera.inputs.attached.pointers.detachControl();
    camera.inputs.attached.keyboard.detachControl();

    // 限制缩放范围
    camera.lowerRadiusLimit = 10;
    camera.upperRadiusLimit = 30;
    camera.lowerBetaLimit = 0.1;
    camera.upperBetaLimit = Math.PI / 2.2;

    // 设置光照
    const hemisphericLight = new HemisphericLight('hemiLight', new Vector3(0, 1, 0), scene);
    hemisphericLight.intensity = 0.5;

    // 创建发光层
    const glowLayer = new GlowLayer('glow', scene);
    glowLayer.intensity = 0.4;

    // 渲染循环
    engine.runRenderLoop(() => scene.render());

    // 处理窗口大小变化
    const handleResize = () => {
      engine.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      scene.dispose();
      engine.dispose();
    };
  }, []);

  return { canvasRef, sceneRef, engineRef };
};
