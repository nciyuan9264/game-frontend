import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { apiInstance } from '@/api/request';
import {
  isPreviewGame,
  isPreviewScene,
  previewRoomID,
  type PreviewGame,
  type PreviewScene,
} from './config';

const profile = {
  user_id: 'preview-player',
  email: 'player@gamebus.online',
  display_name: '预览玩家',
  avatar: '',
  roles: ['player'],
};

const maxPlayers: Record<PreviewGame, number> = {
  acquire: 6,
  davinci: 2,
  splendor: 4,
  yinsh: 2,
  othello: 2,
  quoridor: 2,
  hex: 2,
  onitama: 2,
  hive: 2,
  loveletter: 6,
  sixnimmt: 10,
  cantstop: 4,
  forsale: 6,
  fugitive: 2,
  warchest: 2,
};

function player(
  userID: string,
  displayName: string,
  seatIndex: number,
  game: PreviewGame,
  ai = false,
) {
  return {
    userID,
    playerID: userID,
    displayName,
    avatar: '',
    seatIndex,
    online: true,
    ai,
    aiDifficulty: ai ? 'hard' : undefined,
    ready: true,
    gameRole: game === 'fugitive'
      ? seatIndex === 0 ? 'fugitive' : 'marshal'
      : undefined,
  };
}

function roomMetrics(game: PreviewGame) {
  const metrics = {
    acquire: { emptyTileCount: 108, progressCurrent: 0, progressTotal: 108 },
    davinci: { boardCardCount: 26, progressCurrent: 0, progressTotal: 0 },
    splendor: { maxScore: 0, progressCurrent: 0, progressTotal: 15 },
    yinsh: { ringsRemoved: 0, progressCurrent: 0, progressTotal: 3 },
    othello: { occupiedCount: 4, progressCurrent: 0, progressTotal: 60 },
    quoridor: { turnCount: 0 },
    hex: { turnCount: 0 },
    onitama: { turnCount: 0 },
    hive: {
      turnCount: 0,
      placedPieceCount: 0,
      progressCurrent: 0,
      progressTotal: 22,
    },
    loveletter: {
      currentRound: 1,
      maxFavor: 0,
      targetFavor: 6,
      progressCurrent: 0,
      progressTotal: 6,
    },
    sixnimmt: {
      currentRound: 1,
      maxPenalty: 0,
      targetPenalty: 66,
      progressCurrent: 0,
      progressTotal: 66,
    },
    cantstop: {
      maxClaimedColumns: 0,
      targetColumns: 3,
      progressCurrent: 0,
      progressTotal: 3,
    },
    forsale: { progressCurrent: 0, progressTotal: 8 },
    fugitive: {
      highestRevealed: 0,
      hiddenHideoutCount: 0,
      progressCurrent: 0,
      progressTotal: 42,
    },
    warchest: {
      maxControlledLocations: 0,
      progressCurrent: 0,
      progressTotal: 6,
    },
  };
  const key = game === 'forsale' ? 'forSale' : game;
  return { [key]: metrics[game] };
}

function room(
  game: PreviewGame,
  roomID: string,
  status: 'match' | 'playing',
  players: ReturnType<typeof player>[],
) {
  return {
    roomID,
    gameType: game,
    status,
    visibility: 'public',
    ownerUserID: players[0].userID,
    ownerPlayerID: players[0].playerID,
    maxPlayers: maxPlayers[game],
    playerCount: players.length,
    currentMatchID: `${roomID.toLowerCase()}-r1`,
    currentMatchStatus: status === 'match' ? 'preparing' : 'playing',
    nextRoundNo: 2,
    createdAt: '2026-11-10T08:05:00Z',
    updatedAt: '2026-11-10T08:20:00Z',
    players,
    metrics: roomMetrics(game),
  };
}

function rooms(game: PreviewGame, scene: PreviewScene) {
  const me = player(profile.user_id, profile.display_name, 0, game);
  const rival = player('preview-rival', '远山对手', 1, game);
  const ai = player('preview-ai', '困难 AI', 1, game, true);
  const targetPlayers = scene === 'room-empty'
    ? [{ ...me, ready: false }]
    : scene === 'room-ai'
      ? [me, ai]
      : [me, rival];
  return [
    room(game, previewRoomID(game), 'match', targetPlayers),
    room(game, `${game.toUpperCase()}-OPEN`, 'match', [rival]),
    room(game, `${game.toUpperCase()}-LIVE`, 'playing', [rival, me]),
  ];
}

