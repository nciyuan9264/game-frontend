import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { apiInstance } from '@/api/request';

const profile = {
  user_id: 'preview-player',
  email: 'player@gamebus.online',
  display_name: '王小明',
  avatar: '',
  roles: ['player'],
};

function player(userID: string, displayName: string, seatIndex = 0) {
  return {
    userID,
    playerID: userID,
    displayName,
    avatar: '',
    seatIndex,
    online: true,
    ai: false,
    ready: true,
  };
}

const me = player(profile.user_id, profile.display_name);
const willow = player('player-willow', '柳岸执黑');
const forest = player('player-forest', '林间落子', 1);

function room(
  roomID: string,
  owner: typeof me,
  status: 'match' | 'playing',
  players: Array<typeof me>,
  occupiedCount: number,
) {
  return {
    roomID,
    gameType: 'othello',
    status,
    visibility: 'public',
    ownerUserID: owner.userID,
    ownerPlayerID: owner.playerID,
    maxPlayers: 2,
    playerCount: players.length,
    currentMatchID: `${roomID.toLowerCase()}-r1`,
    currentMatchStatus: status === 'match' ? 'preparing' : 'playing',
    nextRoundNo: 2,
    createdAt: '2026-11-10T08:05:00Z',
    updatedAt: '2026-11-10T08:20:00Z',
    players,
    metrics: {
      othello: { occupiedCount, progressCurrent: occupiedCount - 4, progressTotal: 60 },
    },
  };
}

const rooms = [
  room('QUIET-7K2M', willow, 'match', [willow], 4),
  room('MOSS-4Q8N', me, 'match', [me], 4),
  room('RIVER-9P3C', willow, 'playing', [willow, forest], 34),
];

function rank(
  userID: string,
  displayName: string,
  totalGames: number,
  wins: number,
  winRate: number,
) {
  return {
    userID,
    playerID: userID,
    displayName,
    avatar: '',
    totalGames,
    metric: { othello: { wins, winRate } },
  };
}

const leaderboard = [
  rank('player-slate', '青石', 48, 33, .688),
  rank(willow.userID, willow.displayName, 41, 27, .659),
  rank(profile.user_id, profile.display_name, 32, 20, .625),
  rank(forest.userID, forest.displayName, 29, 17, .586),
  rank('player-north', '北窗棋客', 24, 13, .542),
  rank('player-lamp', '晚灯', 18, 9, .5),
];

function historyGame(
  id: string,
  roomID: string,
  rival: typeof forest,
  myScore: number,
  rivalScore: number,
  won: boolean,
) {
  const startedAt = `2026-11-0${id}T12:18:00Z`;
  const historyPlayer = (
    playerID: string,
    displayName: string,
    seatIndex: number,
    finalScore: number,
    isWinner: boolean,
  ) => ({
    id: `${id}-${seatIndex}`,
    gameID: `preview-game-${id}`,
    userID: playerID,
    playerID,
    displayName,
    seatIndex,
    isAI: false,
    finalScore,
    finalStocks: 0,
    isWinner,
    createdAt: startedAt,
  });
  return {
    id: `preview-game-${id}`,
    roomID,
    gameType: 'othello',
    startedAt,
    endedAt: startedAt,
    durationSeconds: 1260,
    winnerUserID: won ? me.userID : rival.userID,
    winnerPlayerID: won ? me.playerID : rival.playerID,
    endReason: '双方均无合法落点',
    maxPlayers: 2,
    createdAt: startedAt,
    updatedAt: startedAt,
    players: [
      historyPlayer(me.userID, me.displayName, 0, myScore, won),
      historyPlayer(rival.userID, rival.displayName, 1, rivalScore, !won),
    ],
  };
}

const historyGames = [
  historyGame('9', 'MOSS-4Q8N', forest, 39, 25, true),
  historyGame('8', 'PINE-6T1H', willow, 28, 36, false),
  historyGame('6', 'QUIET-7K2M', forest, 35, 21, true),
];

const envelope = (data: unknown) => ({ status_code: 0, message: 'ok', data });

function fixture(config: InternalAxiosRequestConfig): unknown {
  const path = new URL(config.url ?? '/', window.location.origin)
    .pathname
    .replace(/^\/pam-api/, '');
  if (path === '/platform/auth/profile') return envelope(profile);
  if (path === '/platform/auth/logout') return envelope({});
  if (path === '/platform/auth/acquisition-survey') {
    return envelope({ completed: true, options: [] });
  }
  if (path === '/platform/history/stats') {
    return envelope({ totalGames: 32, wins: 20, winRate: .625, avgScore: 34.6 });
  }
  if (path === '/platform/history/games') {
    return envelope({ games: historyGames });
  }
  if (path === '/platform/rankings') {
    return envelope({ gameType: 'othello', entries: leaderboard });
  }
  if (/^\/platform\/history\/matches\/[^/]+\/result-card$/.test(path)) {
    const draw = new URLSearchParams(window.location.search).get('scene')
      === 'result-draw';
    return envelope({
      game_type: 'othello',
      started_at: '2026-11-10T08:00:00Z',
      ended_at: '2026-11-10T08:24:00Z',
      duration_seconds: 1440,
      players: [
        {
          display_name: me.displayName,
          seat_index: 0,
          is_ai: false,
          final_score: draw ? 32 : 39,
          final_rank: 1,
          final_stocks: 0,
          is_winner: !draw,
          is_self: true,
        },
        {
          display_name: '墨白',
          seat_index: 1,
          is_ai: true,
          final_score: draw ? 32 : 25,
          final_rank: draw ? 1 : 2,
          final_stocks: 0,
          is_winner: false,
          is_self: false,
        },
      ],
    });
  }
  if (path === '/platform/rooms' && config.method === 'post') {
    return envelope(rooms[1]);
  }
  if (path === '/platform/rooms') return envelope({ rooms });
  if (path.startsWith('/platform/rooms/')) {
    const roomID = decodeURIComponent(path.slice('/platform/rooms/'.length));
    return envelope(rooms.find(item => item.roomID === roomID) ?? rooms[0]);
  }
  return undefined;
}

function response(
  config: InternalAxiosRequestConfig,
  data: unknown,
): AxiosResponse {
  return { data, status: 200, statusText: 'OK', headers: {}, config };
}

export function installOthelloPreviewApi() {
  const id = apiInstance.interceptors.request.use(config => {
    if (fixture(config) !== undefined) {
      config.adapter = async requestConfig =>
        response(requestConfig, fixture(requestConfig));
    }
    return config;
  });
  return () => apiInstance.interceptors.request.eject(id);
}
