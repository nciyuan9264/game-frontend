import { useRef, useEffect, useCallback } from 'react';
import { Engine, Scene, ArcRotateCamera, HemisphericLight, Vector3, GlowLayer } from '@babylonjs/core';

export const useScene = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<Scene | null>(null);
  const engineRef = useRef<Engine | null>(null);
  const cameraRef = useRef<ArcRotateCamera | null>(null);

  // 初始相机参数
  const initialCameraParams = {
    alpha: -Math.PI / 2,
    beta: Math.PI / 5.6,
    radius: 21,
    target: new Vector3(0, 0, 0)
  };

  // 重置相机到初始状态
  const resetCamera = useCallback(() => {
    if (cameraRef.current) {
      cameraRef.current.setTarget(initialCameraParams.target);
      cameraRef.current.alpha = initialCameraParams.alpha;
      cameraRef.current.beta = initialCameraParams.beta;
      cameraRef.current.radius = initialCameraParams.radius;
    }
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;

    // 创建引擎和场景
    const engine = new Engine(canvasRef.current, true);
    const scene = new Scene(engine);

    // 设置场景背景为透明，让CSS背景图片显示
    scene.clearColor.a = 0;

    engineRef.current = engine;
    sceneRef.current = scene;

    // 设置相机
    const camera = new ArcRotateCamera(
      'camera', 
      initialCameraParams.alpha, 
      initialCameraParams.beta, 
      initialCameraParams.radius, 
      initialCameraParams.target, 
      scene
    );
    
    cameraRef.current = camera;

    // 启用相机控制
    camera.attachControl(canvasRef.current, true);
    camera.inputs.addMouseWheel();

    // 移除这两行注释，启用鼠标和键盘控制
    // camera.inputs.attached.pointers.detachControl();
    // camera.inputs.attached.keyboard.detachControl();

    // 限制相机范围，防止用户操作过度
    camera.lowerRadiusLimit = 10;
    camera.upperRadiusLimit = 30;
    camera.lowerBetaLimit = 0.1;
    camera.upperBetaLimit = Math.PI / 2.2;
    
    // 限制alpha角度，防止相机翻转过度
    camera.lowerAlphaLimit = -Math.PI * 2;
    camera.upperAlphaLimit = Math.PI * 2;

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

  return { canvasRef, sceneRef, engineRef, cameraRef, resetCamera };
};