const rankGames = new Set<PreviewGame>([
  'acquire',
  'splendor',
  'loveletter',
  'sixnimmt',
  'forsale',
]);

function rankingMetric(game: PreviewGame, index: number) {
  if (rankGames.has(game)) {
    return { rank: { avgRank: 1 + index / 10 } };
  }
  return {
    [game]: {
      wins: 18 - index,
      winRate: .72 - index * .035,
    },
  };
}

function rankings(game: PreviewGame) {
  return Array.from({ length: 8 }, (_, index) => ({
    userID: index === 2 ? profile.user_id : `preview-rank-${index}`,
    playerID: index === 2 ? profile.user_id : `preview-rank-${index}`,
    displayName: index === 2 ? profile.display_name : `预览棋手 ${index + 1}`,
    avatar: '',
    totalGames: 28 - index,
    metric: rankingMetric(game, index),
  }));
}

function historyGames(game: PreviewGame) {
  return Array.from({ length: 5 }, (_, index) => {
    const id = `preview-${game}-${index}`;
    const startedAt = `2026-11-0${9 - index}T12:18:00Z`;
    return {
      id,
      roomID: `${game.toUpperCase()}-${String(index + 1).padStart(4, '0')}`,
      gameType: game,
      startedAt,
      endedAt: startedAt,
      durationSeconds: 900 + index * 120,
      winnerUserID: index % 2 ? 'preview-rival' : profile.user_id,
      winnerPlayerID: index % 2 ? 'preview-rival' : profile.user_id,
      endReason: '正常结算',
      maxPlayers: maxPlayers[game],
      createdAt: startedAt,
      updatedAt: startedAt,
      players: [{
        id: `${id}-self`,
        gameID: id,
        userID: profile.user_id,
        playerID: profile.user_id,
        displayName: profile.display_name,
        gameRole: game === 'fugitive' ? 'fugitive' : undefined,
        seatIndex: 0,
        isAI: false,
        finalScore: 20 - index,
        finalStocks: 4,
        finalRank: index % 2 ? 2 : 1,
        isWinner: index % 2 === 0,
        createdAt: startedAt,
      }, {
        id: `${id}-rival`,
        gameID: id,
        userID: 'preview-rival',
        playerID: 'preview-rival',
        displayName: '远山对手',
        gameRole: game === 'fugitive' ? 'marshal' : undefined,
        seatIndex: 1,
        isAI: false,
        finalScore: 12 + index,
        finalStocks: 2,
        finalRank: index % 2 ? 1 : 2,
        isWinner: index % 2 === 1,
        createdAt: startedAt,
      }],
    };
  });
}

const envelope = (data: unknown) => ({
  status_code: 0,
  message: 'ok',
  data,
});

function fixture(
  config: InternalAxiosRequestConfig,
  game: PreviewGame,
  scene: PreviewScene,
): unknown {
  const path = new URL(config.url ?? '/', window.location.origin)
    .pathname
    .replace(/^\/pam-api/, '');
  const previewRooms = rooms(game, scene);
  if (path === '/platform/auth/profile') return envelope(profile);
  if (path === '/platform/auth/logout') return envelope({});
  if (path === '/platform/auth/acquisition-survey') {
    return envelope({ completed: true, options: [] });
  }
  if (path === '/platform/history/stats') {
    return envelope({
      totalGames: 32,
      wins: 20,
      winRate: .625,
      avgScore: 24.5,
      gamesByRole: { fugitive: 16, marshal: 16 },
      winsByRole: { fugitive: 11, marshal: 9 },
    });
  }
  if (path === '/platform/history/games') {
    return envelope({ games: historyGames(game) });
  }
  if (path === '/platform/rankings') {
    return envelope({ gameType: game, entries: rankings(game) });
  }
  if (path === '/platform/rooms' && config.method === 'post') {
    return envelope(previewRooms[0]);
  }
  if (path === '/platform/rooms') return envelope({ rooms: previewRooms });
  if (path.startsWith('/platform/rooms/')) {
    const roomID = decodeURIComponent(path.slice('/platform/rooms/'.length));
    return envelope(
      previewRooms.find(item => item.roomID === roomID) ?? previewRooms[0],
    );
  }
  return undefined;
}

