import { useRef, useEffect } from 'react';
import { Engine, Scene, ArcRotateCamera, HemisphericLight, Vector3, GlowLayer } from '@babylonjs/core';

export const useScene = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<Scene | null>(null);
  const engineRef = useRef<Engine | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // 创建引擎和场景
    const engine = new Engine(canvasRef.current, true);
    const scene = new Scene(engine);

    // 设置场景背景为透明，让CSS背景图片显示
    scene.clearColor.a = 0; // 设置alpha为0，使场景背景透明

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
    hemisphericLight.intensity = 0.7;

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
