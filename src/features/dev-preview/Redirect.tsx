import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  isPreviewGame,
  isPreviewScene,
  previewPath,
  supportsPreviewScene,
  type PreviewGame,
  type PreviewScene,
} from './config';

export default function GamePreviewRedirect() {
  const [params] = useSearchParams();
  const game = isPreviewGame(params.get('game'))
    ? params.get('game') as PreviewGame
    : 'othello';
  const requestedScene = isPreviewScene(params.get('scene'))
    ? params.get('scene') as PreviewScene
    : 'lobby';
  const scene = supportsPreviewScene(game, requestedScene)
    ? requestedScene
    : 'lobby';

  useEffect(() => {
    window.location.replace(previewPath(
      game,
      scene,
      params.get('controls') !== '0',
    ));
  }, [game, params, scene]);

  return null;
}