function response(
  config: InternalAxiosRequestConfig,
  data: unknown,
): AxiosResponse {
  return { data, status: 200, statusText: 'OK', headers: {}, config };
}

function warChestSetup(players: ReturnType<typeof player>[]) {
  const first = players[0];
  const second = players[1];
  return {
    warchest: {
      mode: 'recommended',
      sides: {
        [first.playerID]: 'oak',
        ...(second ? { [second.playerID]: 'falcon' } : {}),
      },
      rosters: {
        [first.playerID]: ['sword', 'pike', 'crossbow', 'light'],
        ...(second
          ? { [second.playerID]: ['archer', 'cavalry', 'lancer', 'scout'] }
          : {}),
      },
      complete: !!second,
      initialPlayerID: first.playerID,
      initialSide: 'oak',
    },
  };
}

function matchSnapshot(game: PreviewGame, scene: PreviewScene) {
  const current = rooms(game, scene)[0];
  const players = Object.fromEntries(
    current.players.map(item => [item.playerID, item]),
  );
  return {
    schemaVersion: 2,
    type: 'MATCH_SYNC',
    roomID: current.roomID,
    matchID: current.currentMatchID,
    seq: 1,
    phaseVersion: 1,
    turnNumber: 0,
    ownerID: current.ownerPlayerID,
    playerID: profile.user_id,
    visibility: 'private',
    status: 'match',
    maxPlayers: current.maxPlayers,
    playerOrder: current.players.map(item => item.playerID),
    players,
    setup: game === 'warchest'
      ? warChestSetup(current.players)
      : undefined,
  };
}

function installPreviewWebSocket(game: PreviewGame, scene: PreviewScene) {
  const NativeWebSocket = window.WebSocket;
  const snapshot = matchSnapshot(game, scene);

  class PreviewWebSocket {
    static readonly CONNECTING = 0;
    static readonly OPEN = 1;
    static readonly CLOSING = 2;
    static readonly CLOSED = 3;

    readonly url: string;
    readonly protocol = '';
    readonly extensions = '';
    binaryType: BinaryType = 'blob';
    bufferedAmount = 0;
    readyState = PreviewWebSocket.CONNECTING;
    onopen: ((event: Event) => void) | null = null;
    onmessage: ((event: MessageEvent) => void) | null = null;
    onclose: ((event: CloseEvent) => void) | null = null;
    onerror: ((event: Event) => void) | null = null;

    constructor(url: string | URL) {
      this.url = String(url);
      window.setTimeout(() => {
        if (this.readyState !== PreviewWebSocket.CONNECTING) return;
        this.readyState = PreviewWebSocket.OPEN;
        this.onopen?.(new Event('open'));
        this.onmessage?.(new MessageEvent('message', {
          data: JSON.stringify(snapshot),
        }));
      });
    }

    send() {}

    close() {
      if (this.readyState === PreviewWebSocket.CLOSED) return;
      this.readyState = PreviewWebSocket.CLOSED;
      this.onclose?.(new CloseEvent('close', {
        code: 1000,
        reason: 'preview closed',
        wasClean: true,
      }));
    }
  }

  window.WebSocket = PreviewWebSocket as unknown as typeof WebSocket;
  return () => {
    window.WebSocket = NativeWebSocket;
  };
}

export function installGamePreviewEnvironment() {
  const params = new URLSearchParams(window.location.search);
  const game = isPreviewGame(params.get('game'))
    ? params.get('game') as PreviewGame
    : 'othello';
  const scene = isPreviewScene(params.get('scene'))
    ? params.get('scene') as PreviewScene
    : 'lobby';
  const interceptor = apiInstance.interceptors.request.use(config => {
    const data = fixture(config, game, scene);
    if (data !== undefined) {
      config.adapter = async requestConfig =>
        response(requestConfig, fixture(requestConfig, game, scene));
    }
    return config;
  });
  const restoreSocket = installPreviewWebSocket(game, scene);
  return () => {
    apiInstance.interceptors.request.eject(interceptor);
    restoreSocket();
  };
}
