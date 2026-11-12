import type { GameType } from '@/hooks/useGameType';

export const previewGames = [
  ['acquire', 'Acquire'],
  ['davinci', '达芬奇密码'],
  ['splendor', '璀璨宝石'],
  ['yinsh', 'YINSH'],
  ['othello', 'Othello'],
  ['quoridor', '步步为营'],
  ['hex', 'Hex'],
  ['onitama', 'Onitama'],
  ['hive', 'Hive'],
  ['loveletter', '情书'],
  ['sixnimmt', '6 nimmt!'],
  ['cantstop', "Can't Stop"],
  ['forsale', 'For Sale'],
  ['fugitive', 'Fugitive'],
  ['warchest', '战争之匣'],
] as const satisfies ReadonlyArray<readonly [GameType, string]>;

export type PreviewGame = typeof previewGames[number][0];

export const previewScenes = [
  ['lobby', '外层 · 对局大厅'],
  ['rankings', '外层 · 排行榜'],
  ['guide', '外层 · 玩法指南'],
  ['profile', '外层 · 个人页面'],
  ['room-empty', '房间 · 空席位'],
  ['room-ready', '房间 · 双人准备'],
  ['room-ai', '房间 · AI 对手'],
  ['result', '结算 · 最终结果'],
] as const;

export type PreviewScene = typeof previewScenes[number][0];

const gameSet = new Set<string>(previewGames.map(([value]) => value));
const sceneSet = new Set<string>(previewScenes.map(([value]) => value));

export function isPreviewGame(value: string | null): value is PreviewGame {
  return !!value && gameSet.has(value);
}

export function isPreviewScene(value: string | null): value is PreviewScene {
  return !!value && sceneSet.has(value);
}

export function supportsPreviewScene(
  game: PreviewGame,
  scene: PreviewScene,
) {
  return scene !== 'result' || game === 'acquire';
}

export function previewScenesForGame(game: PreviewGame) {
  return previewScenes.filter(([scene]) =>
    supportsPreviewScene(game, scene));
}

export function previewRoomID(game: PreviewGame) {
  return `PREVIEW-${game.toUpperCase()}`;
}

export function previewPath(
  game: PreviewGame,
  scene: PreviewScene,
  controls = true,
) {
  const safeScene = supportsPreviewScene(game, scene) ? scene : 'lobby';
  const suffix = safeScene === 'rankings'
    ? '/rankings'
    : safeScene === 'guide'
      ? '/guide'
      : safeScene === 'profile'
        ? '/me'
        : safeScene.startsWith('room-')
          ? '/match'
          : '';
  const params = new URLSearchParams({
    __preview: '1',
    game,
    scene: safeScene,
  });
  if (safeScene.startsWith('room-')) {
    params.set('roomID', previewRoomID(game));
  }
  if (!controls) params.set('controls', '0');
  if (safeScene === 'result') {
    return `/__dev/acquire-result?${params.toString()}`;
  }
  return `/game/${game}${suffix}?${params.toString()}`;
}
