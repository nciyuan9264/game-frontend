import { PanelsTopLeft } from 'lucide-react';
import {
  isPreviewGame,
  isPreviewScene,
  previewGames,
  previewPath,
  previewScenesForGame,
  supportsPreviewScene,
  type PreviewGame,
  type PreviewScene,
} from './config';
import styles from './Controls.module.less';

export default function GamePreviewControls() {
  const params = new URLSearchParams(window.location.search);
  const game = isPreviewGame(params.get('game'))
    ? params.get('game') as PreviewGame
    : 'othello';
  const scene = isPreviewScene(params.get('scene'))
    ? params.get('scene') as PreviewScene
    : 'lobby';
  const open = (nextGame: PreviewGame, nextScene: PreviewScene) => {
    const supportedScene = supportsPreviewScene(nextGame, nextScene)
      ? nextScene
      : 'lobby';
    window.location.assign(previewPath(nextGame, supportedScene));
  };
  const scenes = previewScenesForGame(game);

  return <div className={styles.controls} data-game-preview-controls>
    <PanelsTopLeft aria-hidden="true" />
    <label><span>预览游戏</span><select aria-label="预览游戏" value={game}
      onChange={event => open(event.target.value as PreviewGame, scene)}>
      {previewGames.map(([value, label]) =>
        <option key={value} value={value}>{label}</option>)}
    </select></label>
    <label><span>预览场景</span><select aria-label="预览场景" value={scene}
      onChange={event => open(game, event.target.value as PreviewScene)}>
      {scenes.map(([value, label]) =>
        <option key={value} value={value}>{label}</option>)}
    </select></label>
  </div>;
}
